import { liveQuery } from "dexie";
import { beforeEach, describe, expect, it } from "vitest";

import { db, META_KEYS, setMeta } from "./db";
import { getGroceryList } from "./repo/grocery";
import { getMealsForDate, getWeekPlan, listTemplates } from "./repo/mealPlan";
import { getActiveProgramWithDays } from "./repo/programs";
import {
  listMeasurements,
  listPhotos,
  listWeightEntries,
} from "./repo/progress";
import {
  getRecipeWithIngredients,
  listRecipesWithIngredients,
} from "./repo/recipes";
import { listExercises } from "./repo/exercises";
import { getSettings, listHouseholdMembers } from "./repo/settings";
import {
  getActiveSession,
  getAdviceForSession,
  getExerciseHistory,
  getLastCompletionForDay,
  getPreviousPerformance,
  getSessionDetail,
  listRecentRecords,
  listSessionSummaries,
  startSessionFromDay,
} from "./repo/workouts";
import { seedDatabase } from "./seed";
import { addDaysToKey, startOfWeekKey, todayKey } from "@/lib/dates";

/**
 * Alles wat de schermen via useLiveQuery lezen, moet zonder schrijven werken:
 * Dexie gooit binnen een liveQuery een ReadOnlyError bij elke schrijfactie en
 * React laat dan een leeg scherm achter. Zo crashte het dashboard op een
 * maandag, toen getWeekPlan() het weekmenu voor de nieuwe week aanmaakte.
 *
 * Deze test draait elke leesfunctie echt binnen liveQuery, in de situaties
 * die eerder tot een schrijfactie leidden.
 */
function runLive<T>(query: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => {
        subscription.unsubscribe();
        resolve(value);
      },
      error: (error) => {
        subscription.unsubscribe();
        reject(error);
      },
    });
  });
}

const NEXT_WEEK = addDaysToKey(startOfWeekKey(todayKey()), 7);

async function readEverything(sessionId: string) {
  const reads: Record<string, () => Promise<unknown>> = {
    getWeekPlan: () => getWeekPlan(NEXT_WEEK),
    getMealsForDate: () => getMealsForDate(NEXT_WEEK),
    getGroceryList: () => getGroceryList(NEXT_WEEK),
    listTemplates,
    getSettings,
    listHouseholdMembers,
    getActiveProgramWithDays,
    getActiveSession,
    listSessionSummaries: () => listSessionSummaries(),
    getSessionDetail: () => getSessionDetail(sessionId),
    getAdviceForSession: () => getAdviceForSession(sessionId),
    getPreviousPerformance: () => getPreviousPerformance("ex-bankdrukken"),
    getExerciseHistory: () => getExerciseHistory("ex-bankdrukken"),
    getLastCompletionForDay: () => getLastCompletionForDay("day-push"),
    listRecentRecords: () => listRecentRecords(),
    listExercises,
    listRecipesWithIngredients,
    getRecipeWithIngredients: () =>
      getRecipeWithIngredients("recipe-groentecurry"),
    listWeightEntries,
    listMeasurements,
    listPhotos,
  };

  const failures: string[] = [];
  for (const [name, read] of Object.entries(reads)) {
    try {
      await runLive(read);
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.name : error}`);
    }
  }
  expect(failures).toEqual([]);
}

describe("leesfuncties binnen useLiveQuery", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedDatabase();
  });

  it("schrijven niets in een nieuwe week zonder weekmenu", async () => {
    const sessionId = await startSessionFromDay("day-push");
    const plansBefore = await db.mealPlans.count();

    await readEverything(sessionId);

    expect(await db.mealPlans.count()).toBe(plansBefore);
    const week = await runLive(() => getWeekPlan(NEXT_WEEK));
    expect(week.plan).toBeNull();
    expect(week.days).toHaveLength(7);
  });

  it("schrijven niets als de instellingen ontbreken", async () => {
    const sessionId = await startSessionFromDay("day-push");
    await db.settings.clear();

    await readEverything(sessionId);

    expect(await db.settings.count()).toBe(0);
    expect((await runLive(getSettings)).defaultRestSeconds).toBeGreaterThan(0);
  });

  it("schrijven niets als de actieve training in meta verouderd is", async () => {
    const sessionId = await startSessionFromDay("day-push");
    await setMeta(META_KEYS.activeSessionId, "bestaat-niet-meer");

    await readEverything(sessionId);

    expect((await runLive(getActiveSession))?.id).toBe(sessionId);
  });
});
