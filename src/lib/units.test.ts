import { describe, expect, it } from "vitest";

import {
  areUnitsCompatible,
  convertQuantity,
  formatQuantity,
  normalizeQuantity,
  toBaseQuantity,
  unitFamily,
} from "./units";

describe("eenheden", () => {
  it("kent de familie van elke eenheid", () => {
    expect(unitFamily("GRAM")).toBe("mass");
    expect(unitFamily("KILOGRAM")).toBe("mass");
    expect(unitFamily("MILLILITER")).toBe("volume");
    expect(unitFamily("LITER")).toBe("volume");
    expect(unitFamily("TABLESPOON")).toBe("volume");
    expect(unitFamily("TEASPOON")).toBe("volume");
    expect(unitFamily("PIECE")).toBe("count");
  });

  it("rekent binnen massa en volume om", () => {
    expect(convertQuantity(1.5, "KILOGRAM", "GRAM")).toBe(1500);
    expect(convertQuantity(350, "GRAM", "KILOGRAM")).toBeCloseTo(0.35);
    expect(convertQuantity(2, "LITER", "MILLILITER")).toBe(2000);
    expect(convertQuantity(3, "TABLESPOON", "MILLILITER")).toBe(45);
    expect(convertQuantity(2, "TEASPOON", "MILLILITER")).toBe(10);
    expect(convertQuantity(30, "MILLILITER", "TABLESPOON")).toBe(2);
  });

  it("weigert om stuks met gewicht of volume te mengen", () => {
    expect(areUnitsCompatible("PIECE", "GRAM")).toBe(false);
    expect(areUnitsCompatible("GRAM", "MILLILITER")).toBe(false);
    expect(areUnitsCompatible("TABLESPOON", "LITER")).toBe(true);
    expect(() => convertQuantity(2, "PIECE", "GRAM")).toThrow();
  });

  it("kiest de prettigst leesbare eenheid", () => {
    expect(normalizeQuantity(350, "GRAM")).toEqual({
      quantity: 350,
      unit: "GRAM",
    });
    expect(normalizeQuantity(1500, "GRAM")).toEqual({
      quantity: 1.5,
      unit: "KILOGRAM",
    });
    expect(normalizeQuantity(1, "KILOGRAM")).toEqual({
      quantity: 1,
      unit: "KILOGRAM",
    });
    expect(normalizeQuantity(800, "MILLILITER")).toEqual({
      quantity: 800,
      unit: "MILLILITER",
    });
    expect(normalizeQuantity(2000, "MILLILITER")).toEqual({
      quantity: 2,
      unit: "LITER",
    });
    expect(normalizeQuantity(3, "PIECE")).toEqual({
      quantity: 3,
      unit: "PIECE",
    });
    // Eetlepels tellen als volume en worden dus in milliliters weergegeven.
    expect(normalizeQuantity(4, "TABLESPOON")).toEqual({
      quantity: 60,
      unit: "MILLILITER",
    });
  });

  it("rekent naar de basiseenheid van de familie", () => {
    expect(toBaseQuantity(2, "KILOGRAM")).toBe(2000);
    expect(toBaseQuantity(1, "TABLESPOON")).toBe(15);
    expect(toBaseQuantity(5, "PIECE")).toBe(5);
  });

  it("schrijft hoeveelheden met een Nederlandse komma", () => {
    expect(formatQuantity(1.5)).toBe("1,5");
    expect(formatQuantity(350)).toBe("350");
    expect(formatQuantity(0.333)).toBe("0,33");
  });
});
