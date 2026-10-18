import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../db";
import { seedDatabase } from "../seed";
import {
  addExerciseToSession,
  addSet,
  completeSession,
  getAdviceForSession,
  getExerciseHistory,
  getPreviousPerformance,
  getSessionDetail,
  moveSessionExercise,
  removeExerciseFromSession,
  replaceSessionExercise,
  startSessionFromDay,
  updateSet,
} from "./workouts";

/** Vult één oefening in een lopende sessie met gewicht en herhalingen. */
async function logExercise(
  sessionId: string,
  exerciseId: string,
  sets: { weightKg: number; reps: number }[],
) {
  const detail = await getSessionDetail(sessionId);
  const log = detail?.exercises.find((item) => item.exerciseId === exerciseId);
  if (!log) throw new Error("Oefening niet gevonden in sessie");

  for (const [index, entry] of sets.entries()) {
    const set = log.sets[index];
    await updateSet(set.id, {
      weightKg: entry.weightKg,
      reps: entry.reps,
      completed: true,
    });
  }
}

describe("trainingen loggen", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedDatabase();
  });

  it("maakt een sessie met de oefeningen en sets uit het schema", async () => {
    const sessionId = await startSessionFromDay("day-push");
    const detail = await getSessionDetail(sessionId);

    expect(detail?.name).toBe("Push");
    expect(detail?.status).toBe("IN_PROGRESS");
    expect(detail?.exercises.map((log) => log.exercise.name)).toEqual([
      "Bankdrukken",
      "Schuine dumbbell press",
      "Schouderpers",
      "Laterale raises",
      "Triceps pushdown",
    ]);
    expect(detail?.exercises[0].sets).toHaveLength(3);
    expect(detail?.exercises[0].targetRepMin).toBe(6);
    expect(detail?.exercises[0].targetRepMax).toBe(10);
  });

  it("laat de gewichten van de vorige keer zien en vult ze voor", async () => {
    const first = await startSessionFromDay("day-push");
    await logExercise(first, "ex-bankdrukken", [
      { weightKg: 50, reps: 8 },
      { weightKg: 50, reps: 8 },
      { weightKg: 50, reps: 7 },
    ]);
    await completeSession(first);

    const previous = await getPreviousPerformance("ex-bankdrukken");
    expect(previous?.sets).toEqual([
      { setNumber: 1, weightKg: 50, reps: 8 },
      { setNumber: 2, weightKg: 50, reps: 8 },
      { setNumber: 3, weightKg: 50, reps: 7 },
    ]);

    const second = await startSessionFromDay("day-push");
    const detail = await getSessionDetail(second);
    const bench = detail?.exercises.find(
      (log) => log.exerciseId === "ex-bankdrukken",
    );
    expect(bench?.sets.map((set) => set.weightKg)).toEqual([50, 50, 50]);
    // De herhalingen worden niet voorgevuld: die moet je zelf halen.
    expect(bench?.sets.map((set) => set.reps)).toEqual([null, null, null]);
  });

  it("adviseert meer gewicht als het repbereik vol zat", async () => {
    const first = await startSessionFromDay("day-push");
    await logExercise(first, "ex-bankdrukken", [
      { weightKg: 50, reps: 10 },
      { weightKg: 50, reps: 10 },
      { weightKg: 50, reps: 10 },
    ]);
    await completeSession(first);

    const second = await startSessionFromDay("day-push");
    const detail = await getSessionDetail(second);
    const bench = detail?.exercises.find(
      (log) => log.exerciseId === "ex-bankdrukken",
    );
    const advice = await getAdviceForSession(second);
    const benchAdvice = advice.get(bench!.id);

    expect(benchAdvice?.kind).toBe("increase");
    if (benchAdvice?.kind === "increase") {
      // Bankdrukken is samengesteld: stap van 2,5 kg.
      expect(benchAdvice.suggestedWeightKg).toBe(52.5);
    }
  });

  it("bewaart een onafgeronde training zodat je hem later hervat", async () => {
    const sessionId = await startSessionFromDay("day-pull");
    await logExercise(sessionId, "ex-lat-pulldown", [
      { weightKg: 45, reps: 10 },
    ]);

    // De browser sluiten betekent alleen: opnieuw uit de database lezen.
    const reopened = await getSessionDetail(sessionId);
    const pulldown = reopened?.exercises.find(
      (log) => log.exerciseId === "ex-lat-pulldown",
    );
    expect(reopened?.status).toBe("IN_PROGRESS");
    expect(pulldown?.sets[0]).toMatchObject({
      weightKg: 45,
      reps: 10,
      completed: true,
    });
  });

  it("gooit lege sets weg bij het afronden, maar houdt de ingevulde", async () => {
    const sessionId = await startSessionFromDay("day-push");
    await logExercise(sessionId, "ex-bankdrukken", [{ weightKg: 50, reps: 8 }]);
    await completeSession(sessionId);

    const detail = await getSessionDetail(sessionId);
    const bench = detail?.exercises.find(
      (log) => log.exerciseId === "ex-bankdrukken",
    );
    expect(detail?.status).toBe("COMPLETED");
    expect(detail?.completedAt).toBeDefined();
    expect(bench?.sets).toHaveLength(1);
  });

  it("ondersteunt sets toevoegen, oefeningen verplaatsen, vervangen en verwijderen", async () => {
    const sessionId = await startSessionFromDay("day-push");
    const before = await getSessionDetail(sessionId);
    const bench = before!.exercises[0];

    await addSet(bench.id);
    await moveSessionExercise(bench.id, 1);
    await removeExerciseFromSession(before!.exercises[4].id);
    await addExerciseToSession(sessionId, "ex-push-up");

    const after = await getSessionDetail(sessionId);
    expect(
      after?.exercises.find((log) => log.id === bench.id)?.sets,
    ).toHaveLength(4);
    expect(after?.exercises[1].exerciseId).toBe("ex-bankdrukken");
    expect(after?.exercises.map((log) => log.exerciseId)).toContain(
      "ex-push-up",
    );
    expect(after?.exercises.map((log) => log.exerciseId)).not.toContain(
      "ex-triceps-pushdown",
    );

    const pushUpLog = after!.exercises.find(
      (log) => log.exerciseId === "ex-push-up",
    )!;
    await replaceSessionExercise(pushUpLog.id, "ex-face-pull");
    const replaced = await getSessionDetail(sessionId);
    expect(replaced?.exercises.map((log) => log.exerciseId)).toContain(
      "ex-face-pull",
    );
  });

  it("weigert een oefening die al in de training staat", async () => {
    const sessionId = await startSessionFromDay("day-push");
    const detail = await getSessionDetail(sessionId);
    const first = detail!.exercises[0];

    await expect(
      replaceSessionExercise(first.id, "ex-schouderpers"),
    ).rejects.toThrow();
  });

  it("bouwt de geschiedenis en records van een oefening op", async () => {
    const first = await startSessionFromDay("day-push");
    await logExercise(first, "ex-bankdrukken", [
      { weightKg: 50, reps: 8 },
      { weightKg: 50, reps: 8 },
    ]);
    await completeSession(first);

    const second = await startSessionFromDay("day-push");
    await logExercise(second, "ex-bankdrukken", [
      { weightKg: 55, reps: 6 },
      { weightKg: 55, reps: 6 },
    ]);
    await completeSession(second);

    const history = await getExerciseHistory("ex-bankdrukken");
    expect(history?.points).toHaveLength(2);
    expect(history?.points[1].topWeightKg).toBe(55);
    expect(history?.records.heaviestSet).toMatchObject({
      weightKg: 55,
      reps: 6,
    });
    expect(history?.records.bestEstimatedOneRepMax?.value).toBe(66);
  });

  it("rekent geen 1RM uit voor oefeningen waar dat niets zegt", async () => {
    const sessionId = await startSessionFromDay("day-push");
    await logExercise(sessionId, "ex-laterale-raises", [
      { weightKg: 10, reps: 14 },
    ]);
    await completeSession(sessionId);

    const history = await getExerciseHistory("ex-laterale-raises");
    expect(history?.exercise.supportsOneRepMax).toBe(false);
    expect(history?.records.bestEstimatedOneRepMax).toBeNull();
    expect(history?.points[0].estimatedOneRepMax).toBeNull();
  });
});
