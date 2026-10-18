import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatQuantity } from "@/lib/units";

/** Porties in stappen van een halve portie; genoeg voor één persoon of samen eten. */
export function ServingsStepper({
  value,
  onChange,
  min = 0.5,
  step = 0.5,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Minder porties"
        disabled={value <= min}
        onClick={() =>
          onChange(Math.max(min, Math.round((value - step) * 100) / 100))
        }
      >
        <Minus className="size-4" aria-hidden />
      </Button>
      <span className="w-12 text-center text-lg font-semibold tabular-nums">
        {formatQuantity(value)}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Meer porties"
        onClick={() => onChange(Math.round((value + step) * 100) / 100)}
      >
        <Plus className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
