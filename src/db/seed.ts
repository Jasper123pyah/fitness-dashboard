import { db, getMeta, META_KEYS, setMeta } from "./db";
import { createId, nowIso } from "./ids";
import {
  SEED_EXERCISES,
  SEED_INGREDIENTS,
  SEED_PROGRAM,
  SEED_RECIPES,
  SEED_TEMPLATE,
  SEED_VERSION,
} from "./seed-data";
import type { AppSettings, HouseholdMember } from "./types";
import { addDaysToKey, startOfWeekKey, todayKey } from "@/lib/dates";

export const DEFAULT_SETTINGS: Omit<AppSettings, "updatedAt"> = {
  id: "settings",
  name: "Ik",
  heightCm: 183,
  startWeightKg: 75,
  goal: "RECOMP",
  trainingDays: [1, 2, 4, 5],
  weightUnit: "KG",
  defaultRestSeconds: 120,
  preferredWorkoutTime: "12:30",
  dietaryPreference: "VEGETARIAN_PLUS_CHICKEN",
  excludedIngredients: ["brood", "pindakaas"],
  proteinTargetMinG: 120,
  proteinTargetMaxG: 140,
  showNutritionInfo: false,
  theme: "SYSTEM",
  compoundIncrementKg: 2.5,
  isolationIncrementKg: 1.25,
};

/**
 * Zet de standaardinhoud klaar: instellingen, huisgenoten, oefeningen, het
 * trainingsschema, recepten en een weekmenu voor deze week.
 *
 * Draait één keer. Bij een volgende versie van de app blijft alles wat de
 * gebruiker zelf heeft ingevoerd staan; er wordt alleen aangevuld wat nog
 * ontbreekt.
 */
export async function seedDatabase(): Promise<void> {
  const seeded = await getMeta<number>(META_KEYS.seedVersion);
  if (seeded != null && seeded >= SEED_VERSION) return;

  const now = nowIso();

  await db.transaction(
    "rw",
    [
      db.settings,
      db.householdMembers,
      db.exercises,
      db.programs,
      db.workoutDays,
      db.workoutDayExercises,
      db.ingredients,
      db.recipes,
      db.recipeIngredients,
      db.mealPlans,
      db.plannedMeals,
      db.mealPlanTemplates,
      db.mealPlanTemplateItems,
      db.meta,
    ],
    async () => {
      if ((await db.settings.count()) === 0) {
        await db.settings.put({ ...DEFAULT_SETTINGS, updatedAt: now });
      }

      if ((await db.householdMembers.count()) === 0) {
        const members: HouseholdMember[] = [
          {
            id: "member-self",
            name: "Ik",
            isVegetarian: false,
            eatsDinner: true,
            isSelf: true,
            sortOrder: 0,
          },
          {
            id: "member-partner",
            name: "Partner",
            isVegetarian: true,
            eatsDinner: true,
            isSelf: false,
            sortOrder: 1,
          },
        ];
        await db.householdMembers.bulkPut(members);
      }

      // Oefeningen: alleen toevoegen wat nog niet bestaat, nooit overschrijven.
      const existingExerciseIds = new Set(
        await db.exercises.toCollection().primaryKeys(),
      );
      const newExercises = SEED_EXERCISES.filter(
        (item) => !existingExerciseIds.has(item.id),
      ).map((item) => ({
        ...item,
        isCustom: item.isCustom ?? false,
        createdAt: now,
        updatedAt: now,
      }));
      if (newExercises.length > 0) await db.exercises.bulkPut(newExercises);

      if ((await db.programs.count()) === 0) {
        await db.programs.put({
          id: SEED_PROGRAM.id,
          name: SEED_PROGRAM.name,
          description: SEED_PROGRAM.description,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        await db.workoutDays.bulkPut(
          SEED_PROGRAM.days.map((day, index) => ({
            id: day.id,
            programId: SEED_PROGRAM.id,
            name: day.name,
            weekday: day.weekday,
            sortOrder: index,
            notes: day.notes,
          })),
        );

        await db.workoutDayExercises.bulkPut(
          SEED_PROGRAM.days.flatMap((day) =>
            day.exercises.map((item, index) => ({
              id: `${day.id}-${item.exerciseId}-${index}`,
              workoutDayId: day.id,
              exerciseId: item.exerciseId,
              sortOrder: index,
              sets: item.sets,
              repMin: item.repMin,
              repMax: item.repMax,
              restSeconds: item.restSeconds,
            })),
          ),
        );
      }

      const existingIngredientIds = new Set(
        await db.ingredients.toCollection().primaryKeys(),
      );
      const newIngredients = SEED_INGREDIENTS.filter(
        (item) => !existingIngredientIds.has(item.id),
      );
      if (newIngredients.length > 0)
        await db.ingredients.bulkPut(newIngredients);

      const existingRecipeIds = new Set(
        await db.recipes.toCollection().primaryKeys(),
      );
      const newRecipes = SEED_RECIPES.filter(
        (item) => !existingRecipeIds.has(item.id),
      );
      if (newRecipes.length > 0) {
        await db.recipes.bulkPut(
          newRecipes.map(({ ingredients: _ingredients, ...recipe }) => ({
            ...recipe,
            isFavorite: false,
            isCustom: false,
            createdAt: now,
            updatedAt: now,
          })),
        );

        await db.recipeIngredients.bulkPut(
          newRecipes.flatMap((recipe) =>
            recipe.ingredients.map((item, index) => ({
              id: `${recipe.id}-${item.ingredientId}-${index}`,
              recipeId: recipe.id,
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              unit: item.unit,
              note: item.note,
              sortOrder: index,
            })),
          ),
        );
      }

      if ((await db.mealPlanTemplates.count()) === 0) {
        await db.mealPlanTemplates.put({
          id: SEED_TEMPLATE.id,
          name: SEED_TEMPLATE.name,
          description: SEED_TEMPLATE.description,
          createdAt: now,
          updatedAt: now,
        });
        await db.mealPlanTemplateItems.bulkPut(
          SEED_TEMPLATE.items.map((item) => ({
            id: `${SEED_TEMPLATE.id}-${item.weekday}-${item.slot}`,
            templateId: SEED_TEMPLATE.id,
            weekday: item.weekday,
            slot: item.slot,
            recipeId: item.recipeId,
            servings: item.servings,
            memberIds:
              item.slot === "DINNER"
                ? ["member-self", "member-partner"]
                : ["member-self"],
          })),
        );
      }

      // Weekmenu voor deze week, zodat het dashboard direct iets te laten zien heeft.
      if ((await db.mealPlans.count()) === 0) {
        const weekStart = startOfWeekKey(todayKey());
        const planId = createId();
        await db.mealPlans.put({
          id: planId,
          weekStart,
          createdAt: now,
          updatedAt: now,
        });
        await db.plannedMeals.bulkPut(
          SEED_TEMPLATE.items.map((item) => ({
            id: createId(),
            mealPlanId: planId,
            date: addDaysToKey(weekStart, item.weekday - 1),
            slot: item.slot,
            recipeId: item.recipeId,
            servings: item.servings,
            memberIds:
              item.slot === "DINNER"
                ? ["member-self", "member-partner"]
                : ["member-self"],
          })),
        );
      }

      await setMeta(META_KEYS.seedVersion, SEED_VERSION);
      if ((await getMeta<string>(META_KEYS.installedAt)) == null) {
        await setMeta(META_KEYS.installedAt, now);
      }
    },
  );
}

/** Wist alles en zet de standaardinhoud opnieuw klaar. Alleen vanuit instellingen. */
export async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
  await seedDatabase();
}
