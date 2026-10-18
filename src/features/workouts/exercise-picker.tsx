import { useLiveQuery } from "dexie-react-hooks";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { filterExercises, listExercises } from "@/db/repo/exercises";
import type { MuscleGroup } from "@/db/types";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Zoekvenster om een oefening te kiezen, bijvoorbeeld om er een te vervangen. */
export function ExercisePicker({
  open,
  onOpenChange,
  onSelect,
  title = "Oefening kiezen",
  description,
  excludeIds = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exerciseId: string) => void;
  title?: string;
  description?: string;
  excludeIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "ALL">("ALL");
  const exercises = useLiveQuery(() => listExercises(), []);

  const results = useMemo(() => {
    if (!exercises) return [];
    return filterExercises(
      exercises.filter((exercise) => !excludeIds.includes(exercise.id)),
      { search, muscle },
    );
  }, [exercises, excludeIds, search, muscle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek een oefening"
            aria-label="Zoek een oefening"
            className="h-11 pl-9"
          />
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(["ALL", ...MUSCLE_GROUP_ORDER] as const).map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setMuscle(group)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                muscle === group
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {group === "ALL" ? "Alles" : MUSCLE_GROUP_LABELS[group]}
            </button>
          ))}
        </div>

        <ScrollArea className="-mx-2 h-72 px-2">
          <ul className="space-y-1">
            {results.map((exercise) => (
              <li key={exercise.id}>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start px-3 py-2.5 text-left"
                  onClick={() => {
                    onSelect(exercise.id);
                    onOpenChange(false);
                    setSearch("");
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {exercise.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {MUSCLE_GROUP_LABELS[exercise.primaryMuscle]}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Geen oefening gevonden.
              </li>
            ) : null}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
