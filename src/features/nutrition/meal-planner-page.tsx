import { useLiveQuery } from "dexie-react-hooks";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  MoreVertical,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { MealSlotPicker } from "./meal-slot-picker";
import { ServingsStepper } from "./servings-stepper";
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
  clearDay,
  clearWeek,
  copyDay,
  copyWeek,
  getWeekPlan,
  removePlannedMeal,
  saveWeekAsTemplate,
  updatePlannedMeal,
} from "@/db/repo/mealPlan";
import type { MealCategory } from "@/db/types";
import { useHouseholdMembers } from "@/hooks/use-settings";
import {
  addDaysToKey,
  formatRelativeDay,
  formatWeekRange,
  isoWeekNumber,
  startOfWeekKey,
  todayKey,
  WEEKDAY_NAMES,
  type DateKey,
} from "@/lib/dates";
import { MEAL_CATEGORY_LABELS, MEAL_CATEGORY_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function MealPlannerPage() {
  const [weekStart, setWeekStart] = useState<DateKey>(() =>
    startOfWeekKey(todayKey()),
  );
  const [openDay, setOpenDay] = useState<DateKey>(() => todayKey());
  const [picker, setPicker] = useState<{
    date: DateKey;
    slot: MealCategory;
  } | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("Standaard trainingsweek");

  const week = useLiveQuery(() => getWeekPlan(weekStart), [weekStart]);
  const members = useHouseholdMembers();

  if (week === undefined) return <PageSkeleton />;

  const today = todayKey();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Weekmenu"
        description={`Week ${isoWeekNumber(weekStart)} · ${formatWeekRange(weekStart)}`}
        action={
          <Button
            nativeButton={false}
            render={<Link to="/voeding" />}
            variant="outline"
            size="sm"
          >
            Recepten
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Vorige week"
          onClick={() => setWeekStart(addDaysToKey(weekStart, -7))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => setWeekStart(startOfWeekKey(today))}
        >
          <CalendarRange className="size-4" aria-hidden />
          Deze week
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Opties voor deze week"
              >
                <MoreVertical className="size-4" aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={async () => {
                await copyWeek(weekStart, addDaysToKey(weekStart, 7));
                toast.success("Weekmenu gekopieerd naar volgende week");
              }}
            >
              <Copy className="size-4" aria-hidden />
              Kopieer naar volgende week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTemplateOpen(true)}>
              <Save className="size-4" aria-hidden />
              Opslaan als sjabloon
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link to="/voeding/sjablonen" />}
            >
              <Layers className="size-4" aria-hidden />
              Sjablonen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                await clearWeek(weekStart);
                toast.success("Weekmenu leeggemaakt");
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Week leegmaken
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          aria-label="Volgende week"
          onClick={() => setWeekStart(addDaysToKey(weekStart, 7))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {/* Per dag een uitklapbare kaart: geen brede tabel die je opzij moet schuiven. */}
      <div className="space-y-2">
        {week.days.map((day, index) => {
          const planned = MEAL_CATEGORY_ORDER.filter(
            (slot) => day.meals[slot] != null,
          ).length;
          const isOpen = openDay === day.date;

          return (
            <section
              key={day.date}
              className={cn(
                "overflow-hidden rounded-xl border bg-card",
                day.date === today && "border-primary/40",
              )}
            >
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? "" : day.date)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3 py-3 text-left"
              >
                <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-[11px] font-semibold uppercase">
                  {WEEKDAY_NAMES[index].slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {day.date === today ? "Vandaag" : WEEKDAY_NAMES[index]}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {planned === 0
                      ? "Nog niets gepland"
                      : (day.meals.DINNER?.recipe?.name ??
                        day.meals.DINNER?.customTitle ??
                        `${planned} maaltijden gepland`)}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-90",
                  )}
                  aria-hidden
                />
              </button>

              {isOpen ? (
                <div className="space-y-2 border-t px-3 py-3">
                  {MEAL_CATEGORY_ORDER.map((slot) => {
                    const meal = day.meals[slot];
                    return (
                      <div key={slot} className="rounded-lg border p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {MEAL_CATEGORY_LABELS[slot]}
                          </p>
                          {meal ? (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`${MEAL_CATEGORY_LABELS[slot]} verwijderen`}
                              className="text-muted-foreground"
                              onClick={() => void removePlannedMeal(meal.id)}
                            >
                              <X className="size-3.5" aria-hidden />
                            </Button>
                          ) : null}
                        </div>

                        {meal ? (
                          <div className="mt-1.5">
                            {meal.recipe ? (
                              <Link
                                to={`/voeding/recept/${meal.recipe.id}`}
                                className="font-medium"
                              >
                                {meal.recipe.name}
                              </Link>
                            ) : (
                              <p className="font-medium">
                                {meal.customTitle ?? "Eigen maaltijd"}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <ServingsStepper
                                value={meal.servings}
                                onChange={(value) =>
                                  void updatePlannedMeal(meal.id, {
                                    servings: value,
                                  })
                                }
                              />
                              {members && members.length > 0 ? (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="size-3.5" aria-hidden />
                                  {meal.memberIds.length === 0
                                    ? "niemand gekozen"
                                    : members
                                        .filter((member) =>
                                          meal.memberIds.includes(member.id),
                                        )
                                        .map((member) => member.name)
                                        .join(", ")}
                                </span>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto"
                                onClick={() =>
                                  setPicker({ date: day.date, slot })
                                }
                              >
                                Vervangen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 w-full justify-start text-muted-foreground"
                            onClick={() => setPicker({ date: day.date, slot })}
                          >
                            <Plus className="size-4" aria-hidden />
                            Kies een recept
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        await copyDay(day.date, addDaysToKey(day.date, 1));
                        toast.success(
                          `Gekopieerd naar ${formatRelativeDay(addDaysToKey(day.date, 1)).toLowerCase()}`,
                        );
                      }}
                    >
                      <Copy className="size-4" aria-hidden />
                      Naar morgen
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={async () => {
                        await clearDay(day.date);
                        toast.success("Dag leeggemaakt");
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Leegmaken
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <Button
        nativeButton={false}
        render={<Link to="/boodschappen" />}
        size="lg"
        className="w-full"
      >
        Boodschappenlijst maken
      </Button>

      <MealSlotPicker target={picker} onClose={() => setPicker(null)} />

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Weekmenu opslaan als sjabloon</DialogTitle>
            <DialogDescription>
              Je kunt dit weekmenu later met één tik op een andere week zetten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Naam</Label>
            <Input
              id="template-name"
              className="h-11"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              disabled={templateName.trim().length === 0}
              onClick={async () => {
                await saveWeekAsTemplate(weekStart, templateName.trim());
                setTemplateOpen(false);
                toast.success("Sjabloon opgeslagen");
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
