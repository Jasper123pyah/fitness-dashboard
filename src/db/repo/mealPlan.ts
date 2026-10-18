import { db } from "../db";
import { createId, nowIso } from "../ids";
import type {
  MealCategory,
  MealPlan,
  MealPlanTemplate,
  MealPlanTemplateItem,
  PlannedMeal,
  Recipe,
} from "../types";
import {
  addDaysToKey,
  startOfWeekKey,
  weekdayOfKey,
  weekKeys,
  type DateKey,
} from "@/lib/dates";

export interface PlannedMealWithRecipe extends PlannedMeal {
  recipe: Recipe | null;
}

export interface WeekPlan {
  plan: MealPlan;
  weekStart: DateKey;
  days: {
    date: DateKey;
    meals: Record<MealCategory, PlannedMealWithRecipe | null>;
  }[];
}

const EMPTY_SLOTS: Record<MealCategory, null> = {
  PRE_WORKOUT: null,
  LUNCH: null,
  DINNER: null,
  EVENING_SNACK: null,
};

/** Haalt het weekmenu op en maakt het aan als het nog niet bestaat. */
export async function getOrCreateMealPlan(
  weekStartInput: DateKey,
): Promise<MealPlan> {
  const weekStart = startOfWeekKey(weekStartInput);
  const existing = await db.mealPlans
    .where("weekStart")
    .equals(weekStart)
    .first();
  if (existing) return existing;

  const now = nowIso();
  const plan: MealPlan = {
    id: createId(),
    weekStart,
    createdAt: now,
    updatedAt: now,
  };
  await db.mealPlans.put(plan);
  return plan;
}

export async function getWeekPlan(weekStartInput: DateKey): Promise<WeekPlan> {
  const plan = await getOrCreateMealPlan(weekStartInput);
  const meals = await db.plannedMeals
    .where("mealPlanId")
    .equals(plan.id)
    .toArray();
  const recipes = await db.recipes.bulkGet([
    ...new Set(
      meals
        .map((meal) => meal.recipeId)
        .filter((id): id is string => id != null),
    ),
  ]);
  const recipeById = new Map(
    recipes
      .filter((item): item is Recipe => item != null)
      .map((item) => [item.id, item]),
  );

  return {
    plan,
    weekStart: plan.weekStart,
    days: weekKeys(plan.weekStart).map((date) => {
      const slots: Record<MealCategory, PlannedMealWithRecipe | null> = {
        ...EMPTY_SLOTS,
      };
      for (const meal of meals.filter((item) => item.date === date)) {
        slots[meal.slot] = {
          ...meal,
          recipe: meal.recipeId
            ? (recipeById.get(meal.recipeId) ?? null)
            : null,
        };
      }
      return { date, meals: slots };
    }),
  };
}

export async function getMealsForDate(
  date: DateKey,
): Promise<PlannedMealWithRecipe[]> {
  const meals = await db.plannedMeals.where("date").equals(date).toArray();
  const recipes = await db.recipes.bulkGet(
    meals.map((meal) => meal.recipeId).filter((id): id is string => id != null),
  );
  const recipeById = new Map(
    recipes
      .filter((item): item is Recipe => item != null)
      .map((item) => [item.id, item]),
  );

  return meals.map((meal) => ({
    ...meal,
    recipe: meal.recipeId ? (recipeById.get(meal.recipeId) ?? null) : null,
  }));
}

export interface SetMealInput {
  date: DateKey;
  slot: MealCategory;
  recipeId?: string;
  customTitle?: string;
  servings?: number;
  memberIds?: string[];
  note?: string;
}

/** Zet (of vervangt) een maaltijd in een slot. Eén slot houdt één maaltijd. */
export async function setPlannedMeal(input: SetMealInput): Promise<string> {
  const plan = await getOrCreateMealPlan(input.date);

  const existing = await db.plannedMeals
    .where("[mealPlanId+date]")
    .equals([plan.id, input.date])
    .and((meal) => meal.slot === input.slot)
    .first();

  const id = existing?.id ?? createId();
  await db.plannedMeals.put({
    id,
    mealPlanId: plan.id,
    date: input.date,
    slot: input.slot,
    recipeId: input.recipeId,
    customTitle: input.customTitle,
    servings: input.servings ?? existing?.servings ?? 1,
    memberIds: input.memberIds ?? existing?.memberIds ?? [],
    note: input.note ?? existing?.note,
  });
  await db.mealPlans.update(plan.id, { updatedAt: nowIso() });
  return id;
}

export async function updatePlannedMeal(
  id: string,
  patch: Partial<
    Pick<
      PlannedMeal,
      "servings" | "memberIds" | "note" | "recipeId" | "customTitle"
    >
  >,
): Promise<void> {
  await db.plannedMeals.update(id, patch);
}

export async function removePlannedMeal(id: string): Promise<void> {
  await db.plannedMeals.delete(id);
}

/** Kopieert één maaltijd naar een of meer andere datums. */
export async function copyMealToDates(
  mealId: string,
  dates: DateKey[],
): Promise<void> {
  const meal = await db.plannedMeals.get(mealId);
  if (!meal) return;

  for (const date of dates) {
    await setPlannedMeal({
      date,
      slot: meal.slot,
      recipeId: meal.recipeId,
      customTitle: meal.customTitle,
      servings: meal.servings,
      memberIds: meal.memberIds,
      note: meal.note,
    });
  }
}

/** Kopieert een hele dag naar een andere dag. */
export async function copyDay(from: DateKey, to: DateKey): Promise<void> {
  const meals = await db.plannedMeals.where("date").equals(from).toArray();
  for (const meal of meals) {
    await setPlannedMeal({
      date: to,
      slot: meal.slot,
      recipeId: meal.recipeId,
      customTitle: meal.customTitle,
      servings: meal.servings,
      memberIds: meal.memberIds,
      note: meal.note,
    });
  }
}

export async function clearDay(date: DateKey): Promise<void> {
  await db.plannedMeals.where("date").equals(date).delete();
}

export async function clearWeek(weekStart: DateKey): Promise<void> {
  const plan = await getOrCreateMealPlan(weekStart);
  await db.plannedMeals.where("mealPlanId").equals(plan.id).delete();
}

/** Kopieert het hele weekmenu naar de week erna. */
export async function copyWeek(
  fromWeekStart: DateKey,
  toWeekStart: DateKey,
): Promise<void> {
  const source = await getOrCreateMealPlan(fromWeekStart);
  const meals = await db.plannedMeals
    .where("mealPlanId")
    .equals(source.id)
    .toArray();

  for (const meal of meals) {
    const offset = weekdayOfKey(meal.date) - 1;
    await setPlannedMeal({
      date: addDaysToKey(startOfWeekKey(toWeekStart), offset),
      slot: meal.slot,
      recipeId: meal.recipeId,
      customTitle: meal.customTitle,
      servings: meal.servings,
      memberIds: meal.memberIds,
      note: meal.note,
    });
  }
}

// ------------------------------------------------------------------ sjablonen

export interface TemplateWithItems extends MealPlanTemplate {
  items: (MealPlanTemplateItem & { recipe: Recipe | null })[];
}

export async function listTemplates(): Promise<TemplateWithItems[]> {
  const [templates, items, recipes] = await Promise.all([
    db.mealPlanTemplates.orderBy("name").toArray(),
    db.mealPlanTemplateItems.toArray(),
    db.recipes.toArray(),
  ]);
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  return templates.map((template) => ({
    ...template,
    items: items
      .filter((item) => item.templateId === template.id)
      .sort((a, b) => a.weekday - b.weekday)
      .map((item) => ({
        ...item,
        recipe: recipeById.get(item.recipeId) ?? null,
      })),
  }));
}

/** Bewaart het weekmenu van een week als herbruikbaar sjabloon. */
export async function saveWeekAsTemplate(
  weekStart: DateKey,
  name: string,
  description?: string,
): Promise<string> {
  const plan = await getOrCreateMealPlan(weekStart);
  const meals = await db.plannedMeals
    .where("mealPlanId")
    .equals(plan.id)
    .toArray();
  const now = nowIso();

  const existing = await db.mealPlanTemplates
    .filter(
      (template) => template.name.toLowerCase() === name.trim().toLowerCase(),
    )
    .first();
  const templateId = existing?.id ?? createId();

  await db.transaction(
    "rw",
    [db.mealPlanTemplates, db.mealPlanTemplateItems],
    async () => {
      await db.mealPlanTemplates.put({
        id: templateId,
        name: name.trim(),
        description,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      await db.mealPlanTemplateItems
        .where("templateId")
        .equals(templateId)
        .delete();
      await db.mealPlanTemplateItems.bulkPut(
        meals
          .filter((meal) => meal.recipeId != null)
          .map((meal) => ({
            id: createId(),
            templateId,
            weekday: weekdayOfKey(meal.date),
            slot: meal.slot,
            recipeId: meal.recipeId as string,
            servings: meal.servings,
            memberIds: meal.memberIds,
          })),
      );
    },
  );

  return templateId;
}

export async function applyTemplateToWeek(
  templateId: string,
  weekStart: DateKey,
  options: { replaceExisting?: boolean } = {},
): Promise<void> {
  const items = await db.mealPlanTemplateItems
    .where("templateId")
    .equals(templateId)
    .toArray();
  const monday = startOfWeekKey(weekStart);

  if (options.replaceExisting) await clearWeek(monday);

  for (const item of items) {
    await setPlannedMeal({
      date: addDaysToKey(monday, item.weekday - 1),
      slot: item.slot,
      recipeId: item.recipeId,
      servings: item.servings,
      memberIds: item.memberIds,
    });
  }
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<MealPlanTemplate, "name" | "description">>,
): Promise<void> {
  await db.mealPlanTemplates.update(id, { ...patch, updatedAt: nowIso() });
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.mealPlanTemplates, db.mealPlanTemplateItems],
    async () => {
      await db.mealPlanTemplateItems.where("templateId").equals(id).delete();
      await db.mealPlanTemplates.delete(id);
    },
  );
}

export async function updateTemplateItem(
  id: string,
  patch: Partial<
    Pick<MealPlanTemplateItem, "servings" | "recipeId" | "memberIds">
  >,
): Promise<void> {
  await db.mealPlanTemplateItems.update(id, patch);
}

export async function deleteTemplateItem(id: string): Promise<void> {
  await db.mealPlanTemplateItems.delete(id);
}
