import { Check } from "lucide-react";

import { NumberField } from "@/components/shared/number-field";
import { Button } from "@/components/ui/button";
import type { SetLog } from "@/db/types";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

export interface PreviousSetHint {
  weightKg: number | null;
  reps: number | null;
}

/**
 * Eén set in de training: wat je vorige keer deed, wat je nu doet, en het
 * vinkje. Alles wat je invult gaat direct naar de database.
 */
export function SetRow({
  set,
  previous,
  onChange,
  onToggleComplete,
}: {
  set: SetLog;
  previous: PreviousSetHint | null;
  onChange: (patch: Partial<Pick<SetLog, "weightKg" | "reps">>) => void;
  onToggleComplete: () => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1.75rem_4rem_1fr_1fr_2.5rem] items-center gap-2 rounded-lg px-1 py-1 transition-colors",
        set.completed && "bg-success/10",
      )}
    >
      <span className="text-center text-sm font-medium tabular-nums text-muted-foreground">
        {set.setNumber}
      </span>

      <span className="truncate text-xs tabular-nums text-muted-foreground">
        {previous && previous.weightKg != null && previous.reps != null
          ? `${formatQuantity(previous.weightKg)}×${previous.reps}`
          : "—"}
      </span>

      <NumberField
        value={set.weightKg}
        decimal
        ariaLabel={`Gewicht set ${set.setNumber}`}
        placeholder={
          previous?.weightKg != null ? formatQuantity(previous.weightKg) : "kg"
        }
        onChange={(value) => onChange({ weightKg: value })}
      />

      <NumberField
        value={set.reps}
        ariaLabel={`Herhalingen set ${set.setNumber}`}
        placeholder={previous?.reps != null ? String(previous.reps) : "reps"}
        onChange={(value) => onChange({ reps: value })}
      />

      <Button
        variant={set.completed ? "default" : "outline"}
        size="icon-sm"
        aria-label={
          set.completed
            ? `Set ${set.setNumber} ongedaan maken`
            : `Set ${set.setNumber} afronden`
        }
        aria-pressed={set.completed}
        onClick={onToggleComplete}
        className="justify-self-end"
      >
        <Check className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
