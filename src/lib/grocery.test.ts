import { describe, expect, it } from "vitest";

import type {
  GroceryItem,
  Ingredient,
  PlannedMeal,
  Recipe,
  RecipeIngredient,
  Unit,
} from "@/db/types";
import { aggregateIngredients, mergeGroceryItems } from "./grocery";
import type { RecipeWithIngredients } from "./recipes";

const ingredients: Ingredient[] = [
  { id: "ing-rijst", name: "Rijst", category: "GRAINS", baseUnit: "GRAM" },
  {
    id: "ing-paprika",
    name: "Paprika",
    category: "VEGETABLES",
    baseUnit: "PIECE",
  },
  {
    id: "ing-melk",
    name: "Melk",
    category: "DAIRY_EGGS",
    baseUnit: "MILLILITER",
  },
  {
    id: "ing-olie",
    name: "Olijfolie",
    category: "OTHER",
    baseUnit: "TABLESPOON",
  },
];

const ingredientsById = new Map(ingredients.map((item) => [item.id, item]));

function makeRecipe(
  id: string,
  name: string,
  servings: number,
  items: { ingredientId: string; quantity: number; unit: Unit }[],
): RecipeWithIngredients {
  const base: Recipe = {
    id,
    name,
    category: "DINNER",
    instructions: "",
    prepMinutes: 10,
    servings,
    isVegetarian: true,
    isFavorite: false,
    isCustom: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  return {
    ...base,
    ingredients: items.map(
      (item, index): RecipeIngredient & { ingredient: Ingredient } => ({
        id: `${id}-${index}`,
        recipeId: id,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        sortOrder: index,
        ingredient: ingredientsById.get(item.ingredientId) as Ingredient,
      }),
    ),
  };
}

function meal(
  id: string,
  recipeId: string,
  servings: number,
): Pick<PlannedMeal, "id" | "recipeId" | "servings"> {
  return { id, recipeId, servings };
}

describe("boodschappenlijst samenstellen", () => {
  it("telt hetzelfde ingrediënt uit verschillende maaltijden op", () => {
    const dinner = makeRecipe("r-dinner", "Avondeten", 1, [
      { ingredientId: "ing-rijst", quantity: 200, unit: "GRAM" },
      { ingredientId: "ing-paprika", quantity: 1, unit: "PIECE" },
    ]);
    const lunch = makeRecipe("r-lunch", "Lunch", 1, [
      { ingredientId: "ing-rijst", quantity: 150, unit: "GRAM" },
      { ingredientId: "ing-paprika", quantity: 2, unit: "PIECE" },
    ]);

    const lines = aggregateIngredients(
      [
        { meal: meal("m1", "r-dinner", 1), recipe: dinner },
        { meal: meal("m2", "r-lunch", 1), recipe: lunch },
      ],
      ingredientsById,
    );

    expect(lines).toHaveLength(2);
    expect(lines.find((line) => line.name === "Rijst")).toMatchObject({
      quantity: 350,
      unit: "GRAM",
      category: "GRAINS",
    });
    expect(lines.find((line) => line.name === "Paprika")).toMatchObject({
      quantity: 3,
      unit: "PIECE",
      category: "VEGETABLES",
    });
  });

  it("schaalt eerst naar het aantal porties en telt daarna op", () => {
    const recipe = makeRecipe("r-1", "Curry", 2, [
      { ingredientId: "ing-rijst", quantity: 150, unit: "GRAM" },
    ]);

    const lines = aggregateIngredients(
      [
        { meal: meal("m1", "r-1", 2), recipe },
        { meal: meal("m2", "r-1", 3), recipe },
      ],
      ingredientsById,
    );

    // 150 g voor 2 personen → 150 g + 225 g = 375 g
    expect(lines[0]).toMatchObject({ quantity: 375, unit: "GRAM" });
  });

  it("rekent verenigbare eenheden naar elkaar om", () => {
    const a = makeRecipe("r-a", "A", 1, [
      { ingredientId: "ing-rijst", quantity: 1, unit: "KILOGRAM" },
    ]);
    const b = makeRecipe("r-b", "B", 1, [
      { ingredientId: "ing-rijst", quantity: 250, unit: "GRAM" },
    ]);

    const lines = aggregateIngredients(
      [
        { meal: meal("m1", "r-a", 1), recipe: a },
        { meal: meal("m2", "r-b", 1), recipe: b },
      ],
      ingredientsById,
    );

    expect(lines[0]).toMatchObject({ quantity: 1.25, unit: "KILOGRAM" });
  });

  it("telt eetlepels en theelepels bij milliliters op", () => {
    const a = makeRecipe("r-a", "A", 1, [
      { ingredientId: "ing-olie", quantity: 2, unit: "TABLESPOON" },
    ]);
    const b = makeRecipe("r-b", "B", 1, [
      { ingredientId: "ing-olie", quantity: 3, unit: "TEASPOON" },
    ]);

    const lines = aggregateIngredients(
      [
        { meal: meal("m1", "r-a", 1), recipe: a },
        { meal: meal("m2", "r-b", 1), recipe: b },
      ],
      ingredientsById,
    );

    // 2 el = 30 ml, 3 tl = 15 ml
    expect(lines[0]).toMatchObject({ quantity: 45, unit: "MILLILITER" });
  });

  it("houdt stuks en grammen van hetzelfde ingrediënt apart", () => {
    const a = makeRecipe("r-a", "A", 1, [
      { ingredientId: "ing-paprika", quantity: 2, unit: "PIECE" },
    ]);
    const b = makeRecipe("r-b", "B", 1, [
      { ingredientId: "ing-paprika", quantity: 150, unit: "GRAM" },
    ]);

    const lines = aggregateIngredients(
      [
        { meal: meal("m1", "r-a", 1), recipe: a },
        { meal: meal("m2", "r-b", 1), recipe: b },
      ],
      ingredientsById,
    );

    expect(lines).toHaveLength(2);
    expect(lines.map((line) => [line.quantity, line.unit]).sort()).toEqual(
      [
        [150, "GRAM"],
        [2, "PIECE"],
      ].sort(),
    );
  });

  it("rekent grote hoeveelheden naar een leesbare eenheid om", () => {
    const recipe = makeRecipe("r-1", "Groot", 1, [
      { ingredientId: "ing-melk", quantity: 750, unit: "MILLILITER" },
    ]);

    const lines = aggregateIngredients(
      [
        { meal: meal("m1", "r-1", 1), recipe },
        { meal: meal("m2", "r-1", 2), recipe },
      ],
      ingredientsById,
    );

    expect(lines[0]).toMatchObject({ quantity: 2.25, unit: "LITER" });
  });

  it("slaat maaltijden zonder recept over", () => {
    const lines = aggregateIngredients(
      [
        {
          meal: { id: "m1", recipeId: undefined, servings: 1 },
          recipe: undefined,
        },
      ],
      ingredientsById,
    );
    expect(lines).toEqual([]);
  });

  it("onthoudt uit welke recepten een regel komt", () => {
    const dinner = makeRecipe("r-dinner", "Linzenbolognese", 2, [
      { ingredientId: "ing-rijst", quantity: 100, unit: "GRAM" },
    ]);
    const lines = aggregateIngredients(
      [{ meal: meal("m1", "r-dinner", 2), recipe: dinner }],
      ingredientsById,
    );
    expect(lines[0].sources).toEqual([
      { recipeName: "Linzenbolognese", quantity: 100, unit: "GRAM" },
    ]);
  });
});

function existingItem(overrides: Partial<GroceryItem>): GroceryItem {
  return {
    id: "item-1",
    groceryListId: "list-1",
    ingredientId: "ing-rijst",
    name: "Rijst",
    quantity: 350,
    unit: "GRAM",
    category: "GRAINS",
    checked: false,
    isCustom: false,
    isEdited: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe("opnieuw genereren van de lijst", () => {
  const generated = [
    {
      ingredientId: "ing-rijst",
      name: "Rijst",
      category: "GRAINS" as const,
      quantity: 350,
      unit: "GRAM" as const,
      sources: [],
    },
  ];

  it("bewaart zelf toegevoegde regels", () => {
    const custom = existingItem({
      id: "item-custom",
      ingredientId: undefined,
      name: "Tandpasta",
      isCustom: true,
      category: "OTHER",
    });

    const result = mergeGroceryItems([custom], generated);
    expect(result.keep).toContainEqual(custom);
    expect(result.removeIds).not.toContain("item-custom");
  });

  it("houdt een afgevinkte regel afgevinkt als de hoeveelheid gelijk blijft", () => {
    const result = mergeGroceryItems(
      [existingItem({ checked: true })],
      generated,
    );
    expect(result.upsert[0]).toMatchObject({ checked: true, quantity: 350 });
  });

  it("zet het vinkje uit als de hoeveelheid verandert", () => {
    const result = mergeGroceryItems(
      [existingItem({ checked: true, quantity: 200 })],
      generated,
    );
    expect(result.upsert[0]).toMatchObject({ checked: false, quantity: 350 });
  });

  it("herkent een afgevinkte regel ook na omrekenen van de eenheid", () => {
    const result = mergeGroceryItems(
      [existingItem({ checked: true, quantity: 0.35, unit: "KILOGRAM" })],
      generated,
    );
    expect(result.upsert[0]).toMatchObject({ checked: true });
  });

  it("laat een handmatig aangepaste hoeveelheid staan", () => {
    const edited = existingItem({ quantity: 500, isEdited: true });
    const result = mergeGroceryItems([edited], generated);
    expect(result.keep).toContainEqual(edited);
    expect(result.upsert).toHaveLength(0);
  });

  it("laat een aanpassing naar een andere eenheid staan", () => {
    const edited = existingItem({ quantity: 3, unit: "PIECE", isEdited: true });
    const result = mergeGroceryItems([edited], generated);
    expect(result.keep).toContainEqual(edited);
    expect(result.upsert).toHaveLength(0);
    expect(result.removeIds).toHaveLength(0);
  });

  it("verwijdert regels die niet meer in het weekmenu staan", () => {
    const stale = existingItem({
      id: "item-stale",
      ingredientId: "ing-melk",
      name: "Melk",
    });
    const result = mergeGroceryItems([stale], []);
    expect(result.removeIds).toEqual(["item-stale"]);
  });
});
