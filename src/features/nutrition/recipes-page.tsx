import {
  CalendarRange,
  Layers,
  Plus,
  Search,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { RecipeCard } from "./recipe-card";
import { useRecipeList } from "./use-recipes";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleRecipeFavorite } from "@/db/repo/recipes";
import type { MealCategory } from "@/db/types";
import { MEAL_CATEGORY_LABELS, MEAL_CATEGORY_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function RecipesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MealCategory | "ALL">("ALL");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const items = useRecipeList({ search, category, onlyFavorites });

  if (items === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Voeding"
        description={`${items.length} recepten`}
        action={
          <Button
            nativeButton={false}
            render={<Link to="/voeding/recept/nieuw" />}
            size="sm"
          >
            <Plus className="size-4" aria-hidden />
            Recept
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          nativeButton={false}
          render={<Link to="/voeding/planner" />}
          variant="outline"
          className="justify-start"
        >
          <CalendarRange className="size-4" aria-hidden />
          Weekmenu
        </Button>
        <Button
          nativeButton={false}
          render={<Link to="/voeding/sjablonen" />}
          variant="outline"
          className="justify-start"
        >
          <Layers className="size-4" aria-hidden />
          Sjablonen
        </Button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Zoek op naam of ingrediënt"
          aria-label="Zoek recepten"
          className="h-11 pl-9"
        />
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["ALL", ...MEAL_CATEGORY_ORDER] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === item
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {item === "ALL" ? "Alles" : MEAL_CATEGORY_LABELS[item]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOnlyFavorites((value) => !value)}
          aria-pressed={onlyFavorites}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            onlyFavorites
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground",
          )}
        >
          Favorieten
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Geen recepten gevonden"
          description="Pas je zoekopdracht aan of voeg een eigen recept toe."
          action={
            <Button
              nativeButton={false}
              render={<Link to="/voeding/recept/nieuw" />}
            >
              Recept toevoegen
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map(({ recipe, excluded }) => (
            <li key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                excluded={excluded}
                onToggleFavorite={() => void toggleRecipeFavorite(recipe.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
