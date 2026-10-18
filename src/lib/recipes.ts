import type { Ingredient, Recipe, RecipeIngredient, Unit } from "@/db/types";
import { normalizeQuantity, roundQuantity } from "@/lib/units";

export interface ScaledIngredient {
  recipeIngredientId: string;
  ingredientId: string;
  name: string;
  /** Hoeveelheid voor het gevraagde aantal porties, afgerond op twee decimalen. */
  quantity: number;
  unit: Unit;
  note?: string;
  sortOrder: number;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
}

/**
 * De factor waarmee een recept wordt geschaald. Een recept voor 2 personen dat
 * voor 3 porties wordt gebruikt krijgt factor 1,5.
 */
export function servingFactor(
  baseServings: number,
  targetServings: number,
): number {
  if (!Number.isFinite(baseServings) || baseServings <= 0) return 1;
  if (!Number.isFinite(targetServings) || targetServings <= 0) return 0;
  return targetServings / baseServings;
}

/** Schaalt één hoeveelheid mee met het aantal porties. */
export function scaleQuantity(
  quantity: number,
  baseServings: number,
  targetServings: number,
): number {
  return roundQuantity(quantity * servingFactor(baseServings, targetServings));
}

/**
 * Schaalt alle ingrediënten van een recept naar het gevraagde aantal porties.
 * De eenheid blijft die van het recept: 200 g rijst voor 3 personen wordt
 * 300 g rijst, niet 0,3 kg. Pas op de boodschappenlijst wordt er samengevoegd
 * en naar een leesbare eenheid omgerekend.
 */
export function scaleRecipeIngredients(
  recipe: RecipeWithIngredients,
  targetServings: number,
): ScaledIngredient[] {
  const factor = servingFactor(recipe.servings, targetServings);

  return [...recipe.ingredients]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      recipeIngredientId: item.id,
      ingredientId: item.ingredientId,
      name: item.ingredient.name,
      quantity: roundQuantity(item.quantity * factor),
      unit: item.unit,
      note: item.note,
      sortOrder: item.sortOrder,
    }));
}

/** Zelfde schaling, maar met de prettigst leesbare eenheid (1500 g wordt 1,5 kg). */
export function scaleRecipeIngredientsNormalized(
  recipe: RecipeWithIngredients,
  targetServings: number,
): ScaledIngredient[] {
  return scaleRecipeIngredients(recipe, targetServings).map((item) => {
    const normalized = normalizeQuantity(item.quantity, item.unit);
    return {
      ...item,
      quantity: roundQuantity(normalized.quantity),
      unit: normalized.unit,
    };
  });
}

/** Geschatte voedingswaarde voor een aantal porties, als die bekend is. */
export function scaleNutrition(recipe: Recipe, targetServings: number) {
  if (
    recipe.kcalPerServing == null &&
    recipe.proteinPerServing == null &&
    recipe.carbsPerServing == null &&
    recipe.fatPerServing == null
  ) {
    return null;
  }

  const servings =
    Number.isFinite(targetServings) && targetServings > 0 ? targetServings : 0;
  return {
    kcal:
      recipe.kcalPerServing == null
        ? null
        : Math.round(recipe.kcalPerServing * servings),
    protein:
      recipe.proteinPerServing == null
        ? null
        : roundQuantity(recipe.proteinPerServing * servings),
    carbs:
      recipe.carbsPerServing == null
        ? null
        : roundQuantity(recipe.carbsPerServing * servings),
    fat:
      recipe.fatPerServing == null
        ? null
        : roundQuantity(recipe.fatPerServing * servings),
  };
}

/** Markeert recepten die een ingrediënt uit de uitsluitlijst gebruiken. */
export function findExcludedIngredients(
  recipe: RecipeWithIngredients,
  excluded: string[],
): string[] {
  if (excluded.length === 0) return [];
  const needles = excluded
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  const hits = new Set<string>();
  for (const item of recipe.ingredients) {
    const name = item.ingredient.name.toLowerCase();
    for (const needle of needles) {
      if (name.includes(needle)) hits.add(item.ingredient.name);
    }
  }
  return [...hits];
}
