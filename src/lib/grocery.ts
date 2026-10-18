import type {
  GroceryItem,
  Ingredient,
  PlannedMeal,
  ShoppingCategory,
  Unit,
} from "@/db/types";
import type { RecipeWithIngredients } from "@/lib/recipes";
import { scaleRecipeIngredients } from "@/lib/recipes";
import {
  areUnitsCompatible,
  baseUnitOf,
  normalizeQuantity,
  roundQuantity,
  toBaseQuantity,
} from "@/lib/units";

export interface AggregatedGroceryLine {
  ingredientId: string;
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: Unit;
  /** De recepten waaruit deze regel is opgebouwd, voor uitleg in de app. */
  sources: { recipeName: string; quantity: number; unit: Unit }[];
}

interface PlannedMealInput {
  meal: Pick<PlannedMeal, "id" | "recipeId" | "servings">;
  recipe: RecipeWithIngredients | undefined;
}

/**
 * Voegt de ingrediënten van alle geplande maaltijden samen tot één lijst.
 *
 * Regels:
 * - hoeveelheden worden eerst geschaald naar het aantal geplande porties;
 * - gelijke ingrediënten met verenigbare eenheden worden opgeteld (g + kg,
 *   ml + l + el + tl);
 * - stuks worden nooit met gewicht of volume vermengd: "3 paprika" en "200 g
 *   paprika" blijven twee aparte regels, want ze zijn niet uitwisselbaar;
 * - de eenheid van het resultaat is de prettigst leesbare eenheid binnen de
 *   familie (1500 g wordt 1,5 kg).
 */
export function aggregateIngredients(
  inputs: PlannedMealInput[],
  ingredientsById: Map<string, Ingredient>,
): AggregatedGroceryLine[] {
  /** Sleutel: ingrediënt + eenheidsfamilie, zodat alleen optelbare dingen samengaan. */
  const buckets = new Map<
    string,
    {
      ingredientId: string;
      name: string;
      category: ShoppingCategory;
      baseQuantity: number;
      referenceUnit: Unit;
      sources: { recipeName: string; quantity: number; unit: Unit }[];
    }
  >();

  for (const { meal, recipe } of inputs) {
    if (!recipe || !meal.recipeId) continue;

    const scaled = scaleRecipeIngredients(recipe, meal.servings);
    for (const line of scaled) {
      if (line.quantity <= 0) continue;

      const ingredient = ingredientsById.get(line.ingredientId);
      const name = ingredient?.name ?? line.name;
      const category: ShoppingCategory = ingredient?.category ?? "OTHER";
      const family = baseUnitOf(line.unit);
      const key = `${line.ingredientId}::${family}`;

      const existing = buckets.get(key);
      if (existing) {
        existing.baseQuantity += toBaseQuantity(line.quantity, line.unit);
        existing.sources.push({
          recipeName: recipe.name,
          quantity: line.quantity,
          unit: line.unit,
        });
        continue;
      }

      buckets.set(key, {
        ingredientId: line.ingredientId,
        name,
        category,
        baseQuantity: toBaseQuantity(line.quantity, line.unit),
        referenceUnit: family,
        sources: [
          { recipeName: recipe.name, quantity: line.quantity, unit: line.unit },
        ],
      });
    }
  }

  return [...buckets.values()]
    .map((bucket) => {
      const normalized = normalizeQuantity(
        bucket.baseQuantity,
        bucket.referenceUnit,
      );
      return {
        ingredientId: bucket.ingredientId,
        name: bucket.name,
        category: bucket.category,
        quantity: roundQuantity(normalized.quantity),
        unit: normalized.unit,
        sources: bucket.sources,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export interface MergeResult {
  /** Regels die bewaard blijven zoals ze waren (zelf toegevoegd of aangepast). */
  keep: GroceryItem[];
  /** Nieuwe of bijgewerkte regels uit het weekmenu. */
  upsert: Omit<GroceryItem, "id" | "groceryListId">[];
  /** Id's van regels die niet langer in het weekmenu voorkomen. */
  removeIds: string[];
}

/**
 * Combineert een nieuw gegenereerde lijst met wat er al stond.
 *
 * - zelf toegevoegde regels blijven altijd staan;
 * - handmatig aangepaste hoeveelheden worden niet overschreven;
 * - afgevinkte regels blijven afgevinkt zolang de hoeveelheid gelijk blijft;
 *   wijzigt de hoeveelheid, dan gaat het vinkje eraf omdat er iets anders
 *   gekocht moet worden.
 */
export function mergeGroceryItems(
  existing: GroceryItem[],
  generated: AggregatedGroceryLine[],
): MergeResult {
  const existingByIngredient = new Map<string, GroceryItem>();
  const keep: GroceryItem[] = [];

  for (const item of existing) {
    if (item.isCustom || !item.ingredientId) {
      keep.push(item);
      continue;
    }
    existingByIngredient.set(`${item.ingredientId}::${item.unit ?? ""}`, item);
  }

  const matchedIds = new Set<string>();
  const upsert: Omit<GroceryItem, "id" | "groceryListId">[] = [];

  generated.forEach((line, index) => {
    const direct = existingByIngredient.get(
      `${line.ingredientId}::${line.unit}`,
    );
    const compatible =
      direct ??
      [...existingByIngredient.values()].find(
        (item) =>
          item.ingredientId === line.ingredientId &&
          item.unit != null &&
          areUnitsCompatible(item.unit, line.unit) &&
          !matchedIds.has(item.id),
      );

    if (compatible) matchedIds.add(compatible.id);

    const quantityUnchanged =
      compatible?.quantity != null &&
      compatible.unit != null &&
      areUnitsCompatible(compatible.unit, line.unit) &&
      Math.abs(
        toBaseQuantity(compatible.quantity, compatible.unit) -
          toBaseQuantity(line.quantity, line.unit),
      ) < 0.01;

    if (compatible?.isEdited) {
      keep.push(compatible);
      return;
    }

    upsert.push({
      ingredientId: line.ingredientId,
      name: line.name,
      quantity: line.quantity,
      unit: line.unit,
      category: line.category,
      checked: quantityUnchanged ? (compatible?.checked ?? false) : false,
      isCustom: false,
      isEdited: false,
      sortOrder: index,
      note: compatible?.note,
    });
  });

  const removeIds = existing
    .filter((item) => !item.isCustom && item.ingredientId != null)
    .filter((item) => !keep.some((kept) => kept.id === item.id))
    .map((item) => item.id);

  return { keep, upsert, removeIds };
}
