import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { listRecipesWithIngredients } from "@/db/repo/recipes";
import type { MealCategory } from "@/db/types";
import { useSettings } from "@/hooks/use-settings";
import {
  findExcludedIngredients,
  type RecipeWithIngredients,
} from "@/lib/recipes";

export interface RecipeListItem {
  recipe: RecipeWithIngredients;
  /** Ingrediënten die op de uitsluitlijst staan; leeg als het recept past. */
  excluded: string[];
}

export function useRecipeList(filter: {
  search?: string;
  category?: MealCategory | "ALL";
  onlyFavorites?: boolean;
  hideExcluded?: boolean;
}): RecipeListItem[] | undefined {
  const recipes = useLiveQuery(() => listRecipesWithIngredients(), []);
  const settings = useSettings();

  return useMemo(() => {
    if (!recipes || !settings) return undefined;
    const search = filter.search?.trim().toLowerCase() ?? "";

    return recipes
      .map((recipe) => ({
        recipe,
        excluded: findExcludedIngredients(recipe, settings.excludedIngredients),
      }))
      .filter(({ recipe, excluded }) => {
        if (
          filter.category &&
          filter.category !== "ALL" &&
          recipe.category !== filter.category
        ) {
          return false;
        }
        if (filter.onlyFavorites && !recipe.isFavorite) return false;
        if (filter.hideExcluded && excluded.length > 0) return false;
        if (search.length > 0) {
          const haystack =
            `${recipe.name} ${recipe.description ?? ""} ${recipe.ingredients
              .map((item) => item.ingredient.name)
              .join(" ")}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      });
  }, [
    recipes,
    settings,
    filter.search,
    filter.category,
    filter.onlyFavorites,
    filter.hideExcluded,
  ]);
}
