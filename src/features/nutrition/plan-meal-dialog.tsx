import { useState } from "react";
import { toast } from "sonner";

import { ServingsStepper } from "./servings-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setPlannedMeal } from "@/db/repo/mealPlan";
import type { MealCategory, Recipe } from "@/db/types";
import { useHouseholdMembers } from "@/hooks/use-settings";
import { addDaysToKey, formatShortDate, todayKey } from "@/lib/dates";
import { MEAL_CATEGORY_LABELS, MEAL_CATEGORY_ORDER } from "@/lib/labels";

/** Snel een recept op een dag en in een slot zetten, met porties en wie meeëet. */
export function PlanMealDialog({
  open,
  onOpenChange,
  recipe,
  defaultServings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe;
  defaultServings?: number;
}) {
  const members = useHouseholdMembers();
  const [date, setDate] = useState(() => todayKey());
  const [slot, setSlot] = useState<MealCategory>(recipe.category);
  const [servings, setServings] = useState(defaultServings ?? recipe.servings);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const dayOptions = Array.from({ length: 14 }, (_, index) =>
    addDaysToKey(todayKey(), index),
  );
  const dayLabels = Object.fromEntries(
    dayOptions.map((option) => [
      option,
      option === todayKey() ? "Vandaag" : formatShortDate(option),
    ]),
  );
  const selectedMembers =
    memberIds.length > 0 ? memberIds : (members ?? []).map((m) => m.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{recipe.name} inplannen</DialogTitle>
          <DialogDescription>
            Kies de dag, het moment en het aantal porties.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Dag</Label>
            <Select
              items={dayLabels}
              value={date}
              onValueChange={(value) => setDate(value ?? todayKey())}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === todayKey()
                      ? "Vandaag"
                      : formatShortDate(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Moment</Label>
            <Select
              items={MEAL_CATEGORY_LABELS}
              value={slot}
              onValueChange={(value) =>
                setSlot((value as MealCategory) ?? recipe.category)
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_CATEGORY_ORDER.map((option) => (
                  <SelectItem key={option} value={option}>
                    {MEAL_CATEGORY_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Porties</Label>
            <ServingsStepper value={servings} onChange={setServings} />
          </div>

          {members && members.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Wie eet mee</legend>
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border p-2.5"
                >
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={(checked) =>
                      setMemberIds((current) => {
                        const base =
                          current.length > 0
                            ? current
                            : members.map((m) => m.id);
                        return checked === true
                          ? [...new Set([...base, member.id])]
                          : base.filter((id) => id !== member.id);
                      })
                    }
                  />
                  <span className="text-sm">
                    {member.name}
                    {member.isVegetarian ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        vegetarisch
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
          <Button
            onClick={async () => {
              await setPlannedMeal({
                date,
                slot,
                recipeId: recipe.id,
                servings,
                memberIds: selectedMembers,
              });
              onOpenChange(false);
              toast.success(`${recipe.name} ingepland`, {
                description: `${formatShortDate(date)} · ${MEAL_CATEGORY_LABELS[slot]}`,
              });
            }}
          >
            Inplannen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
