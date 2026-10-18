import { useLiveQuery } from "dexie-react-hooks";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  Clock,
  Heart,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { PlanMealDialog } from "./plan-meal-dialog";
import { PageSkeleton } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import {
  deleteRecipe,
  getRecipeWithIngredients,
  toggleRecipeFavorite,
} from "@/db/repo/recipes";
import { useSettings } from "@/hooks/use-settings";
import { MEAL_CATEGORY_LABELS, UNIT_LABELS } from "@/lib/labels";
import {
  findExcludedIngredients,
  scaleNutrition,
  scaleRecipeIngredients,
} from "@/lib/recipes";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

export function RecipeDetailPage() {
  const { recipeId = "" } = useParams();
  const navigate = useNavigate();
  const settings = useSettings();
  const recipe = useLiveQuery(
    () => getRecipeWithIngredients(recipeId),
    [recipeId],
  );
  const [servings, setServings] = useState<number | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  if (recipe === undefined || settings === undefined) return <PageSkeleton />;

  if (recipe === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Dit recept bestaat niet meer.
        </p>
        <Button nativeButton={false} render={<Link to="/voeding" />}>
          Naar recepten
        </Button>
      </div>
    );
  }

  const currentServings = servings ?? recipe.servings;
  const scaled = scaleRecipeIngredients(recipe, currentServings);
  const nutrition = scaleNutrition(recipe, currentServings);
  const excluded = findExcludedIngredients(
    recipe,
    settings.excludedIngredients,
  );

  return (
    <div className="space-y-5">
      <Button
        nativeButton={false}
        render={<Link to="/voeding" />}
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Recepten
      </Button>

      <header>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl/tight font-semibold tracking-tight">
              {recipe.name}
            </h1>
            {recipe.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {recipe.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={
                recipe.isFavorite
                  ? "Uit favorieten halen"
                  : "Als favoriet markeren"
              }
              aria-pressed={recipe.isFavorite}
              onClick={() => void toggleRecipeFavorite(recipe.id)}
            >
              <Heart
                className={cn(
                  "size-4",
                  recipe.isFavorite && "fill-primary text-primary",
                )}
                aria-hidden
              />
            </Button>
            <Button
              nativeButton={false}
              render={<Link to={`/voeding/recept/${recipe.id}/bewerken`} />}
              variant="outline"
              size="icon-sm"
              aria-label="Recept aanpassen"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
            {MEAL_CATEGORY_LABELS[recipe.category]}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {recipe.prepMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            recept voor {recipe.servings}
          </span>
          {recipe.isVegetarian ? (
            <span className="text-success">vegetarisch</span>
          ) : null}
        </p>

        {excluded.length > 0 ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden
            />
            <span>
              Bevat {excluded.join(", ").toLowerCase()}. Dat staat op je
              uitsluitlijst, dus dit recept wordt niet aangeraden.
            </span>
          </p>
        ) : null}
      </header>

      <section className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Ingrediënten</h2>
            <p className="text-xs text-muted-foreground">
              Voor {formatQuantity(currentServings)}{" "}
              {currentServings === 1 ? "portie" : "porties"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Minder porties"
              disabled={currentServings <= 0.5}
              onClick={() => setServings(Math.max(0.5, currentServings - 0.5))}
            >
              <Minus className="size-4" aria-hidden />
            </Button>
            <span className="w-10 text-center font-semibold tabular-nums">
              {formatQuantity(currentServings)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Meer porties"
              onClick={() => setServings(currentServings + 0.5)}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <ul className="mt-3 divide-y">
          {scaled.map((item) => (
            <li
              key={item.recipeIngredientId}
              className="flex items-baseline justify-between gap-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="truncate">{item.name}</span>
                {item.note ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({item.note})
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatQuantity(item.quantity)} {UNIT_LABELS[item.unit]}
              </span>
            </li>
          ))}
        </ul>

        {nutrition && settings.showNutritionInfo ? (
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground tabular-nums">
            Geschat totaal: {nutrition.kcal ?? "?"} kcal ·{" "}
            {nutrition.protein ?? "?"} g eiwit · {nutrition.carbs ?? "?"} g
            koolhydraten · {nutrition.fat ?? "?"} g vet
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-2 font-semibold">Bereiding</h2>
        <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {recipe.instructions}
        </p>
      </section>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={() => setPlanOpen(true)}>
          <CalendarPlus className="size-4" aria-hidden />
          Inplannen
        </Button>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={async () => {
            const result = await deleteRecipe(recipe.id);
            if (result.deleted) {
              toast.success("Recept verwijderd");
              navigate("/voeding");
              return;
            }
            toast("Dit recept staat nog in je planning", {
              description: `${result.plannedCount} keer in een weekmenu en ${result.templateCount} keer in een sjabloon.`,
              action: {
                label: "Toch verwijderen",
                onClick: async () => {
                  await deleteRecipe(recipe.id, true);
                  toast.success("Recept verwijderd");
                  navigate("/voeding");
                },
              },
            });
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          Verwijderen
        </Button>
      </div>

      <PlanMealDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        recipe={recipe}
        defaultServings={currentServings}
      />
    </div>
  );
}
