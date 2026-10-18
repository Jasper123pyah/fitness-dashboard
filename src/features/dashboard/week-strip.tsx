import { useLiveQuery } from "dexie-react-hooks";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

import { CardSkeleton } from "@/components/shared/loading";
import { db } from "@/db/db";
import { getWeekPlan } from "@/db/repo/mealPlan";
import { getActiveProgramWithDays } from "@/db/repo/programs";
import {
  startOfWeekKey,
  todayKey,
  weekdayOfKey,
  weekKeys,
  WEEKDAY_NAMES_SHORT,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

/** De zeven dagen van deze week: wat er gepland staat en wat al gedaan is. */
export function WeekStrip() {
  const data = useLiveQuery(async () => {
    const weekStart = startOfWeekKey(todayKey());
    const days = weekKeys(weekStart);

    const [program, plan, sessions] = await Promise.all([
      getActiveProgramWithDays(),
      getWeekPlan(weekStart),
      db.sessions.where("date").anyOf(days).toArray(),
    ]);

    return days.map((date) => {
      const weekday = weekdayOfKey(date);
      const scheduled =
        program?.days.find((day) => day.weekday === weekday) ?? null;
      const session = sessions.find((item) => item.date === date) ?? null;
      const dinner =
        plan.days.find((day) => day.date === date)?.meals.DINNER ?? null;

      return {
        date,
        weekday,
        // Een losse training op een rustdag telt ook: laat zien wat er echt is gedaan.
        workoutName: scheduled?.name ?? session?.name ?? null,
        completed: session?.status === "COMPLETED",
        inProgress: session?.status === "IN_PROGRESS",
        sessionId: session?.id ?? null,
        dinner: dinner?.recipe?.name ?? dinner?.customTitle ?? null,
      };
    });
  }, []);

  if (!data) return <CardSkeleton lines={2} />;

  const today = todayKey();

  return (
    <ul className="space-y-1">
      {data.map((day) => (
        <li
          key={day.date}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2",
            day.date === today && "bg-accent/60",
          )}
        >
          <span
            className={cn(
              "w-8 shrink-0 text-xs font-semibold uppercase",
              day.date === today
                ? "text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            {WEEKDAY_NAMES_SHORT[day.weekday - 1]}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm">
              {day.workoutName ? (
                <>
                  {day.completed ? (
                    <Check
                      className="size-3.5 shrink-0 text-success"
                      aria-hidden
                    />
                  ) : null}
                  {day.sessionId ? (
                    <Link
                      to={`/training/sessie/${day.sessionId}`}
                      className="truncate font-medium"
                    >
                      {day.workoutName}
                    </Link>
                  ) : (
                    <span className="truncate font-medium">
                      {day.workoutName}
                    </span>
                  )}
                  {day.inProgress ? (
                    <span className="shrink-0 text-xs text-primary">loopt</span>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground">Rustdag</span>
              )}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {day.dinner ?? "geen avondeten gepland"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
