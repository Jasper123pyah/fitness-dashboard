import type { ShoppingCategory, Unit } from "@/db/types";

/**
 * Eenheden worden omgerekend binnen hun eigen familie: massa, volume en stuks.
 * Eetlepels en theelepels zijn volume (15 ml en 5 ml) en kunnen dus met
 * milliliters worden samengevoegd. Stuks blijven stuks: zonder gewicht per stuk
 * is "3 paprika" niet in grammen uit te drukken.
 */
export type UnitFamily = "mass" | "volume" | "count";

const UNIT_FAMILY: Record<Unit, UnitFamily> = {
  GRAM: "mass",
  KILOGRAM: "mass",
  MILLILITER: "volume",
  LITER: "volume",
  TABLESPOON: "volume",
  TEASPOON: "volume",
  PIECE: "count",
};

/** Factor naar de basiseenheid van de familie (g, ml of stuk). */
const TO_BASE: Record<Unit, number> = {
  GRAM: 1,
  KILOGRAM: 1000,
  MILLILITER: 1,
  LITER: 1000,
  TABLESPOON: 15,
  TEASPOON: 5,
  PIECE: 1,
};

const BASE_UNIT: Record<UnitFamily, Unit> = {
  mass: "GRAM",
  volume: "MILLILITER",
  count: "PIECE",
};

export function unitFamily(unit: Unit): UnitFamily {
  return UNIT_FAMILY[unit];
}

export function areUnitsCompatible(a: Unit, b: Unit): boolean {
  return UNIT_FAMILY[a] === UNIT_FAMILY[b];
}

export function toBaseQuantity(quantity: number, unit: Unit): number {
  return quantity * TO_BASE[unit];
}

export function fromBaseQuantity(baseQuantity: number, unit: Unit): number {
  return baseQuantity / TO_BASE[unit];
}

export function convertQuantity(
  quantity: number,
  from: Unit,
  to: Unit,
): number {
  if (from === to) return quantity;
  if (!areUnitsCompatible(from, to)) {
    throw new Error(`Eenheden ${from} en ${to} kunnen niet worden omgerekend`);
  }
  return fromBaseQuantity(toBaseQuantity(quantity, from), to);
}

/**
 * Kiest de eenheid waarin een hoeveelheid het prettigst leest:
 * 1500 g wordt 1,5 kg en 2000 ml wordt 2 l, maar 350 g blijft 350 g.
 */
export function normalizeQuantity(
  quantity: number,
  unit: Unit,
): { quantity: number; unit: Unit } {
  const family = UNIT_FAMILY[unit];
  if (family === "count") {
    return { quantity, unit: "PIECE" };
  }

  const base = toBaseQuantity(quantity, unit);
  if (family === "mass") {
    return base >= 1000
      ? { quantity: base / 1000, unit: "KILOGRAM" }
      : { quantity: base, unit: "GRAM" };
  }
  return base >= 1000
    ? { quantity: base / 1000, unit: "LITER" }
    : { quantity: base, unit: "MILLILITER" };
}

export function baseUnitOf(unit: Unit): Unit {
  return BASE_UNIT[UNIT_FAMILY[unit]];
}

/** Rondt af op maximaal twee decimalen en verwijdert zinloze nullen. */
export function roundQuantity(quantity: number): number {
  return Math.round(quantity * 100) / 100;
}

/** Nederlandse weergave: 1,5 in plaats van 1.5. */
export function formatQuantity(
  quantity: number,
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat("nl-NL", {
    maximumFractionDigits,
  }).format(roundQuantity(quantity));
}

export function formatNumber(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatWeightKg(kg: number): string {
  return `${formatQuantity(kg, 2)} kg`;
}

export function formatSignedNumber(value: number, fractionDigits = 1): string {
  const formatted = new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: "exceptZero",
  }).format(value);
  return formatted;
}

export const DEFAULT_CATEGORY: ShoppingCategory = "OTHER";
