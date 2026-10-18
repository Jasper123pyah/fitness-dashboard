import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  MoreVertical,
  Minus,
  Plus,
  Repeat,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import { SetRow, type PreviousSetHint } from "./set-row";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ExerciseLogWithSets,
  PreviousPerformance,
} from "@/db/repo/workouts";
import type { SetLog } from "@/db/types";
import { formatRelativeDay } from "@/lib/dates";
import type { ProgressionAdvice } from "@/lib/progression";
import { formatQuantity } from "@/lib/units";

export function SessionExerciseCard({
  log,
  previous,
  advice,
  isFirst,
  isLast,
  onSetChange,
  onToggleSet,
  onAddSet,
  onRemoveSet,
  onMove,
  onReplace,
  onRemove,
  onApplyAdvice,
}: {
  log: ExerciseLogWithSets;
  previous: PreviousPerformance | null;
  advice: ProgressionAdvice | null;
  isFirst: boolean;
  isLast: boolean;
  onSetChange: (
    setId: string,
    patch: Partial<Pick<SetLog, "weightKg" | "reps">>,
  ) => void;
  onToggleSet: (set: SetLog) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onMove: (direction: -1 | 1) => void;
  onReplace: () => void;
  onRemove: () => void;
  onApplyAdvice: (weightKg: number) => void;
}) {
  const previousFor = (setNumber: number): PreviousSetHint | null => {
    if (!previous) return null;
    const match = previous.sets.find((item) => item.setNumber === setNumber);
    if (match) return match;
    const last = previous.sets[previous.sets.length - 1];
    return last ? { weightKg: last.weightKg, reps: null } : null;
  };

  const doneSets = log.sets.filter((set) => set.completed).length;

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-start justify-between gap-2 border-b px-3 py-3">
        <div className="min-w-0">
          <Link
            to={`/training/oefeningen/${log.exerciseId}`}
            className="group flex items-center gap-1 font-semibold"
          >
            <span className="truncate">{log.exercise.name}</span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Doel: {log.targetSets} × {log.targetRepMin}–{log.targetRepMax}
            {previous
              ? ` · vorige keer ${formatRelativeDay(previous.date).toLowerCase()}`
              : " · eerste keer"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
            {doneSets}/{log.sets.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Opties voor deze oefening"
                >
                  <MoreVertical className="size-4" aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={isFirst} onClick={() => onMove(-1)}>
                <ArrowUp className="size-4" aria-hidden />
                Eerder in de training
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isLast} onClick={() => onMove(1)}>
                <ArrowDown className="size-4" aria-hidden />
                Later in de training
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onReplace}>
                <Repeat className="size-4" aria-hidden />
                Oefening vervangen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} variant="destructive">
                <Trash2 className="size-4" aria-hidden />
                Uit training halen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {advice && advice.kind !== "unknown" ? (
        <div className="flex items-start gap-2 border-b bg-muted/40 px-3 py-2">
          <TrendingUp
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          <p className="text-xs text-muted-foreground">
            {advice.reason}
            {advice.kind === "increase" ? (
              <Button
                variant="link"
                size="xs"
                className="ml-1 h-auto p-0 align-baseline"
                onClick={() => onApplyAdvice(advice.suggestedWeightKg)}
              >
                Zet op {formatQuantity(advice.suggestedWeightKg)} kg
              </Button>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="px-2 py-2">
        <div className="grid grid-cols-[1.75rem_4rem_1fr_1fr_2.5rem] gap-2 px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="text-center">Set</span>
          <span>Vorige</span>
          <span className="text-center">Kg</span>
          <span className="text-center">Reps</span>
          <span />
        </div>

        <div className="space-y-1">
          {log.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              previous={previousFor(set.setNumber)}
              onChange={(patch) => onSetChange(set.id, patch)}
              onToggleComplete={() => onToggleSet(set)}
            />
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onAddSet}
          >
            <Plus className="size-4" aria-hidden />
            Set toevoegen
          </Button>
          {log.sets.length > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onRemoveSet(log.sets[log.sets.length - 1].id)}
            >
              <Minus className="size-4" aria-hidden />
              Laatste set
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
