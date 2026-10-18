import { describe, expect, it } from "vitest";

import type { Ingredient, Recipe, RecipeIngredient } from "@/db/types";
import {
  findExcludedIngredients,
  scaleNutrition,
  scaleQuantity,
  scaleRecipeIngredients,
  scaleRecipeIngredientsNormalized,
  servingFactor,
  type RecipeWithIngredients,
} from "./recipes";

function ingredient(id: string, name: string): Ingredient {
  return { id, name, category: "OTHER", baseUnit: "GRAM" };
}

function link(
  id: string,
  ingredientId: string,
  quantity: number,
  unit: RecipeIngredient["unit"],
  sortOrder = 0,
): RecipeIngredient {
  return { id, recipeId: "recipe-1", ingredientId, quantity, unit, sortOrder };
}

const baseRecipe: Recipe = {
  id: "recipe-1",
  name: "Rijstbowl",
  category: "DINNER",
  instructions: "Koken.",
  prepMinutes: 20,
  servings: 2,
  isVegetarian: true,
  isFavorite: false,
  isCustom: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  kcalPerServing: 600,
  proteinPerServing: 30,
  carbsPerServing: 70,
  fatPerServing: 20,
};

const recipe: RecipeWithIngredients = {
  ...baseRecipe,
  ingredients: [
    {
      ...link("ri-1", "ing-rijst", 200, "GRAM", 0),
      ingredient: ingredient("ing-rijst", "Rijst"),
    },
    {
      ...link("ri-2", "ing-paprika", 1, "PIECE", 1),
      ingredient: ingredient("ing-paprika", "Paprika"),
    },
    {
      ...link("ri-3", "ing-olie", 1, "TABLESPOON", 2),
      ingredient: ingredient("ing-olie", "Olijfolie"),
    },
  ],
};

describe("porties omrekenen", () => {
  it("berekent de factor tussen porties", () => {
    expect(servingFactor(2, 3)).toBe(1.5);
    expect(servingFactor(2, 2)).toBe(1);
    expect(servingFactor(4, 1)).toBe(0.25);
  });

  it("gaat veilig om met onmogelijke waarden", () => {
    expect(servingFactor(0, 3)).toBe(1);
    expect(servingFactor(2, 0)).toBe(0);
    expect(servingFactor(Number.NaN, 2)).toBe(1);
  });

  it("schaalt 200 g rijst voor 2 personen naar 300 g voor 3 personen", () => {
    const scaled = scaleRecipeIngredients(recipe, 3);
    expect(scaled[0]).toMatchObject({
      name: "Rijst",
      quantity: 300,
      unit: "GRAM",
    });
  });

  it("schaalt alle ingrediënten mee en houdt de volgorde aan", () => {
    const scaled = scaleRecipeIngredients(recipe, 4);
    expect(scaled.map((item) => [item.name, item.quantity, item.unit])).toEqual(
      [
        ["Rijst", 400, "GRAM"],
        ["Paprika", 2, "PIECE"],
        ["Olijfolie", 2, "TABLESPOON"],
      ],
    );
  });

  it("ondersteunt halve porties met gebroken hoeveelheden", () => {
    const scaled = scaleRecipeIngredients(recipe, 1);
    expect(scaled.map((item) => item.quantity)).toEqual([100, 0.5, 0.5]);
  });

  it("rondt af op twee decimalen", () => {
    expect(scaleQuantity(200, 3, 1)).toBe(66.67);
    expect(scaleQuantity(1, 3, 2)).toBe(0.67);
  });

  it("laat de eenheid van het recept staan bij gewoon schalen", () => {
    const big = scaleRecipeIngredients(recipe, 16);
    expect(big[0]).toMatchObject({ quantity: 1600, unit: "GRAM" });
  });

  it("kiest wel een leesbare eenheid in de genormaliseerde variant", () => {
    const big = scaleRecipeIngredientsNormalized(recipe, 16);
    expect(big[0]).toMatchObject({ quantity: 1.6, unit: "KILOGRAM" });
    expect(big[1]).toMatchObject({ quantity: 8, unit: "PIECE" });
  });

  it("schaalt de voedingswaarde mee", () => {
    expect(scaleNutrition(baseRecipe, 2)).toEqual({
      kcal: 1200,
      protein: 60,
      carbs: 140,
      fat: 40,
    });
    expect(
      scaleNutrition(
        {
          ...baseRecipe,
          kcalPerServing: undefined,
          proteinPerServing: undefined,
          carbsPerServing: undefined,
          fatPerServing: undefined,
        },
        2,
      ),
    ).toBeNull();
  });

  it("vindt ingrediënten die op de uitsluitlijst staan", () => {
    const withBread: RecipeWithIngredients = {
      ...recipe,
      ingredients: [
        {
          ...link("ri-4", "ing-brood", 1, "PIECE"),
          ingredient: ingredient("ing-brood", "Turks brood"),
        },
      ],
    };
    expect(findExcludedIngredients(withBread, ["brood", "pindakaas"])).toEqual([
      "Turks brood",
    ]);
    expect(findExcludedIngredients(recipe, ["brood"])).toEqual([]);
    expect(findExcludedIngredients(withBread, [])).toEqual([]);
  });
});
