import type { WorkoutDayWithExercises } from "@/db/repo/programs";
import {
  addDaysToKey,
  todayKey,
  weekdayOfKey,
  type DateKey,
} from "@/lib/dates";

export interface ScheduledDay {
  day: WorkoutDayWithExercises;
  date: DateKey;
  /** 0 = vandaag, 1 = morgen, enzovoort. */
  daysFromToday: number;
}

/** De training die voor vandaag op het schema staat, als die er is. */
export function dayForDate(
  days: WorkoutDayWithExercises[],
  date: DateKey,
): WorkoutDayWithExercises | null {
  const weekday = weekdayOfKey(date);
  return days.find((day) => day.weekday === weekday) ?? null;
}

/** De eerstvolgende training, ook als die pas na het weekend is. */
export function nextScheduledDay(
  days: WorkoutDayWithExercises[],
  from: DateKey = todayKey(),
): ScheduledDay | null {
  for (let offset = 0; offset < 14; offset += 1) {
    const date = addDaysToKey(from, offset);
    const day = dayForDate(days, date);
    if (day) return { day, date, daysFromToday: offset };
  }
  return null;
}

export function upcomingAfterToday(
  days: WorkoutDayWithExercises[],
  from: DateKey = todayKey(),
): ScheduledDay | null {
  return nextScheduledDay(days, addDaysToKey(from, 1));
}
