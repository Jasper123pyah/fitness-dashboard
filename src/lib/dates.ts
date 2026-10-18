/**
 * Datums in deze app zijn kalenderdagen, geen tijdstippen. Ze worden in
 * PostgreSQL als `date` opgeslagen en overal doorgegeven als sleutel in het
 * formaat `yyyy-MM-dd`. Zo kan er niets verschuiven door tijdzones.
 */

export type DateKey = string;

const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAY_NAMES_SHORT = [
  "ma",
  "di",
  "wo",
  "do",
  "vr",
  "za",
  "zo",
] as const;
export const WEEKDAY_NAMES = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
] as const;
const MONTH_NAMES = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
] as const;
const MONTH_NAMES_SHORT = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
] as const;

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Zet een `yyyy-MM-dd` sleutel om naar een Date op UTC-middernacht. */
export function dateFromKey(key: DateKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Zet een Date (of date-kolom uit de database) om naar een `yyyy-MM-dd` sleutel. */
export function toDateKey(value: Date | string): DateKey {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

/** De kalenderdag van vandaag in de tijdzone van de gebruiker. */
export function todayKey(now: Date = new Date()): DateKey {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  return toDateKey(new Date(dateFromKey(key).getTime() + days * DAY_MS));
}

export function daysBetweenKeys(from: DateKey, to: DateKey): number {
  return Math.round(
    (dateFromKey(to).getTime() - dateFromKey(from).getTime()) / DAY_MS,
  );
}

/** 1 = maandag ... 7 = zondag (ISO). */
export function weekdayOfKey(key: DateKey): number {
  const day = dateFromKey(key).getUTCDay();
  return day === 0 ? 7 : day;
}

/** De maandag van de week waarin deze dag valt. */
export function startOfWeekKey(key: DateKey): DateKey {
  return addDaysToKey(key, -(weekdayOfKey(key) - 1));
}

/** De zeven dagen van de week die op `mondayKey` begint. */
export function weekKeys(mondayKey: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, index) =>
    addDaysToKey(mondayKey, index),
  );
}

/** ISO-weeknummer, voor de koptekst van de weekplanner. */
export function isoWeekNumber(key: DateKey): number {
  const date = dateFromKey(key);
  const thursday = new Date(date.getTime() + (4 - weekdayOfKey(key)) * DAY_MS);
  const firstDayOfYear = new Date(
    `${thursday.getUTCFullYear()}-01-01T00:00:00.000Z`,
  );
  return Math.ceil(
    ((thursday.getTime() - firstDayOfYear.getTime()) / DAY_MS + 1) / 7,
  );
}

export function formatDayMonth(key: DateKey): string {
  const date = dateFromKey(key);
  return `${date.getUTCDate()} ${MONTH_NAMES_SHORT[date.getUTCMonth()]}`;
}

export function formatLongDate(key: DateKey): string {
  const date = dateFromKey(key);
  return `${WEEKDAY_NAMES[weekdayOfKey(key) - 1]} ${date.getUTCDate()} ${
    MONTH_NAMES[date.getUTCMonth()]
  }`;
}

export function formatShortDate(key: DateKey): string {
  const date = dateFromKey(key);
  return `${WEEKDAY_NAMES_SHORT[weekdayOfKey(key) - 1]} ${date.getUTCDate()} ${
    MONTH_NAMES_SHORT[date.getUTCMonth()]
  }`;
}

export function formatNumericDate(key: DateKey): string {
  const date = dateFromKey(key);
  return `${date.getUTCDate()}-${date.getUTCMonth() + 1}-${date.getUTCFullYear()}`;
}

export function formatWeekRange(mondayKey: DateKey): string {
  const sunday = addDaysToKey(mondayKey, 6);
  return `${formatDayMonth(mondayKey)} – ${formatDayMonth(sunday)}`;
}

/** "Vandaag", "Gisteren" of een korte datum. */
export function formatRelativeDay(
  key: DateKey,
  today: DateKey = todayKey(),
): string {
  const diff = daysBetweenKeys(today, key);
  if (diff === 0) return "Vandaag";
  if (diff === -1) return "Gisteren";
  if (diff === 1) return "Morgen";
  return formatShortDate(key);
}

export function formatTimeOfDay(value: Date): string {
  return value.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Duur in minuten als "1u 15m" of "45m". */
export function formatDuration(startedAt: Date, completedAt: Date): string {
  const minutes = Math.max(
    0,
    Math.round((completedAt.getTime() - startedAt.getTime()) / 60000),
  );
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}u ${minutes % 60}m`;
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${`${seconds}`.padStart(2, "0")}`;
}
