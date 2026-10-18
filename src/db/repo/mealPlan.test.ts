import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../db";
import { seedDatabase } from "../seed";
import {
  applyTemplateToWeek,
  clearWeek,
  copyDay,
  copyMealToDates,
  copyWeek,
  getMealsForDate,
  getWeekPlan,
  removePlannedMeal,
  saveWeekAsTemplate,
  setPlannedMeal,
  updatePlannedMeal,
} from "./mealPlan";
import { addDaysToKey, startOfWeekKey, todayKey } from "@/lib/dates";

const WEEK = startOfWeekKey(todayKey());
const MONDAY = WEEK;
const TUESDAY = addDaysToKey(WEEK, 1);

describe("weekmenu", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedDatabase();
    await clearWeek(WEEK);
  });

  it("houdt per dag en moment één maaltijd vast", async () => {
    await setPlannedMeal({
      date: MONDAY,
      slot: "DINNER",
      recipeId: "recipe-linzenbolognese",
    });
    await setPlannedMeal({
      date: MONDAY,
      slot: "DINNER",
      recipeId: "recipe-groentecurry",
    });

    const meals = await getMealsForDate(MONDAY);
    const dinners = meals.filter((meal) => meal.slot === "DINNER");
    expect(dinners).toHaveLength(1);
    expect(dinners[0].recipe?.name).toBe("Groentecurry met tofu en rijst");
  });

  it("onthoudt porties en wie meeëet", async () => {
    await setPlannedMeal({
      date: MONDAY,
      slot: "DINNER",
      recipeId: "recipe-linzenbolognese",
      servings: 2,
      memberIds: ["member-self", "member-partner"],
    });

    const [meal] = await getMealsForDate(MONDAY);
    expect(meal.servings).toBe(2);
    expect(meal.memberIds).toEqual(["member-self", "member-partner"]);

    await updatePlannedMeal(meal.id, { servings: 3 });
    const [updated] = await getMealsForDate(MONDAY);
    expect(updated.servings).toBe(3);
  });

  it("kopieert een maaltijd naar andere dagen", async () => {
    await setPlannedMeal({
      date: MONDAY,
      slot: "LUNCH",
      recipeId: "recipe-kwarkbowl",
      servings: 1,
    });
    const [meal] = await getMealsForDate(MONDAY);

    await copyMealToDates(meal.id, [TUESDAY, addDaysToKey(WEEK, 2)]);
    expect((await getMealsForDate(TUESDAY))[0].recipe?.name).toBe(
      "Kwarkbowl met havermout en fruit",
    );
    expect((await getMealsForDate(addDaysToKey(WEEK, 2)))[0].recipeId).toBe(
      "recipe-kwarkbowl",
    );
  });

  it("kopieert een hele dag en een hele week", async () => {
    await setPlannedMeal({
      date: MONDAY,
      slot: "LUNCH",
      recipeId: "recipe-kwarkbowl",
    });
    await setPlannedMeal({
      date: MONDAY,
      slot: "DINNER",
      recipeId: "recipe-groentecurry",
    });

    await copyDay(MONDAY, TUESDAY);
    expect(await getMealsForDate(TUESDAY)).toHaveLength(2);

    const nextWeek = addDaysToKey(WEEK, 7);
    await copyWeek(WEEK, nextWeek);
    const copied = await getWeekPlan(nextWeek);
    expect(copied.days[0].meals.DINNER?.recipeId).toBe("recipe-groentecurry");
    expect(copied.days[1].meals.LUNCH?.recipeId).toBe("recipe-kwarkbowl");
  });

  it("slaat een week op als sjabloon en zet die op een andere week", async () => {
    await setPlannedMeal({
      date: MONDAY,
      slot: "DINNER",
      recipeId: "recipe-burritobowl",
      servings: 2,
    });
    const templateId = await saveWeekAsTemplate(WEEK, "Testweek");

    const target = addDaysToKey(WEEK, 14);
    await applyTemplateToWeek(templateId, target, { replaceExisting: true });

    const plan = await getWeekPlan(target);
    expect(plan.days[0].meals.DINNER?.recipeId).toBe("recipe-burritobowl");
    expect(plan.days[0].meals.DINNER?.servings).toBe(2);
  });

  it("laat bestaande maaltijden staan als je een sjabloon aanvult", async () => {
    await setPlannedMeal({
      date: MONDAY,
      slot: "DINNER",
      recipeId: "recipe-burritobowl",
    });
    const templateId = await saveWeekAsTemplate(WEEK, "Basis");

    await clearWeek(WEEK);
    await setPlannedMeal({
      date: MONDAY,
      slot: "DINNER",
      recipeId: "recipe-groentecurry",
    });
    await applyTemplateToWeek(templateId, WEEK, { replaceExisting: false });

    // Het sjabloon overschrijft hetzelfde slot wél; alleen de week wordt niet gewist.
    const plan = await getWeekPlan(WEEK);
    expect(plan.days[0].meals.DINNER?.recipeId).toBe("recipe-burritobowl");
  });

  it("verwijdert een maaltijd", async () => {
    await setPlannedMeal({
      date: MONDAY,
      slot: "EVENING_SNACK",
      recipeId: "recipe-edamame",
    });
    const [meal] = await getMealsForDate(MONDAY);
    await removePlannedMeal(meal.id);
    expect(await getMealsForDate(MONDAY)).toHaveLength(0);
  });

  it("maakt een weekmenu aan voor elke week die je opent", async () => {
    const future = addDaysToKey(WEEK, 35);
    const plan = await getWeekPlan(future);
    expect(plan.weekStart).toBe(future);
    expect(plan.days).toHaveLength(7);
    expect(
      plan.days.every((day) =>
        Object.values(day.meals).every((meal) => meal === null),
      ),
    ).toBe(true);
  });
});
