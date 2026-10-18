import { useLiveQuery } from "dexie-react-hooks";
import {
  CalendarDays,
  ChevronRight,
  Dumbbell,
  History,
  ListChecks,
  Play,
  Sliders,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { nextScheduledDay } from "./schedule";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getActiveProgramWithDays } from "@/db/repo/programs";
import {
  getActiveSession,
  getLastCompletionForDay,
  listSessionSummaries,
  startEmptySession,
  startSessionFromDay,
} from "@/db/repo/workouts";
import {
  formatRelativeDay,
  formatShortDate,
  todayKey,
  WEEKDAY_NAMES_SHORT,
} from "@/lib/dates";

export function TrainingPage() {
  const navigate = useNavigate();
  const program = useLiveQuery(() => getActiveProgramWithDays(), []);
  const activeSession = useLiveQuery(() => getActiveSession(), []);
  const recent = useLiveQuery(() => listSessionSummaries(4), []);
  const lastCompletions = useLiveQuery(async () => {
    const active = await getActiveProgramWithDays();
    if (!active) return new Map<string, string | null>();
    const entries = await Promise.all(
      active.days.map(
        async (day) => [day.id, await getLastCompletionForDay(day.id)] as const,
      ),
    );
    return new Map(entries);
  }, []);

  if (program === undefined) return <PageSkeleton />;

  const today = todayKey();
  const next = program ? nextScheduledDay(program.days, today) : null;

  async function start(dayId: string) {
    if (activeSession) {
      navigate(`/training/sessie/${activeSession.id}`);
      return;
    }
    const sessionId = await startSessionFromDay(dayId);
    navigate(`/training/sessie/${sessionId}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Training"
        description={program ? program.name : "Nog geen schema"}
        action={
          <Button
            nativeButton={false}
            render={<Link to="/training/schema" />}
            variant="outline"
            size="sm"
          >
            <Sliders className="size-4" aria-hidden />
            Schema
          </Button>
        }
      />

      {!program || program.days.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Nog geen trainingsschema"
          description="Maak een schema met je trainingsdagen en oefeningen."
          action={
            <Button
              nativeButton={false}
              render={<Link to="/training/schema" />}
            >
              Schema maken
            </Button>
          }
        />
      ) : (
        <>
          {next ? (
            <section className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {next.daysFromToday === 0
                  ? "Vandaag"
                  : formatRelativeDay(next.date)}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{next.day.name}</h2>
              <p className="text-sm text-muted-foreground">
                {next.day.exercises.length} oefeningen
                {lastCompletions?.get(next.day.id)
                  ? ` · laatst gedaan ${formatShortDate(lastCompletions.get(next.day.id) as string)}`
                  : " · nog niet eerder gedaan"}
              </p>

              {next.day.notes ? (
                <p className="mt-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                  {next.day.notes}
                </p>
              ) : null}

              <Button
                size="lg"
                className="mt-4 w-full"
                onClick={() => void start(next.day.id)}
              >
                <Play className="size-5" aria-hidden />
                {activeSession
                  ? "Lopende training hervatten"
                  : next.daysFromToday === 0
                    ? "Start training"
                    : "Nu alvast starten"}
              </Button>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Trainingsdagen
            </h2>
            <ul className="space-y-2">
              {program.days.map((day) => (
                <li
                  key={day.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-[11px] font-semibold uppercase">
                    {day.weekday ? WEEKDAY_NAMES_SHORT[day.weekday - 1] : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{day.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {day.exercises.length} oefeningen
                      {lastCompletions?.get(day.id)
                        ? ` · ${formatShortDate(lastCompletions.get(day.id) as string)}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void start(day.id)}
                  >
                    Start
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="grid gap-2 sm:grid-cols-2">
        <Button
          nativeButton={false}
          render={<Link to="/training/oefeningen" />}
          variant="outline"
          className="justify-between"
        >
          <span className="flex items-center gap-2">
            <ListChecks className="size-4" aria-hidden />
            Oefeningen
          </span>
          <ChevronRight className="size-4" aria-hidden />
        </Button>
        <Button
          nativeButton={false}
          render={<Link to="/training/historie" />}
          variant="outline"
          className="justify-between"
        >
          <span className="flex items-center gap-2">
            <History className="size-4" aria-hidden />
            Historie
          </span>
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </section>

      {recent && recent.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Laatste trainingen
          </h2>
          <ul className="divide-y rounded-xl border bg-card">
            {recent.map((session) => (
              <li key={session.id}>
                <Link
                  to={`/training/sessie/${session.id}`}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <CalendarDays
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {session.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(session.date)} · {session.setCount} sets
                      · {session.volumeKg} kg
                      {session.status === "IN_PROGRESS" ? " · loopt nog" : ""}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={async () => {
          if (activeSession) {
            navigate(`/training/sessie/${activeSession.id}`);
            return;
          }
          const id = await startEmptySession();
          toast.success("Losse training gestart");
          navigate(`/training/sessie/${id}`);
        }}
      >
        Losse training starten
      </Button>
    </div>
  );
}
