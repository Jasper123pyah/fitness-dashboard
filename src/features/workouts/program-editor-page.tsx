import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarPlus,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ExercisePicker } from "./exercise-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { NumberField } from "@/components/shared/number-field";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addExerciseToDay,
  createProgram,
  createWorkoutDay,
  deleteWorkoutDay,
  getActiveProgramWithDays,
  moveDayExercise,
  removeDayExercise,
  updateDayExercise,
  updateProgram,
  updateWorkoutDay,
} from "@/db/repo/programs";
import { WEEKDAY_NAMES } from "@/lib/dates";

/** Weekdagen als keuzelijst; "none" voor een dag zonder vaste plek in de week. */
const WEEKDAY_SELECT_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    WEEKDAY_NAMES.map((name, index) => [String(index + 1), name]),
  ),
  none: "Geen vaste dag",
};

export function ProgramEditorPage() {
  const program = useLiveQuery(() => getActiveProgramWithDays(), []);
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [dayDialog, setDayDialog] = useState<
    | { mode: "new" }
    | {
        mode: "edit";
        id: string;
        name: string;
        weekday: number | null;
        notes: string;
      }
    | null
  >(null);
  const [programDialog, setProgramDialog] = useState(false);
  const [draft, setDraft] = useState({ name: "", weekday: "1", notes: "" });
  const [programDraft, setProgramDraft] = useState({
    name: "",
    description: "",
  });

  if (program === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-5">
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
        title="Schema"
        description={program?.name ?? "Nog geen schema"}
        action={
          program ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setProgramDraft({
                  name: program.name,
                  description: program.description ?? "",
                });
                setProgramDialog(true);
              }}
            >
              <Pencil className="size-4" aria-hidden />
              Naam
            </Button>
          ) : null
        }
      />

      {!program ? (
        <EmptyState
          title="Nog geen schema"
          description="Maak een schema aan en voeg daarna trainingsdagen toe."
          action={
            <Button
              onClick={async () => {
                await createProgram({ name: "Mijn schema", makeActive: true });
                toast.success("Schema aangemaakt");
              }}
            >
              Schema maken
            </Button>
          }
        />
      ) : (
        <>
          {program.description ? (
            <p className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              {program.description}
            </p>
          ) : null}

          <div className="space-y-4">
            {program.days.map((day) => (
              <section key={day.id} className="rounded-xl border bg-card">
                <header className="flex items-center justify-between gap-2 border-b px-3 py-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{day.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {day.weekday
                        ? WEEKDAY_NAMES[day.weekday - 1]
                        : "Geen vaste dag"}{" "}
                      · {day.exercises.length} oefeningen
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Opties voor ${day.name}`}
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setDayDialog({
                            mode: "edit",
                            id: day.id,
                            name: day.name,
                            weekday: day.weekday,
                            notes: day.notes ?? "",
                          });
                          setDraft({
                            name: day.name,
                            weekday: day.weekday ? String(day.weekday) : "none",
                            notes: day.notes ?? "",
                          });
                        }}
                      >
                        <Pencil className="size-4" aria-hidden />
                        Dag aanpassen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={async () => {
                          await deleteWorkoutDay(day.id);
                          toast.success(`${day.name} verwijderd`);
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        Dag verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>

                <ul className="divide-y">
                  {day.exercises.map((item, index) => (
                    <li key={item.id} className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/training/oefeningen/${item.exerciseId}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium"
                        >
                          {item.exercise.name}
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Eerder in de training"
                          disabled={index === 0}
                          onClick={() => void moveDayExercise(item.id, -1)}
                        >
                          <ArrowUp className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Later in de training"
                          disabled={index === day.exercises.length - 1}
                          onClick={() => void moveDayExercise(item.id, 1)}
                        >
                          <ArrowDown className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${item.exercise.name} verwijderen`}
                          className="text-muted-foreground"
                          onClick={() => void removeDayExercise(item.id)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>

                      <div className="mt-2 grid grid-cols-[1fr_1fr_1fr_1.3fr] items-end gap-2">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Sets
                          <NumberField
                            value={item.sets}
                            ariaLabel={`Aantal sets voor ${item.exercise.name}`}
                            onChange={(value) =>
                              void updateDayExercise(item.id, {
                                sets: value ?? 1,
                              })
                            }
                            className="mt-1 h-10"
                          />
                        </label>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Min reps
                          <NumberField
                            value={item.repMin}
                            ariaLabel={`Minimum herhalingen voor ${item.exercise.name}`}
                            onChange={(value) =>
                              void updateDayExercise(item.id, {
                                repMin: value ?? 1,
                              })
                            }
                            className="mt-1 h-10"
                          />
                        </label>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Max reps
                          <NumberField
                            value={item.repMax}
                            ariaLabel={`Maximum herhalingen voor ${item.exercise.name}`}
                            onChange={(value) =>
                              void updateDayExercise(item.id, {
                                repMax: value ?? 1,
                              })
                            }
                            className="mt-1 h-10"
                          />
                        </label>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Rust (sec)
                          <NumberField
                            value={item.restSeconds ?? null}
                            ariaLabel={`Rusttijd voor ${item.exercise.name}`}
                            placeholder="standaard"
                            onChange={(value) =>
                              void updateDayExercise(item.id, {
                                restSeconds: value ?? undefined,
                              })
                            }
                            className="mt-1 h-10"
                          />
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="px-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setPickerDayId(day.id)}
                  >
                    <Plus className="size-4" aria-hidden />
                    Oefening toevoegen
                  </Button>
                </div>
              </section>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setDayDialog({ mode: "new" });
              setDraft({ name: "", weekday: "1", notes: "" });
            }}
          >
            <CalendarPlus className="size-4" aria-hidden />
            Trainingsdag toevoegen
          </Button>
        </>
      )}

      <ExercisePicker
        open={pickerDayId != null}
        onOpenChange={(open) => {
          if (!open) setPickerDayId(null);
        }}
        title="Oefening toevoegen"
        excludeIds={
          program?.days
            .find((day) => day.id === pickerDayId)
            ?.exercises.map((item) => item.exerciseId) ?? []
        }
        onSelect={async (exerciseId) => {
          if (!pickerDayId) return;
          await addExerciseToDay({ workoutDayId: pickerDayId, exerciseId });
          setPickerDayId(null);
        }}
      />

      <Dialog
        open={dayDialog != null}
        onOpenChange={(open) => {
          if (!open) setDayDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dayDialog?.mode === "edit"
                ? "Trainingsdag aanpassen"
                : "Nieuwe trainingsdag"}
            </DialogTitle>
            <DialogDescription>
              Geef de dag een naam en kies op welke dag van de week hij staat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="day-name">Naam</Label>
              <Input
                id="day-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="Push"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Dag van de week</Label>
              <Select
                items={WEEKDAY_SELECT_LABELS}
                value={draft.weekday}
                onValueChange={(value) =>
                  setDraft({ ...draft, weekday: value ?? "1" })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                  <SelectItem value="none">Geen vaste dag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="day-notes">Notitie (optioneel)</Label>
              <Textarea
                id="day-notes"
                rows={2}
                value={draft.notes}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
                placeholder="Rustig opbouwen, tussen de sets goed ademen."
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              disabled={draft.name.trim().length === 0}
              onClick={async () => {
                const weekday =
                  draft.weekday === "none" ? null : Number(draft.weekday);
                const notes =
                  draft.notes.trim() === "" ? undefined : draft.notes.trim();

                if (dayDialog?.mode === "edit") {
                  await updateWorkoutDay(dayDialog.id, {
                    name: draft.name.trim(),
                    weekday,
                    notes,
                  });
                } else if (program) {
                  await createWorkoutDay({
                    programId: program.id,
                    name: draft.name.trim(),
                    weekday,
                    notes,
                  });
                }
                setDayDialog(null);
                toast.success("Opgeslagen");
              }}
            >
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={programDialog} onOpenChange={setProgramDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schema aanpassen</DialogTitle>
            <DialogDescription>
              De naam en beschrijving van je schema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="program-name">Naam</Label>
              <Input
                id="program-name"
                value={programDraft.name}
                onChange={(event) =>
                  setProgramDraft({ ...programDraft, name: event.target.value })
                }
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="program-description">Beschrijving</Label>
              <Textarea
                id="program-description"
                rows={3}
                value={programDraft.description}
                onChange={(event) =>
                  setProgramDraft({
                    ...programDraft,
                    description: event.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              onClick={async () => {
                if (!program) return;
                await updateProgram(program.id, {
                  name: programDraft.name.trim() || program.name,
                  description:
                    programDraft.description.trim() === ""
                      ? undefined
                      : programDraft.description.trim(),
                });
                setProgramDialog(false);
                toast.success("Schema bijgewerkt");
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
