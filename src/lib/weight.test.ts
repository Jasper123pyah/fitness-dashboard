import { describe, expect, it } from "vitest";

import type { WeightEntry } from "@/db/types";
import {
  movingAverage,
  weeklyAverages,
  weeklyTrend,
  weightSummary,
} from "./weight";

function entry(date: string, weightKg: number): WeightEntry {
  return { id: `w-${date}`, date, weightKg };
}

// 2026-10-12 is een maandag, 2026-10-19 de maandag erna.
const entries: WeightEntry[] = [
  entry("2026-10-05", 75.4),
  entry("2026-10-07", 75.0),
  entry("2026-10-12", 74.8),
  entry("2026-10-14", 75.2),
  entry("2026-10-16", 74.6),
];

describe("weekgemiddelden", () => {
  it("groepeert metingen per week vanaf maandag", () => {
    const averages = weeklyAverages(entries);
    expect(averages).toHaveLength(2);
    expect(averages[0]).toMatchObject({ weekStart: "2026-10-05", count: 2 });
    expect(averages[0].average).toBeCloseTo(75.2);
    expect(averages[1]).toMatchObject({ weekStart: "2026-10-12", count: 3 });
    expect(averages[1].average).toBeCloseTo((74.8 + 75.2 + 74.6) / 3);
  });

  it("rekent alleen met echte metingen en vult niets aan met nul", () => {
    const averages = weeklyAverages([entry("2026-10-12", 75)]);
    expect(averages).toHaveLength(1);
    expect(averages[0].average).toBe(75);
    expect(averages[0].count).toBe(1);
  });

  it("slaat weken zonder meting over in plaats van ze nul te maken", () => {
    const gapped = weeklyAverages([
      entry("2026-09-28", 76),
      entry("2026-10-12", 75),
    ]);
    expect(gapped.map((week) => week.weekStart)).toEqual([
      "2026-09-28",
      "2026-10-12",
    ]);
  });

  it("negeert onbruikbare waarden", () => {
    const averages = weeklyAverages([
      entry("2026-10-12", 75),
      { id: "bad", date: "2026-10-13", weightKg: Number.NaN },
    ]);
    expect(averages[0]).toMatchObject({ count: 1, average: 75 });
  });

  it("geeft ook de laagste en hoogste meting van de week", () => {
    const averages = weeklyAverages(entries);
    expect(averages[1]).toMatchObject({ min: 74.6, max: 75.2 });
  });
});

describe("samenvatting", () => {
  it("vergelijkt deze week met vorige week", () => {
    const summary = weightSummary(entries, {
      today: "2026-10-16",
      startWeightKg: 75,
    });

    expect(summary.latest?.date).toBe("2026-10-16");
    expect(summary.currentWeekCount).toBe(3);
    expect(summary.previousWeekCount).toBe(2);
    expect(summary.currentWeekAverage).toBeCloseTo(74.87, 2);
    expect(summary.previousWeekAverage).toBeCloseTo(75.2);
    expect(summary.weeklyChange).toBeCloseTo(-0.33, 2);
    expect(summary.totalChange).toBeCloseTo(-0.4);
  });

  it("laat het verschil leeg als een van de twee weken geen meting heeft", () => {
    const summary = weightSummary([entry("2026-10-12", 75)], {
      today: "2026-10-16",
    });
    expect(summary.previousWeekAverage).toBeNull();
    expect(summary.weeklyChange).toBeNull();
  });

  it("geeft lege waarden terug zonder metingen", () => {
    const summary = weightSummary([], {
      today: "2026-10-16",
      startWeightKg: 75,
    });
    expect(summary.latest).toBeNull();
    expect(summary.currentWeekAverage).toBeNull();
    expect(summary.totalChange).toBeNull();
  });
});

describe("trend", () => {
  it("berekent een lopend gemiddelde over echte metingen", () => {
    const smoothed = movingAverage(entries, 7);
    expect(smoothed).toHaveLength(5);
    expect(smoothed[0].average).toBeCloseTo(75.4);
    expect(smoothed[1].average).toBeCloseTo(75.2);
    expect(smoothed[4].average).toBeCloseTo((74.8 + 75.2 + 74.6) / 3, 5);
  });

  it("geeft de verandering per week", () => {
    const trend = weeklyTrend(entries, 4);
    expect(trend).not.toBeNull();
    expect(trend as number).toBeCloseTo(
      ((74.8 + 75.2 + 74.6) / 3 - 75.2) / 1,
      2,
    );
  });

  it("geeft geen trend met minder dan twee weken", () => {
    expect(weeklyTrend([entry("2026-10-12", 75)])).toBeNull();
  });
});
