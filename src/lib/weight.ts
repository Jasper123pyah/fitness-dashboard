import type { DateKey, WeightEntry } from "@/db/types";
import { addDaysToKey, startOfWeekKey, todayKey } from "@/lib/dates";

export interface WeeklyAverage {
  /** Maandag van de week. */
  weekStart: DateKey;
  average: number;
  /** Aantal daadwerkelijke metingen; weken zonder meting komen niet voor. */
  count: number;
  min: number;
  max: number;
}

/**
 * Berekent per week het gemiddelde van de werkelijke wegingen.
 *
 * Een week zonder metingen krijgt géén regel: een ontbrekende meting is geen
 * nul en mag het gemiddelde niet omlaag trekken.
 */
export function weeklyAverages(entries: WeightEntry[]): WeeklyAverage[] {
  const buckets = new Map<DateKey, number[]>();

  for (const entry of entries) {
    if (!Number.isFinite(entry.weightKg)) continue;
    const week = startOfWeekKey(entry.date);
    const list = buckets.get(week);
    if (list) {
      list.push(entry.weightKg);
    } else {
      buckets.set(week, [entry.weightKg]);
    }
  }

  return [...buckets.entries()]
    .map(([weekStart, values]) => ({
      weekStart,
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export interface WeightSummary {
  latest: WeightEntry | null;
  /** Gemiddelde van de huidige week, of null zonder metingen. */
  currentWeekAverage: number | null;
  currentWeekCount: number;
  /** Gemiddelde van de vorige week, of null zonder metingen. */
  previousWeekAverage: number | null;
  previousWeekCount: number;
  /** Verschil tussen de twee weekgemiddelden, of null als er één ontbreekt. */
  weeklyChange: number | null;
  /** Verschil met het startgewicht uit de instellingen. */
  totalChange: number | null;
}

export function weightSummary(
  entries: WeightEntry[],
  options: { today?: DateKey; startWeightKg?: number } = {},
): WeightSummary {
  const today = options.today ?? todayKey();
  const thisWeek = startOfWeekKey(today);
  const lastWeek = addDaysToKey(thisWeek, -7);

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const averages = weeklyAverages(sorted);

  const current = averages.find((week) => week.weekStart === thisWeek) ?? null;
  const previous = averages.find((week) => week.weekStart === lastWeek) ?? null;
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const weeklyChange =
    current && previous ? current.average - previous.average : null;

  const totalChange =
    latest && options.startWeightKg != null
      ? latest.weightKg - options.startWeightKg
      : null;

  return {
    latest,
    currentWeekAverage: current?.average ?? null,
    currentWeekCount: current?.count ?? 0,
    previousWeekAverage: previous?.average ?? null,
    previousWeekCount: previous?.count ?? 0,
    weeklyChange,
    totalChange,
  };
}

/**
 * Lopend gemiddelde over een venster van dagen, bedoeld om de ruis uit de
 * grafiek te halen. Alleen echte metingen tellen mee.
 */
export function movingAverage(
  entries: WeightEntry[],
  windowDays = 7,
): { date: DateKey; weightKg: number; average: number }[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((entry, index) => {
    const windowStart = addDaysToKey(entry.date, -(windowDays - 1));
    let sum = 0;
    let count = 0;
    for (let i = index; i >= 0; i -= 1) {
      if (sorted[i].date < windowStart) break;
      sum += sorted[i].weightKg;
      count += 1;
    }
    return {
      date: entry.date,
      weightKg: entry.weightKg,
      average: count > 0 ? sum / count : entry.weightKg,
    };
  });
}

/** Trend van de metingen over een periode, in kg per week. */
export function weeklyTrend(entries: WeightEntry[], weeks = 4): number | null {
  const averages = weeklyAverages(entries).slice(-weeks);
  if (averages.length < 2) return null;

  const first = averages[0];
  const last = averages[averages.length - 1];
  const weekSpan =
    (new Date(`${last.weekStart}T00:00:00.000Z`).getTime() -
      new Date(`${first.weekStart}T00:00:00.000Z`).getTime()) /
    (7 * 24 * 60 * 60 * 1000);

  if (weekSpan <= 0) return null;
  return (last.average - first.average) / weekSpan;
}
