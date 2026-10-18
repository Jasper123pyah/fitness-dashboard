import { beforeEach, describe, expect, it } from "vitest";

import { db } from "./db";
import { seedDatabase } from "./seed";
import { getProgramWithDays } from "./repo/programs";
import { listRecipesWithIngredients } from "./repo/recipes";

describe("standaardinhoud", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedDatabase();
  });

  it("zet het schema Push / Pull / Legs / Upper klaar", async () => {
    const program = await getProgramWithDays("program-ppl-upper");
    expect(program?.isActive).toBe(true);
    expect(program?.days.map((day) => [day.name, day.weekday])).toEqual([
      ["Push", 1],
      ["Pull + Core", 2],
      ["Legs + Core", 4],
      ["Upper", 5],
    ]);

    const push = program?.days[0];
    expect(
      push?.exercises.map((item) => [
        item.exercise.name,
        item.sets,
        item.repMin,
        item.repMax,
      ]),
    ).toEqual([
      ["Bankdrukken", 3, 6, 10],
      ["Schuine dumbbell press", 3, 8, 12],
      ["Schouderpers", 3, 8, 12],
      ["Laterale raises", 3, 12, 15],
      ["Triceps pushdown", 3, 10, 15],
    ]);
    expect(program?.days[3].exercises).toHaveLength(7);
  });

  it("heeft recepten voor elk moment van de dag", async () => {
    const recipes = await listRecipesWithIngredients();
    const byCategory = (category: string) =>
      recipes.filter((recipe) => recipe.category === category);

    expect(byCategory("PRE_WORKOUT").length).toBeGreaterThanOrEqual(4);
    expect(byCategory("LUNCH").length).toBeGreaterThanOrEqual(5);
    expect(byCategory("DINNER").length).toBeGreaterThanOrEqual(7);
    expect(byCategory("EVENING_SNACK").length).toBeGreaterThanOrEqual(5);
  });

  it("geeft elk recept echte ingrediënten en een bereiding", async () => {
    const recipes = await listRecipesWithIngredients();

    for (const recipe of recipes) {
      expect(
        recipe.ingredients.length,
        `${recipe.name} heeft geen ingrediënten`,
      ).toBeGreaterThan(0);
      expect(
        recipe.instructions.length,
        `${recipe.name} heeft geen bereiding`,
      ).toBeGreaterThan(20);
      expect(recipe.servings).toBeGreaterThan(0);
      for (const item of recipe.ingredients) {
        expect(
          item.quantity,
          `${recipe.name}: ${item.ingredient.name}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("houdt alle avondmaaltijden vegetarisch", async () => {
    const dinners = await db.recipes
      .where("category")
      .equals("DINNER")
      .toArray();
    expect(dinners.every((recipe) => recipe.isVegetarian)).toBe(true);
  });

  it("verzint geen wegingen of trainingen", async () => {
    expect(await db.weightEntries.count()).toBe(0);
    expect(await db.sessions.count()).toBe(0);
    expect(await db.bodyMeasurements.count()).toBe(0);
  });

  it("zet de voorkeuren van de gebruiker klaar", async () => {
    const settings = await db.settings.get("settings");
    expect(settings).toMatchObject({
      heightCm: 183,
      startWeightKg: 75,
      goal: "RECOMP",
      trainingDays: [1, 2, 4, 5],
      proteinTargetMinG: 120,
      proteinTargetMaxG: 140,
    });
    expect(settings?.excludedIngredients).toContain("brood");
    expect(settings?.excludedIngredients).toContain("pindakaas");
  });

  it("raadt het broodrecept niet aan, maar bewaart het wel", async () => {
    const bread = await db.recipes.get("recipe-turks-brood-halloumi");
    expect(bread).toBeDefined();

    const template = await db.mealPlanTemplateItems
      .where("templateId")
      .equals("template-standaard-trainingsweek")
      .toArray();
    expect(
      template.some((item) => item.recipeId === "recipe-turks-brood-halloumi"),
    ).toBe(false);
  });

  it("draait maar één keer en overschrijft niets", async () => {
    await db.recipes.update("recipe-edamame", { name: "Edamame met zeezout" });
    await seedDatabase();
    expect((await db.recipes.get("recipe-edamame"))?.name).toBe(
      "Edamame met zeezout",
    );
  });
});
