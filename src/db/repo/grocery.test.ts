import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../db";
import { seedDatabase } from "../seed";
import {
  addCustomGroceryItem,
  generateGroceryList,
  getGroceryList,
  toggleGroceryItem,
  updateGroceryItem,
} from "./grocery";
import { clearWeek, setPlannedMeal } from "./mealPlan";
import { startOfWeekKey, todayKey } from "@/lib/dates";

const WEEK = startOfWeekKey(todayKey());

describe("boodschappenlijst uit het weekmenu", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedDatabase();
    await clearWeek(WEEK);
  });

  it("telt dezelfde ingrediënten uit verschillende maaltijden op", async () => {
    // Rijstbowl (lunch, 1 portie): 75 g rijst. Nasi (avond, 2 porties): 150 g rijst.
    await setPlannedMeal({
      date: WEEK,
      slot: "LUNCH",
      recipeId: "recipe-rijstbowl-tofu-ei",
      servings: 1,
    });
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-vegetarische-nasi",
      servings: 2,
    });

    const list = await generateGroceryList(WEEK);
    const rice = list.items.find((item) => item.name === "Rijst");

    expect(rice).toMatchObject({
      quantity: 225,
      unit: "GRAM",
      category: "GRAINS",
    });
  });

  it("schaalt mee met het aantal porties", async () => {
    // Recept voor 2 personen met 150 g rijst, nu voor 3 porties.
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-vegetarische-nasi",
      servings: 3,
    });

    const list = await generateGroceryList(WEEK);
    expect(list.items.find((item) => item.name === "Rijst")).toMatchObject({
      quantity: 225,
    });
    expect(list.items.find((item) => item.name === "Eieren")).toMatchObject({
      quantity: 3,
      unit: "PIECE",
    });
  });

  it("zet grote hoeveelheden om naar een leesbare eenheid", async () => {
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-groentecurry",
      servings: 6,
    });

    const list = await generateGroceryList(WEEK);
    // 400 ml kokosmelk voor 2 personen, nu voor 6: 1,2 liter.
    expect(list.items.find((item) => item.name === "Kokosmelk")).toMatchObject({
      quantity: 1.2,
      unit: "LITER",
    });
  });

  it("groepeert op schap", async () => {
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-griekse-orzosalade",
      servings: 2,
    });

    const list = await generateGroceryList(WEEK);
    const categories = new Map(
      list.items.map((item) => [item.name, item.category]),
    );

    expect(categories.get("Komkommer")).toBe("VEGETABLES");
    expect(categories.get("Feta")).toBe("DAIRY_EGGS");
    expect(categories.get("Orzo")).toBe("GRAINS");
    expect(categories.get("Kikkererwten (blik)")).toBe("LEGUMES_CANNED");
    expect(categories.get("Oregano")).toBe("HERBS_SPICES");
    expect(categories.get("Olijfolie")).toBe("OTHER");
  });

  it("bewaart zelf toegevoegde items en aangepaste hoeveelheden bij opnieuw genereren", async () => {
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-linzenbolognese",
      servings: 2,
    });
    const first = await generateGroceryList(WEEK);

    await addCustomGroceryItem({
      listId: first.id,
      name: "Afwasmiddel",
      category: "OTHER",
    });
    const penne = first.items.find((item) => item.name === "Penne");
    await updateGroceryItem(penne!.id, { quantity: 500 });

    const second = await generateGroceryList(WEEK);
    expect(
      second.items.find((item) => item.name === "Afwasmiddel"),
    ).toBeDefined();
    expect(second.items.find((item) => item.name === "Penne")).toMatchObject({
      quantity: 500,
      isEdited: true,
    });
  });

  it("houdt afgevinkte regels afgevinkt zolang de hoeveelheid gelijk blijft", async () => {
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-linzenbolognese",
      servings: 2,
    });
    const first = await generateGroceryList(WEEK);
    const passata = first.items.find((item) => item.name === "Passata");
    await toggleGroceryItem(passata!.id);

    const second = await generateGroceryList(WEEK);
    expect(second.items.find((item) => item.name === "Passata")?.checked).toBe(
      true,
    );

    // Meer porties betekent een andere hoeveelheid: het vinkje gaat eraf.
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-linzenbolognese",
      servings: 4,
    });
    const third = await generateGroceryList(WEEK);
    const updated = third.items.find((item) => item.name === "Passata");
    expect(updated?.checked).toBe(false);
    expect(updated?.quantity).toBe(800);
  });

  it("haalt regels weg die niet meer in het weekmenu staan", async () => {
    await setPlannedMeal({
      date: WEEK,
      slot: "DINNER",
      recipeId: "recipe-linzenbolognese",
      servings: 2,
    });
    await generateGroceryList(WEEK);

    await clearWeek(WEEK);
    const empty = await generateGroceryList(WEEK);
    expect(empty.items).toHaveLength(0);
  });

  it("maakt een lege lijst als er niets gepland staat", async () => {
    const list = await generateGroceryList(WEEK);
    expect(list.items).toEqual([]);
    expect(await getGroceryList(WEEK)).not.toBeNull();
  });
});
