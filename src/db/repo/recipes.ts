import { db } from "../db";
import { createId, nowIso } from "../ids";
import type {
  Ingredient,
  MealCategory,
  Recipe,
  RecipeIngredient,
  Unit,
} from "../types";
import type { RecipeWithIngredients } from "@/lib/recipes";

export function listIngredients(): Promise<Ingredient[]> {
  return db.ingredients.orderBy("name").toArray();
}

export async function upsertIngredientByName(input: {
  name: string;
  category?: Ingredient["category"];
  baseUnit?: Unit;
}): Promise<Ingredient> {
  const name = input.name.trim();
  const existing = await db.ingredients
    .filter((item) => item.name.toLowerCase() === name.toLowerCase())
    .first();
  if (existing) return existing;

  const ingredient: Ingredient = {
    id: createId(),
    name,
    category: input.category ?? "OTHER",
    baseUnit: input.baseUnit ?? "GRAM",
  };
  await db.ingredients.put(ingredient);
  return ingredient;
}

export async function updateIngredient(
  id: string,
  patch: Partial<Omit<Ingredient, "id">>,
): Promise<void> {
  await db.ingredients.update(id, patch);
}

export function listRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy("name").toArray();
}

export async function getRecipeWithIngredients(
  recipeId: string,
): Promise<RecipeWithIngredients | null> {
  const recipe = await db.recipes.get(recipeId);
  if (!recipe) return null;

  const links = await db.recipeIngredients
    .where("recipeId")
    .equals(recipeId)
    .sortBy("sortOrder");
  const ingredients = await db.ingredients.bulkGet(
    links.map((link) => link.ingredientId),
  );
  const byId = new Map(
    ingredients
      .filter((item): item is Ingredient => item != null)
      .map((item) => [item.id, item]),
  );

  return {
    ...recipe,
    ingredients: links
      .map((link) => {
        const ingredient = byId.get(link.ingredientId);
        return ingredient ? { ...link, ingredient } : null;
      })
      .filter(
        (item): item is RecipeIngredient & { ingredient: Ingredient } =>
          item != null,
      ),
  };
}

/** Alle recepten met hun ingrediënten; nodig voor de boodschappenlijst. */
export async function listRecipesWithIngredients(): Promise<
  RecipeWithIngredients[]
> {
  const [recipes, links, ingredients] = await Promise.all([
    db.recipes.orderBy("name").toArray(),
    db.recipeIngredients.toArray(),
    db.ingredients.toArray(),
  ]);

  const ingredientById = new Map(ingredients.map((item) => [item.id, item]));
  const linksByRecipe = new Map<string, RecipeIngredient[]>();
  for (const link of links) {
    const list = linksByRecipe.get(link.recipeId);
    if (list) list.push(link);
    else linksByRecipe.set(link.recipeId, [link]);
  }

  return recipes.map((recipe) => ({
    ...recipe,
    ingredients: (linksByRecipe.get(recipe.id) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((link) => {
        const ingredient = ingredientById.get(link.ingredientId);
        return ingredient ? { ...link, ingredient } : null;
      })
      .filter(
        (item): item is RecipeIngredient & { ingredient: Ingredient } =>
          item != null,
      ),
  }));
}

export interface RecipeInput {
  name: string;
  description?: string;
  category: MealCategory;
  instructions: string;
  prepMinutes: number;
  servings: number;
  isVegetarian: boolean;
  imageUrl?: string;
  kcalPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: Unit;
    note?: string;
    category?: Ingredient["category"];
  }[];
}

export async function createRecipe(input: RecipeInput): Promise<string> {
  const id = createId();
  const now = nowIso();

  const ingredientIds: string[] = [];
  for (const item of input.ingredients) {
    const ingredient = await upsertIngredientByName({
      name: item.name,
      category: item.category,
      baseUnit: item.unit,
    });
    ingredientIds.push(ingredient.id);
  }

  await db.transaction("rw", [db.recipes, db.recipeIngredients], async () => {
    await db.recipes.put({
      id,
      name: input.name.trim(),
      description: input.description,
      category: input.category,
      instructions: input.instructions,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      isVegetarian: input.isVegetarian,
      imageUrl: input.imageUrl,
      kcalPerServing: input.kcalPerServing,
      proteinPerServing: input.proteinPerServing,
      carbsPerServing: input.carbsPerServing,
      fatPerServing: input.fatPerServing,
      isFavorite: false,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.recipeIngredients.bulkPut(
      input.ingredients.map((item, index) => ({
        id: createId(),
        recipeId: id,
        ingredientId: ingredientIds[index],
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        sortOrder: index,
      })),
    );
  });

  return id;
}

export async function updateRecipe(
  recipeId: string,
  input: RecipeInput,
): Promise<void> {
  const existing = await db.recipes.get(recipeId);
  if (!existing) throw new Error("Recept niet gevonden");

  const ingredientIds: string[] = [];
  for (const item of input.ingredients) {
    const ingredient = await upsertIngredientByName({
      name: item.name,
      category: item.category,
      baseUnit: item.unit,
    });
    ingredientIds.push(ingredient.id);
  }

  await db.transaction("rw", [db.recipes, db.recipeIngredients], async () => {
    await db.recipes.put({
      ...existing,
      name: input.name.trim(),
      description: input.description,
      category: input.category,
      instructions: input.instructions,
      prepMinutes: input.prepMinutes,
      servings: input.servings,
      isVegetarian: input.isVegetarian,
      imageUrl: input.imageUrl,
      kcalPerServing: input.kcalPerServing,
      proteinPerServing: input.proteinPerServing,
      carbsPerServing: input.carbsPerServing,
      fatPerServing: input.fatPerServing,
      updatedAt: nowIso(),
    });

    await db.recipeIngredients.where("recipeId").equals(recipeId).delete();
    await db.recipeIngredients.bulkPut(
      input.ingredients.map((item, index) => ({
        id: createId(),
        recipeId,
        ingredientId: ingredientIds[index],
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        sortOrder: index,
      })),
    );
  });
}

export async function toggleRecipeFavorite(recipeId: string): Promise<void> {
  const recipe = await db.recipes.get(recipeId);
  if (!recipe) return;
  await db.recipes.update(recipeId, {
    isFavorite: !recipe.isFavorite,
    updatedAt: nowIso(),
  });
}

export interface DeleteRecipeResult {
  deleted: boolean;
  plannedCount: number;
  templateCount: number;
}

/**
 * Verwijdert een recept. Staat het nog in een weekmenu of sjabloon, dan vraagt
 * de app eerst om bevestiging voordat die verwijzingen worden losgelaten.
 */
export async function deleteRecipe(
  recipeId: string,
  force = false,
): Promise<DeleteRecipeResult> {
  const plannedCount = await db.plannedMeals
    .where("recipeId")
    .equals(recipeId)
    .count();
  const templateCount = await db.mealPlanTemplateItems
    .where("recipeId")
    .equals(recipeId)
    .count();

  if (!force && (plannedCount > 0 || templateCount > 0)) {
    return { deleted: false, plannedCount, templateCount };
  }

  await db.transaction(
    "rw",
    [
      db.recipes,
      db.recipeIngredients,
      db.plannedMeals,
      db.mealPlanTemplateItems,
    ],
    async () => {
      await db.recipeIngredients.where("recipeId").equals(recipeId).delete();
      await db.plannedMeals.where("recipeId").equals(recipeId).delete();
      await db.mealPlanTemplateItems
        .where("recipeId")
        .equals(recipeId)
        .delete();
      await db.recipes.delete(recipeId);
    },
  );

  return { deleted: true, plannedCount, templateCount };
}
