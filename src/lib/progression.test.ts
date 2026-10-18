import { describe, expect, it } from "vitest";

import type { Exercise, SetLog } from "@/db/types";
import {
  canEstimateOneRepMax,
  completedWorkingSets,
  estimateOneRepMax,
  incrementForExercise,
  personalRecords,
  sessionVolume,
  suggestProgression,
} from "./progression";

const settings = { compoundIncrementKg: 2.5, isolationIncrementKg: 1.25 };

function set(overrides: Partial<SetLog>): SetLog {
  return {
    id: "s1",
    exerciseLogId: "log-1",
    setNumber: 1,
    weightKg: 50,
    reps: 8,
    completed: true,
    isWarmup: false,
    ...overrides,
  };
}

describe("geschatte 1RM", () => {
  it("rekent met de formule van Epley", () => {
    expect(estimateOneRepMax(50, 8)).toBe(63.3);
    expect(estimateOneRepMax(100, 5)).toBe(116.7);
  });

  it("geeft bij één rep het gewicht zelf terug", () => {
    expect(estimateOneRepMax(80, 1)).toBe(80);
  });

  it("schat niets bij hoge reps of onbruikbare invoer", () => {
    expect(estimateOneRepMax(20, 20)).toBeNull();
    expect(estimateOneRepMax(0, 8)).toBeNull();
    expect(estimateOneRepMax(50, 0)).toBeNull();
    expect(estimateOneRepMax(Number.NaN, 8)).toBeNull();
  });

  it("slaat oefeningen over waar een 1RM niets zegt", () => {
    const lateralRaise = { supportsOneRepMax: false } as Pick<
      Exercise,
      "supportsOneRepMax"
    >;
    const bench = { supportsOneRepMax: true } as Pick<
      Exercise,
      "supportsOneRepMax"
    >;
    expect(canEstimateOneRepMax(lateralRaise)).toBe(false);
    expect(canEstimateOneRepMax(bench)).toBe(true);
  });
});

describe("afgeronde werksets", () => {
  it("negeert warming-ups en onafgeronde sets", () => {
    const sets = [
      set({ id: "a", isWarmup: true, weightKg: 20, reps: 10 }),
      set({ id: "b", completed: false, reps: null }),
      set({ id: "c", weightKg: 50, reps: 9 }),
      set({ id: "d", weightKg: null, reps: 8 }),
    ];
    expect(completedWorkingSets(sets)).toEqual([{ weightKg: 50, reps: 9 }]);
  });
});

describe("advies voor de volgende training", () => {
  it("adviseert zwaarder als alle sets de bovengrens halen", () => {
    const advice = suggestProgression({
      sets: [
        { weightKg: 50, reps: 10 },
        { weightKg: 50, reps: 10 },
        { weightKg: 50, reps: 11 },
      ],
      targetSets: 3,
      repMin: 6,
      repMax: 10,
      incrementKg: 2.5,
    });

    expect(advice.kind).toBe("increase");
    if (advice.kind === "increase") {
      expect(advice.suggestedWeightKg).toBe(52.5);
      expect(advice.incrementKg).toBe(2.5);
    }
  });

  it("blijft op hetzelfde gewicht als het repbereik nog niet vol is", () => {
    const advice = suggestProgression({
      sets: [
        { weightKg: 50, reps: 9 },
        { weightKg: 50, reps: 8 },
        { weightKg: 50, reps: 8 },
      ],
      targetSets: 3,
      repMin: 6,
      repMax: 10,
      incrementKg: 2.5,
    });
    expect(advice.kind).toBe("hold");
  });

  it("adviseert niet zwaarder als er minder sets zijn gehaald dan voorgeschreven", () => {
    const advice = suggestProgression({
      sets: [{ weightKg: 50, reps: 10 }],
      targetSets: 3,
      repMin: 6,
      repMax: 10,
      incrementKg: 2.5,
    });
    expect(advice.kind).toBe("hold");
  });

  it("adviseert lichter als de meeste sets onder de ondergrens blijven", () => {
    const advice = suggestProgression({
      sets: [
        { weightKg: 60, reps: 4 },
        { weightKg: 60, reps: 4 },
        { weightKg: 60, reps: 7 },
      ],
      targetSets: 3,
      repMin: 6,
      repMax: 10,
      incrementKg: 2.5,
    });
    expect(advice.kind).toBe("reduce");
    if (advice.kind === "reduce") expect(advice.suggestedWeightKg).toBe(57.5);
  });

  it("kijkt alleen naar de sets op het zwaarste gewicht", () => {
    const advice = suggestProgression({
      sets: [
        { weightKg: 40, reps: 12 },
        { weightKg: 50, reps: 10 },
        { weightKg: 50, reps: 10 },
        { weightKg: 50, reps: 10 },
      ],
      targetSets: 3,
      repMin: 6,
      repMax: 10,
      incrementKg: 2.5,
    });
    expect(advice.kind).toBe("increase");
  });

  it("geeft geen advies zonder afgeronde sets", () => {
    const advice = suggestProgression({
      sets: [],
      targetSets: 3,
      repMin: 6,
      repMax: 10,
      incrementKg: 2.5,
    });
    expect(advice.kind).toBe("unknown");
  });

  it("gebruikt een kleinere stap voor isolatieoefeningen", () => {
    expect(
      incrementForExercise(
        { category: "COMPOUND", equipment: "BARBELL" },
        settings,
      ),
    ).toBe(2.5);
    expect(
      incrementForExercise(
        { category: "ISOLATION", equipment: "DUMBBELL" },
        settings,
      ),
    ).toBe(1.25);
    expect(
      incrementForExercise({ category: "CORE", equipment: "CABLE" }, settings),
    ).toBe(1.25);
  });
});

describe("persoonlijke records", () => {
  const sessions = [
    {
      date: "2026-09-01",
      sets: [
        { weightKg: 50, reps: 8 },
        { weightKg: 50, reps: 7 },
      ],
    },
    {
      date: "2026-09-08",
      sets: [
        { weightKg: 52.5, reps: 8 },
        { weightKg: 52.5, reps: 6 },
      ],
    },
    { date: "2026-09-15", sets: [{ weightKg: 50, reps: 12 }] },
  ];

  it("vindt de zwaarste set en het beste volume", () => {
    const records = personalRecords(sessions, { supportsOneRepMax: true });
    expect(records.heaviestSet).toMatchObject({
      weightKg: 52.5,
      reps: 8,
      date: "2026-09-08",
    });
    // 50 kg x 12 reps schat hoger dan 52,5 kg x 8 reps.
    expect(records.bestEstimatedOneRepMax).toMatchObject({
      value: 70,
      date: "2026-09-15",
    });
    // 2 x 50 kg (8 + 7 reps) = 750 kg, meer dan 2 x 52,5 kg (8 + 6 reps) = 735 kg.
    expect(records.bestVolumeSession).toMatchObject({
      volumeKg: 750,
      date: "2026-09-01",
    });
  });

  it("laat de 1RM weg bij oefeningen waar die niets zegt", () => {
    const records = personalRecords(sessions, { supportsOneRepMax: false });
    expect(records.bestEstimatedOneRepMax).toBeNull();
    expect(records.heaviestSet).not.toBeNull();
  });

  it("geeft lege records terug zonder sessies", () => {
    const records = personalRecords([], { supportsOneRepMax: true });
    expect(records.heaviestSet).toBeNull();
    expect(records.bestVolumeSession).toBeNull();
  });

  it("rekent het volume van een sessie uit", () => {
    expect(
      sessionVolume([
        { weightKg: 50, reps: 10 },
        { weightKg: 40, reps: 10 },
      ]),
    ).toBe(900);
  });
});
