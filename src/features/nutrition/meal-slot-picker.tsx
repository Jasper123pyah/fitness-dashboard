import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useRecipeList } from "./use-recipes";
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
import { setPlannedMeal } from "@/db/repo/mealPlan";
import type { MealCategory } from "@/db/types";
import { useHouseholdMembers } from "@/hooks/use-settings";
import { formatShortDate, type DateKey } from "@/lib/dates";
import { MEAL_CATEGORY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Recept kiezen voor één slot. Recepten van het juiste moment staan bovenaan,
 * zodat vervangen meestal één tik is.
 */
export function MealSlotPicker({
  target,
  onClose,
}: {
  target: { date: DateKey; slot: MealCategory } | null;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const items = useRecipeList({ search });
  const members = useHouseholdMembers();

  const sorted = useMemo(() => {
    if (!items || !target) return [];
    const matching = items.filter(
      (item) => item.recipe.category === target.slot,
    );
    const rest = items.filter((item) => item.recipe.category !== target.slot);
    const list = showAll ? [...matching, ...rest] : matching;
    return list.sort((a, b) => {
      if (a.recipe.isFavorite !== b.recipe.isFavorite)
        return a.recipe.isFavorite ? -1 : 1;
      if (a.excluded.length > 0 !== b.excluded.length > 0)
        return a.excluded.length > 0 ? 1 : -1;
      return 0;
    });
  }, [items, target, showAll]);

  return (
    <Dialog
      open={target != null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setSearch("");
          setShowAll(false);
        }
      }}
    >
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {target ? MEAL_CATEGORY_LABELS[target.slot] : "Maaltijd"} kiezen
          </DialogTitle>
          <DialogDescription>
            {target ? formatShortDate(target.date) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek een recept"
            aria-label="Zoek een recept"
            className="h-11 pl-9"
          />
        </div>

        <ScrollArea className="-mx-2 h-80 px-2">
          <ul className="space-y-1">
            {sorted.map(({ recipe, excluded }) => (
              <li key={recipe.id}>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start px-3 py-2.5 text-left"
                  onClick={async () => {
                    if (!target) return;
                    await setPlannedMeal({
                      date: target.date,
                      slot: target.slot,
                      recipeId: recipe.id,
                      servings: target.slot === "DINNER" ? recipe.servings : 1,
                      memberIds:
                        target.slot === "DINNER"
                          ? (members ?? []).map((member) => member.id)
                          : (members ?? [])
                              .filter((member) => member.isSelf)
                              .map((m) => m.id),
                    });
                    onClose();
                    toast.success(`${recipe.name} ingepland`);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {recipe.name}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-xs",
                        excluded.length > 0
                          ? "text-warning"
                          : "text-muted-foreground",
                      )}
                    >
                      {excluded.length > 0
                        ? `bevat ${excluded.join(", ").toLowerCase()}`
                        : `${recipe.prepMinutes} min · ${recipe.servings} porties`}
                    </span>
                  </span>
                </Button>
              </li>
            ))}

            {sorted.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Geen recept gevonden.
              </li>
            ) : null}
          </ul>
        </ScrollArea>

        {!showAll ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            Ook recepten van andere momenten tonen
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
