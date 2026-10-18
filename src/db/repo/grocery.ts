import { db } from "../db";
import { createId, nowIso } from "../ids";
import type {
  GroceryItem,
  GroceryList,
  Ingredient,
  ShoppingCategory,
  Unit,
} from "../types";
import { aggregateIngredients, mergeGroceryItems } from "@/lib/grocery";
import { startOfWeekKey, type DateKey } from "@/lib/dates";
import { getOrCreateMealPlan } from "./mealPlan";
import { listRecipesWithIngredients } from "./recipes";

export interface GroceryListWithItems extends GroceryList {
  items: GroceryItem[];
}

export async function getGroceryList(
  weekStartInput: DateKey,
): Promise<GroceryListWithItems | null> {
  const weekStart = startOfWeekKey(weekStartInput);
  const list = await db.groceryLists
    .where("weekStart")
    .equals(weekStart)
    .first();
  if (!list) return null;

  const items = await db.groceryItems
    .where("groceryListId")
    .equals(list.id)
    .sortBy("sortOrder");
  return { ...list, items };
}

/**
 * Genereert de boodschappenlijst voor een week uit het weekmenu.
 *
 * Bestaande regels blijven zoveel mogelijk intact: zelf toegevoegde items en
 * handmatig aangepaste hoeveelheden overleven het opnieuw genereren, en wat al
 * is afgevinkt blijft afgevinkt zolang de hoeveelheid niet verandert.
 */
export async function generateGroceryList(
  weekStartInput: DateKey,
): Promise<GroceryListWithItems> {
  const weekStart = startOfWeekKey(weekStartInput);
  const plan = await getOrCreateMealPlan(weekStart);

  const [meals, recipes, ingredients] = await Promise.all([
    db.plannedMeals.where("mealPlanId").equals(plan.id).toArray(),
    listRecipesWithIngredients(),
    db.ingredients.toArray(),
  ]);

  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const ingredientsById = new Map<string, Ingredient>(
    ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );

  const generated = aggregateIngredients(
    meals.map((meal) => ({
      meal,
      recipe: meal.recipeId ? recipeById.get(meal.recipeId) : undefined,
    })),
    ingredientsById,
  );

  const existingList = await db.groceryLists
    .where("mealPlanId")
    .equals(plan.id)
    .first();
  const now = nowIso();
  const listId = existingList?.id ?? createId();
  const existingItems = existingList
    ? await db.groceryItems.where("groceryListId").equals(listId).toArray()
    : [];

  const { keep, upsert, removeIds } = mergeGroceryItems(
    existingItems,
    generated,
  );

  await db.transaction("rw", [db.groceryLists, db.groceryItems], async () => {
    await db.groceryLists.put({
      id: listId,
      mealPlanId: plan.id,
      weekStart,
      generatedAt: now,
      updatedAt: now,
    });

    if (removeIds.length > 0) await db.groceryItems.bulkDelete(removeIds);

    const keptIds = new Set(keep.map((item) => item.id));
    const toReplace = existingItems
      .filter((item) => !keptIds.has(item.id) && !removeIds.includes(item.id))
      .map((item) => item.id);
    if (toReplace.length > 0) await db.groceryItems.bulkDelete(toReplace);

    await db.groceryItems.bulkPut(
      upsert.map((item, index) => ({
        ...item,
        id: createId(),
        groceryListId: listId,
        sortOrder: index,
      })),
    );
  });

  const result = await getGroceryList(weekStart);
  if (!result) throw new Error("Boodschappenlijst kon niet worden gemaakt");
  return result;
}

export async function toggleGroceryItem(id: string): Promise<void> {
  const item = await db.groceryItems.get(id);
  if (!item) return;
  await db.groceryItems.update(id, { checked: !item.checked });
}

export async function setAllChecked(
  listId: string,
  checked: boolean,
): Promise<void> {
  const items = await db.groceryItems
    .where("groceryListId")
    .equals(listId)
    .toArray();
  await db.groceryItems.bulkPut(items.map((item) => ({ ...item, checked })));
}

export async function addCustomGroceryItem(input: {
  listId: string;
  name: string;
  quantity?: number | null;
  unit?: Unit | null;
  category?: ShoppingCategory;
}): Promise<string> {
  const id = createId();
  const count = await db.groceryItems
    .where("groceryListId")
    .equals(input.listId)
    .count();

  await db.groceryItems.put({
    id,
    groceryListId: input.listId,
    name: input.name.trim(),
    quantity: input.quantity ?? null,
    unit: input.unit ?? null,
    category: input.category ?? "OTHER",
    checked: false,
    isCustom: true,
    isEdited: false,
    sortOrder: count,
  });
  return id;
}

export async function updateGroceryItem(
  id: string,
  patch: Partial<
    Pick<GroceryItem, "name" | "quantity" | "unit" | "category" | "note">
  >,
): Promise<void> {
  // Een handmatige wijziging markeren, zodat opnieuw genereren hem niet overschrijft.
  await db.groceryItems.update(id, { ...patch, isEdited: true });
}

export async function deleteGroceryItem(id: string): Promise<void> {
  await db.groceryItems.delete(id);
}

export async function clearCheckedItems(listId: string): Promise<void> {
  const items = await db.groceryItems
    .where("groceryListId")
    .equals(listId)
    .and((item) => item.checked)
    .toArray();
  await db.groceryItems.bulkDelete(items.map((item) => item.id));
}
