import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, CheckCircle2, Plus, Timer, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ExercisePicker } from "./exercise-picker";
import { RestTimer, type RestTimerState } from "./rest-timer";
import { SessionExerciseCard } from "./session-exercise-card";
import { PageSkeleton } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  addExerciseToSession,
  addSet,
  completeSession,
  deleteSession,
  getAdviceForSession,
  getPreviousPerformance,
  getSessionDetail,
  moveSessionExercise,
  removeExerciseFromSession,
  removeSet,
  replaceSessionExercise,
  updateSessionNotes,
  updateSet,
} from "@/db/repo/workouts";
import type { SetLog } from "@/db/types";
import { useSettings } from "@/hooks/use-settings";
import { formatLongDate, formatSeconds } from "@/lib/dates";
import { completedWorkingSets, sessionVolume } from "@/lib/progression";

export function SessionPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const settings = useSettings();

  const session = useLiveQuery(() => getSessionDetail(sessionId), [sessionId]);
  const advice = useLiveQuery(
    () => getAdviceForSession(sessionId),
    [sessionId],
  );
  const previousByExercise = useLiveQuery(async () => {
    const detail = await getSessionDetail(sessionId);
    if (!detail)
      return new Map<
        string,
        Awaited<ReturnType<typeof getPreviousPerformance>>
      >();
    const entries = await Promise.all(
      detail.exercises.map(
        async (log) =>
          [
            log.exerciseId,
            await getPreviousPerformance(log.exerciseId, {
              excludeSessionId: sessionId,
            }),
          ] as const,
      ),
    );
    return new Map(entries);
  }, [sessionId]);

  const [timer, setTimer] = useState<RestTimerState | null>(null);
  const [pickerFor, setPickerFor] = useState<
    { mode: "add" } | { mode: "replace"; logId: string } | null
  >(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [elapsed, setElapsed] = useState("0:00");
  /** "empty": afronden zonder sets; "manual": via de verwijderknop. */
  const [deleteFor, setDeleteFor] = useState<"empty" | "manual" | null>(null);

  // Looptijd van de training; begint bij de starttijd uit de database, dus ook
  // na het sluiten van de app klopt hij nog.
  useEffect(() => {
    if (!session || session.status !== "IN_PROGRESS") return;
    const startedAt = new Date(session.startedAt).getTime();
    const tick = () =>
      setElapsed(formatSeconds((Date.now() - startedAt) / 1000));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const totals = useMemo(() => {
    if (!session) return { sets: 0, volume: 0 };
    const sets = session.exercises.flatMap((log) => log.sets);
    const done = completedWorkingSets(sets);
    return { sets: done.length, volume: sessionVolume(done) };
  }, [session]);

  if (session === undefined) return <PageSkeleton />;

  if (session === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Deze training bestaat niet meer.
        </p>
        <Button nativeButton={false} render={<Link to="/training" />}>
          Naar training
        </Button>
      </div>
    );
  }

  const restSeconds = settings?.defaultRestSeconds ?? 120;

  async function handleToggleSet(set: SetLog) {
    const next = !set.completed;
    await updateSet(set.id, { completed: next });

    if (next) {
      const log = session?.exercises.find((item) =>
        item.sets.some((s) => s.id === set.id),
      );
      const seconds = log?.targetRestSec ?? restSeconds;
      if (seconds > 0)
        setTimer({ totalSeconds: seconds, startedAt: Date.now() });
    }
  }

  async function handleComplete() {
    if (totals.sets === 0) {
      // Zonder afgeronde sets valt er niets op te slaan; bied stoppen aan.
      setDeleteFor("empty");
      return;
    }
    await completeSession(session!.id);
    toast.success("Training afgerond", {
      description: `${totals.sets} sets · ${totals.volume} kg totaal`,
    });
    navigate("/training");
  }

  async function handleDelete() {
    setTimer(null);
    await deleteSession(session!.id);
    setDeleteFor(null);
    toast.success("Training verwijderd");
    navigate("/training");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          nativeButton={false}
          render={<Link to="/training" />}
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Training
        </Button>
        <div className="flex items-center gap-1">
          {session.status === "COMPLETED" ? (
            <span className="mr-1 flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              Afgerond
            </span>
          ) : (
            <Button size="sm" onClick={() => void handleComplete()}>
              <CheckCircle2 className="size-4" aria-hidden />
              Afronden
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Training verwijderen"
            className="text-muted-foreground"
            onClick={() => setDeleteFor("manual")}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <header className="rounded-xl border bg-card p-4">
        <h1 className="text-xl font-semibold tracking-tight">{session.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatLongDate(session.date)}
        </p>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Tijd</dt>
            <dd className="font-semibold tabular-nums">
              {session.status === "IN_PROGRESS" ? elapsed : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sets</dt>
            <dd className="font-semibold tabular-nums">{totals.sets}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Volume</dt>
            <dd className="font-semibold tabular-nums">{totals.volume} kg</dd>
          </div>
        </dl>
      </header>

      <div className="space-y-3">
        {session.exercises.map((log, index) => (
          <SessionExerciseCard
            key={log.id}
            log={log}
            previous={previousByExercise?.get(log.exerciseId) ?? null}
            advice={advice?.get(log.id) ?? null}
            isFirst={index === 0}
            isLast={index === session.exercises.length - 1}
            onSetChange={(setId, patch) => void updateSet(setId, patch)}
            onToggleSet={(set) => void handleToggleSet(set)}
            onAddSet={() => void addSet(log.id)}
            onRemoveSet={(setId) => void removeSet(setId)}
            onMove={(direction) => void moveSessionExercise(log.id, direction)}
            onReplace={() => setPickerFor({ mode: "replace", logId: log.id })}
            onRemove={() => {
              void removeExerciseFromSession(log.id);
              toast.success(`${log.exercise.name} uit de training gehaald`);
            }}
            onApplyAdvice={async (weightKg) => {
              await Promise.all(
                log.sets
                  .filter((set) => !set.completed)
                  .map((set) => updateSet(set.id, { weightKg })),
              );
              toast.success(`Gewicht gezet op ${weightKg} kg`);
            }}
          />
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={() => setPickerFor({ mode: "add" })}>
          <Plus className="size-4" aria-hidden />
          Oefening toevoegen
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setNotesDraft(session.notes ?? "");
            setNotesOpen(true);
          }}
        >
          {session.notes ? "Notitie aanpassen" : "Notitie toevoegen"}
        </Button>
      </div>

      {session.notes ? (
        <p className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line">
          {session.notes}
        </p>
      ) : null}

      {session.status === "IN_PROGRESS" ? (
        <Button
          size="lg"
          className="w-full"
          onClick={() => void handleComplete()}
        >
          <CheckCircle2 className="size-5" aria-hidden />
          Training afronden
        </Button>
      ) : null}

      {session.status === "IN_PROGRESS" && !timer ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() =>
            setTimer({ totalSeconds: restSeconds, startedAt: Date.now() })
          }
        >
          <Timer className="size-4" aria-hidden />
          Rusttimer starten ({formatSeconds(restSeconds)})
        </Button>
      ) : null}

      {timer ? (
        <RestTimer
          state={timer}
          onClose={() => setTimer(null)}
          onChange={setTimer}
        />
      ) : null}

      <ExercisePicker
        open={pickerFor != null}
        onOpenChange={(open) => {
          if (!open) setPickerFor(null);
        }}
        title={
          pickerFor?.mode === "replace"
            ? "Oefening vervangen"
            : "Oefening toevoegen"
        }
        description={
          pickerFor?.mode === "replace"
            ? "De sets blijven staan, het gewicht wordt opnieuw voorgevuld op basis van de historie."
            : undefined
        }
        excludeIds={session.exercises.map((log) => log.exerciseId)}
        onSelect={async (exerciseId) => {
          if (!pickerFor) return;
          try {
            if (pickerFor.mode === "add") {
              await addExerciseToSession(session.id, exerciseId);
            } else {
              await replaceSessionExercise(pickerFor.logId, exerciseId);
            }
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Dat lukte niet",
            );
          } finally {
            setPickerFor(null);
          }
        }}
      />

      <Dialog
        open={deleteFor != null}
        onOpenChange={(open) => {
          if (!open) setDeleteFor(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {deleteFor === "empty"
                ? "Nog geen set afgerond"
                : "Training verwijderen?"}
            </DialogTitle>
            <DialogDescription>
              {deleteFor === "empty"
                ? "Er is niets om op te slaan. Wil je deze training stoppen en verwijderen?"
                : totals.sets > 0
                  ? `De ${totals.sets} afgeronde sets verdwijnen uit je geschiedenis. Dit kan niet ongedaan worden gemaakt.`
                  : "Deze training wordt verwijderd."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="ghost">
                  {deleteFor === "empty" ? "Doortrainen" : "Annuleren"}
                </Button>
              }
            />
            <Button variant="destructive" onClick={() => void handleDelete()}>
              <Trash2 className="size-4" aria-hidden />
              {deleteFor === "empty" ? "Stoppen en verwijderen" : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notitie bij deze training</DialogTitle>
            <DialogDescription>
              Bijvoorbeeld hoe het voelde of waarom je een oefening hebt
              overgeslagen.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={4}
            placeholder="Benen voelden zwaar, rustig aan gedaan bij de leg press."
          />
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              onClick={async () => {
                await updateSessionNotes(session.id, notesDraft);
                setNotesOpen(false);
              }}
            >
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
