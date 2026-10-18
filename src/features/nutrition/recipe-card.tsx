import { AlertTriangle, Clock, Heart, Users } from "lucide-react";
import { Link } from "react-router-dom";

import type { Recipe } from "@/db/types";
import { MEAL_CATEGORY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function RecipeCard({
  recipe,
  excluded,
  onToggleFavorite,
}: {
  recipe: Recipe;
  excluded?: string[];
  onToggleFavorite?: () => void;
}) {
  return (
    <article className="relative flex gap-3 rounded-xl border bg-card p-3">
      <Link to={`/voeding/recept/${recipe.id}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          <span className="truncate">{recipe.name}</span>
        </p>
        {recipe.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {recipe.description}
          </p>
        ) : null}

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
            {MEAL_CATEGORY_LABELS[recipe.category]}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {recipe.prepMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {recipe.servings}
          </span>
          {recipe.isVegetarian ? (
            <span className="text-success">vegetarisch</span>
          ) : (
            <span>met vlees</span>
          )}
        </p>

        {excluded && excluded.length > 0 ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Bevat {excluded.join(", ").toLowerCase()} — staat op je
            uitsluitlijst
          </p>
        ) : null}
      </Link>

      {onToggleFavorite ? (
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={
            recipe.isFavorite
              ? `${recipe.name} uit favorieten halen`
              : `${recipe.name} als favoriet markeren`
          }
          aria-pressed={recipe.isFavorite}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <Heart
            className={cn(
              "size-4",
              recipe.isFavorite && "fill-primary text-primary",
            )}
            aria-hidden
          />
        </button>
      ) : null}
    </article>
  );
}
