import { useLiveQuery } from "dexie-react-hooks";
import {
  CalendarRange,
  Check,
  ChevronRight,
  Dumbbell,
  Play,
  Plus,
  Scale,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { WeekStrip } from "./week-strip";
import { MealSlotPicker } from "@/features/nutrition/meal-slot-picker";
import { nextScheduledDay } from "@/features/workouts/schedule";
import { ProgressLineChart } from "@/components/shared/line-chart";
import { PageSkeleton } from "@/components/shared/loading";
import { Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import { getMealsForDate } from "@/db/repo/mealPlan";
import { getActiveProgramWithDays } from "@/db/repo/programs";
import { listWeightEntries } from "@/db/repo/progress";
import {
  getActiveSession,
  getLastCompletionForDay,
  startSessionFromDay,
} from "@/db/repo/workouts";
import type { MealCategory } from "@/db/types";
import { useSettings } from "@/hooks/use-settings";
import { useToday } from "@/hooks/use-today";
import { formatRelativeDay, formatShortDate } from "@/lib/dates";
import { MEAL_CATEGORY_LABELS, MEAL_CATEGORY_ORDER } from "@/lib/labels";
import { formatNumber, formatSignedNumber } from "@/lib/units";
import { movingAverage, weightSummary } from "@/lib/weight";

export function DashboardPage() {
  const navigate = useNavigate();
  const today = useToday();
  const settings = useSettings();

  const program = useLiveQuery(() => getActiveProgramWithDays(), []);
  const activeSession = useLiveQuery(() => getActiveSession(), []);
  const meals = useLiveQuery(() => getMealsForDate(today), [today]);
  const entries = useLiveQuery(() => listWeightEntries(), []);
  const lastCompletion = useLiveQuery(async () => {
    const active = await getActiveProgramWithDays();
    if (!active) return null;
    const next = nextScheduledDay(active.days, today);
    return next ? getLastCompletionForDay(next.day.id) : null;
  }, [today]);

  const [picker, setPicker] = useState<{
    date: string;
    slot: MealCategory;
  } | null>(null);

  if (
    program === undefined ||
    meals === undefined ||
    entries === undefined ||
    !settings
  ) {
    return <PageSkeleton />;
  }

  const next = program ? nextScheduledDay(program.days, today) : null;
  const isToday = next?.daysFromToday === 0;
  const summary = weightSummary(entries, {
    startWeightKg: settings.startWeightKg,
  });
  const chart = movingAverage(entries, 7)
    .slice(-30)
    .map((point) => ({
      date: point.date,
      value: point.weightKg,
      secondary: point.average,
    }));

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-muted-foreground">
          {formatRelativeDay(today)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isToday ? "Vandaag train je" : "Rustdag"}
        </h1>
      </header>

      {/* Training van vandaag */}
      <section className="rounded-xl border bg-card p-4">
        {next ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isToday
                    ? "Training van vandaag"
                    : `Volgende training · ${formatRelativeDay(next.date)}`}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{next.day.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {next.day.exercises.length} oefeningen
                  {lastCompletion
                    ? ` · laatst gedaan ${formatShortDate(lastCompletion)}`
                    : " · nog niet eerder gedaan"}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Dumbbell className="size-5" aria-hidden />
              </span>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={async () => {
                if (activeSession) {
                  navigate(`/training/sessie/${activeSession.id}`);
                  return;
                }
                const id = await startSessionFromDay(next.day.id);
                navigate(`/training/sessie/${id}`);
              }}
            >
              <Play className="size-5" aria-hidden />
              {activeSession
                ? "Training hervatten"
                : isToday
                  ? "Start training"
                  : "Nu alvast starten"}
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Nog geen trainingsschema ingesteld.
            </p>
            <Button
              nativeButton={false}
              render={<Link to="/training/schema" />}
              size="sm"
            >
              Schema maken
            </Button>
          </div>
        )}
      </section>

      {/* Maaltijden van vandaag */}
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <UtensilsCrossed
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            Eten vandaag
          </h2>
          <Button
            nativeButton={false}
            render={<Link to="/voeding/planner" />}
            variant="ghost"
            size="sm"
          >
            Weekmenu
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        <ul className="divide-y">
          {MEAL_CATEGORY_ORDER.map((slot) => {
            const meal = meals.find((item) => item.slot === slot);
            return (
              <li key={slot} className="flex items-center gap-3 py-2.5">
                <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {MEAL_CATEGORY_LABELS[slot]}
                </span>

                {meal?.recipe ? (
                  <Link
                    to={`/voeding/recept/${meal.recipe.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="block truncate text-sm font-medium">
                      {meal.recipe.name}
                    </span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {meal.servings}{" "}
                      {meal.servings === 1 ? "portie" : "porties"} ·{" "}
                      {meal.recipe.prepMinutes} min
                    </span>
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                    {meal?.customTitle ?? "Nog niets gepland"}
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    meal
                      ? `${MEAL_CATEGORY_LABELS[slot]} vervangen`
                      : `${MEAL_CATEGORY_LABELS[slot]} kiezen`
                  }
                  className="text-muted-foreground"
                  onClick={() => setPicker({ date: today, slot })}
                >
                  {meal ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Plus className="size-4" aria-hidden />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Gewicht */}
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Scale className="size-4 text-muted-foreground" aria-hidden />
            Gewicht
          </h2>
          <Button
            nativeButton={false}
            render={<Link to="/voortgang/gewicht" />}
            variant="ghost"
            size="sm"
          >
            {entries.length === 0 ? "Invoeren" : "Bekijken"}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nog geen wegingen. Voer er een paar in en je ziet hier je
            weekgemiddelde.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Laatste"
                value={
                  summary.latest
                    ? `${formatNumber(summary.latest.weightKg)} kg`
                    : "—"
                }
                hint={
                  summary.latest
                    ? formatShortDate(summary.latest.date)
                    : undefined
                }
              />
              <Stat
                label="Week"
                value={
                  summary.currentWeekAverage != null
                    ? `${formatNumber(summary.currentWeekAverage)} kg`
                    : "—"
                }
                hint={`${summary.currentWeekCount} ${summary.currentWeekCount === 1 ? "meting" : "metingen"}`}
              />
              <Stat
                label="Verschil"
                value={
                  summary.weeklyChange != null
                    ? `${formatSignedNumber(summary.weeklyChange)} kg`
                    : "—"
                }
                tone={
                  summary.weeklyChange == null
                    ? "muted"
                    : summary.weeklyChange > 0
                      ? "negative"
                      : "positive"
                }
                hint="t.o.v. vorige week"
              />
            </div>
            {chart.length > 1 ? (
              <div className="mt-3">
                <ProgressLineChart
                  data={chart}
                  unit="kg"
                  height={140}
                  valueLabel="Weging"
                  secondaryLabel="Gemiddelde (7 dagen)"
                />
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Weekoverzicht */}
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarRange
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            Deze week
          </h2>
        </div>
        <WeekStrip />
      </section>

      <MealSlotPicker target={picker} onClose={() => setPicker(null)} />
    </div>
  );
}
