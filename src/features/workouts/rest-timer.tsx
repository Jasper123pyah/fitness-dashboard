import { Pause, Play, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatSeconds } from "@/lib/dates";

export interface RestTimerState {
  totalSeconds: number;
  startedAt: number;
}

/**
 * Rusttimer tussen de sets. Loopt op de wandklok, niet op een teller: als het
 * scherm van de telefoon uit gaat, klopt de tijd bij terugkomen nog steeds.
 */
export function RestTimer({
  state,
  onClose,
  onExtend,
}: {
  state: RestTimerState;
  onClose: () => void;
  onExtend: (seconds: number) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  /** Tijdstip waarop is gepauzeerd; null als de timer loopt. */
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const paused = pausedAt != null;

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [paused]);

  const reference = pausedAt ?? now;
  const elapsed = Math.floor((reference - state.startedAt) / 1000);
  const remaining = state.totalSeconds - elapsed;
  const done = remaining <= 0;
  const progress = Math.min(
    100,
    Math.max(0, (elapsed / state.totalSeconds) * 100),
  );

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-16 z-40 px-4 md:bottom-6">
      <div className="mx-auto max-w-xl overflow-hidden rounded-xl border bg-card shadow-lg">
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              {done ? "Rust voorbij" : "Rust"}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {done ? "Klaar" : formatSeconds(remaining)}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => onExtend(30)}>
            <Plus className="size-4" aria-hidden />
            30s
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={paused ? "Doorgaan" : "Pauzeren"}
            onClick={() => setPausedAt(paused ? null : Date.now())}
          >
            {paused ? (
              <Play className="size-4" aria-hidden />
            ) : (
              <Pause className="size-4" aria-hidden />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Timer sluiten"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
