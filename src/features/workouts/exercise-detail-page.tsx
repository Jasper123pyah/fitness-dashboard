import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  Info,
  Pencil,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ExerciseFormDialog } from "./exercise-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressLineChart } from "@/components/shared/line-chart";
import { PageSkeleton } from "@/components/shared/loading";
import { Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import { deleteExercise } from "@/db/repo/exercises";
import { getExerciseHistory } from "@/db/repo/workouts";
import { formatShortDate } from "@/lib/dates";
import {
  EQUIPMENT_LABELS,
  EXERCISE_CATEGORY_LABELS,
  MUSCLE_GROUP_LABELS,
} from "@/lib/labels";
import { formatQuantity } from "@/lib/units";

export function ExerciseDetailPage() {
  const { exerciseId = "" } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const history = useLiveQuery(
    () => getExerciseHistory(exerciseId),
    [exerciseId],
  );

  if (history === undefined) return <PageSkeleton />;

  if (history === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Deze oefening bestaat niet meer.
        </p>
        <Button
          nativeButton={false}
          render={<Link to="/training/oefeningen" />}
        >
          Naar oefeningen
        </Button>
      </div>
    );
  }

  const { exercise, points, records, advice } = history;
  const chartData = points.map((point) => ({
    date: point.date,
    value: point.topWeightKg,
    secondary: point.estimatedOneRepMax ?? undefined,
  }));

  return (
    <div className="space-y-5">
      <Button
        nativeButton={false}
        render={<Link to="/training/oefeningen" />}
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Oefeningen
      </Button>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl/tight font-semibold tracking-tight">
            {exercise.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {MUSCLE_GROUP_LABELS[exercise.primaryMuscle]} ·{" "}
            {EQUIPMENT_LABELS[exercise.equipment]} ·{" "}
            {EXERCISE_CATEGORY_LABELS[exercise.category]}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Oefening aanpassen"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Oefening verwijderen"
            className="text-muted-foreground"
            onClick={async () => {
              const result = await deleteExercise(exercise.id);
              if (result.deleted) {
                toast.success("Oefening verwijderd");
                navigate("/training/oefeningen");
                return;
              }
              toast.error("Deze oefening is nog in gebruik", {
                description: `${result.usedInPrograms} keer in een schema en ${result.usedInSessions} keer in je logboek. De geschiedenis blijft bewaard.`,
              });
            }}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      {exercise.instructions ? (
        <p className="flex gap-2 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="whitespace-pre-line">{exercise.instructions}</span>
        </p>
      ) : null}

      {advice && advice.kind !== "unknown" ? (
        <div className="flex gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <TrendingUp
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          <div className="text-sm">
            <p className="font-medium">Advies voor de volgende keer</p>
            <p className="text-muted-foreground">
              {advice.kind === "increase"
                ? `${advice.reason} Probeer ${formatQuantity(advice.suggestedWeightKg)} kg.`
                : advice.kind === "reduce"
                  ? `${advice.reason} Probeer ${formatQuantity(advice.suggestedWeightKg)} kg.`
                  : advice.reason}
            </p>
          </div>
        </div>
      ) : null}

      {points.length === 0 ? (
        <EmptyState
          title="Nog geen gegevens"
          description="Zodra je deze oefening in een afgeronde training hebt gedaan, zie je hier je voortgang."
        />
      ) : (
        <>
          <section className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Zwaarste set per training
              </h2>
              {exercise.supportsOneRepMax ? (
                <span className="text-xs text-muted-foreground">
                  streep = geschatte 1RM
                </span>
              ) : null}
            </div>
            <ProgressLineChart
              data={chartData}
              unit="kg"
              valueLabel="Topset"
              secondaryLabel="Geschatte 1RM"
            />
          </section>

          <section className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">
            <Stat
              label="Zwaarste set"
              value={
                records.heaviestSet
                  ? `${formatQuantity(records.heaviestSet.weightKg)} kg`
                  : "—"
              }
              hint={
                records.heaviestSet
                  ? `${records.heaviestSet.reps} reps · ${formatShortDate(records.heaviestSet.date)}`
                  : undefined
              }
            />
            <Stat
              label="Beste volume"
              value={
                records.bestVolumeSession
                  ? `${records.bestVolumeSession.volumeKg} kg`
                  : "—"
              }
              hint={
                records.bestVolumeSession
                  ? formatShortDate(records.bestVolumeSession.date)
                  : undefined
              }
            />
            {exercise.supportsOneRepMax ? (
              <Stat
                label="Geschatte 1RM"
                value={
                  records.bestEstimatedOneRepMax
                    ? `${formatQuantity(records.bestEstimatedOneRepMax.value)} kg`
                    : "—"
                }
                hint={
                  records.bestEstimatedOneRepMax
                    ? `${formatQuantity(records.bestEstimatedOneRepMax.weightKg)} kg × ${records.bestEstimatedOneRepMax.reps}`
                    : undefined
                }
              />
            ) : (
              <Stat
                label="Geschatte 1RM"
                value="n.v.t."
                tone="muted"
                hint="Niet zinvol bij deze oefening"
              />
            )}
            <Stat label="Trainingen" value={points.length} />
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Trophy className="size-4" aria-hidden />
              Per training
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {[...points].reverse().map((point) => (
                <li
                  key={point.sessionId}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <Link
                    to={`/training/sessie/${point.sessionId}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium tabular-nums">
                      {formatQuantity(point.topWeightKg)} kg ×{" "}
                      {point.topSetReps}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatShortDate(point.date)} · {point.totalReps} reps
                      totaal · {point.volumeKg} kg
                      {point.estimatedOneRepMax != null
                        ? ` · 1RM ≈ ${formatQuantity(point.estimatedOneRepMax)} kg`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <ExerciseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        exercise={exercise}
        onSaved={() => toast.success("Oefening bijgewerkt")}
      />
    </div>
  );
}
