import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ExerciseFormDialog } from "./exercise-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterExercises, listExercises } from "@/db/repo/exercises";
import type { Equipment, ExerciseCategory, MuscleGroup } from "@/db/types";
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_ORDER,
  EXERCISE_CATEGORY_LABELS,
  labelsWithAll,
  EXERCISE_CATEGORY_ORDER,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_ORDER,
} from "@/lib/labels";

export function ExerciseLibraryPage() {
  const exercises = useLiveQuery(() => listExercises(), []);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "ALL">("ALL");
  const [equipment, setEquipment] = useState<Equipment | "ALL">("ALL");
  const [category, setCategory] = useState<ExerciseCategory | "ALL">("ALL");
  const [formOpen, setFormOpen] = useState(false);

  const results = useMemo(
    () =>
      exercises
        ? filterExercises(exercises, { search, muscle, equipment, category })
        : [],
    [exercises, search, muscle, equipment, category],
  );

  if (exercises === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-4">
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

      <PageHeader
        title="Oefeningen"
        description={`${exercises.length} in de bibliotheek`}
        action={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Nieuw
          </Button>
        }
      />

      <div className="space-y-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek op naam"
            aria-label="Zoek op naam"
            className="h-11 pl-9"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Select
            items={labelsWithAll(MUSCLE_GROUP_LABELS, "Spiergroep")}
            value={muscle}
            onValueChange={(value) => setMuscle(value as MuscleGroup | "ALL")}
          >
            <SelectTrigger aria-label="Filter op spiergroep" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Spiergroep</SelectItem>
              {MUSCLE_GROUP_ORDER.map((group) => (
                <SelectItem key={group} value={group}>
                  {MUSCLE_GROUP_LABELS[group]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={labelsWithAll(EQUIPMENT_LABELS, "Materiaal")}
            value={equipment}
            onValueChange={(value) => setEquipment(value as Equipment | "ALL")}
          >
            <SelectTrigger aria-label="Filter op materiaal" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Materiaal</SelectItem>
              {EQUIPMENT_ORDER.map((item) => (
                <SelectItem key={item} value={item}>
                  {EQUIPMENT_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={labelsWithAll(EXERCISE_CATEGORY_LABELS, "Soort")}
            value={category}
            onValueChange={(value) =>
              setCategory(value as ExerciseCategory | "ALL")
            }
          >
            <SelectTrigger aria-label="Filter op soort" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Soort</SelectItem>
              {EXERCISE_CATEGORY_ORDER.map((item) => (
                <SelectItem key={item} value={item}>
                  {EXERCISE_CATEGORY_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="Geen oefening gevonden"
          description="Pas je zoekopdracht aan of maak een eigen oefening."
          action={
            <Button onClick={() => setFormOpen(true)}>Oefening maken</Button>
          }
        />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {results.map((exercise) => (
            <li key={exercise.id}>
              <Link
                to={`/training/oefeningen/${exercise.id}`}
                className="flex items-center gap-3 px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{exercise.name}</span>
                    {exercise.isCustom ? (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        eigen
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {MUSCLE_GROUP_LABELS[exercise.primaryMuscle]} ·{" "}
                    {EQUIPMENT_LABELS[exercise.equipment]} ·{" "}
                    {EXERCISE_CATEGORY_LABELS[exercise.category]}
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
      )}

      <ExerciseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={(name) => toast.success(`${name} toegevoegd`)}
      />
    </div>
  );
}
