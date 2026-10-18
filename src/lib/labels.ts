import type {
  DietaryPreference,
  Equipment,
  ExerciseCategory,
  Goal,
  MealCategory,
  MeasurementType,
  MuscleGroup,
  PhotoCategory,
  ShoppingCategory,
  Unit,
} from "@/db/types";

export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  PRE_WORKOUT: "Pre-workout",
  LUNCH: "Lunch",
  DINNER: "Avondeten",
  EVENING_SNACK: "Avondsnack",
};

export const MEAL_CATEGORY_ORDER: MealCategory[] = [
  "PRE_WORKOUT",
  "LUNCH",
  "DINNER",
  "EVENING_SNACK",
];

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  VEGETABLES: "Groente",
  FRUIT: "Fruit",
  DAIRY_EGGS: "Zuivel en eieren",
  PROTEIN: "Vleesvervangers en proteïne",
  GRAINS: "Granen, pasta en rijst",
  LEGUMES_CANNED: "Peulvruchten en conserven",
  HERBS_SPICES: "Kruiden en specerijen",
  OTHER: "Overig",
};

export const SHOPPING_CATEGORY_ORDER: ShoppingCategory[] = [
  "VEGETABLES",
  "FRUIT",
  "DAIRY_EGGS",
  "PROTEIN",
  "GRAINS",
  "LEGUMES_CANNED",
  "HERBS_SPICES",
  "OTHER",
];

export const UNIT_LABELS: Record<Unit, string> = {
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "l",
  PIECE: "st",
  TABLESPOON: "el",
  TEASPOON: "tl",
};

export const UNIT_LABELS_LONG: Record<Unit, string> = {
  GRAM: "gram",
  KILOGRAM: "kilogram",
  MILLILITER: "milliliter",
  LITER: "liter",
  PIECE: "stuk(s)",
  TABLESPOON: "eetlepel",
  TEASPOON: "theelepel",
};

export const UNIT_ORDER: Unit[] = [
  "GRAM",
  "KILOGRAM",
  "MILLILITER",
  "LITER",
  "PIECE",
  "TABLESPOON",
  "TEASPOON",
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: "Borst",
  UPPER_BACK: "Bovenrug",
  LATS: "Lats",
  SHOULDERS: "Schouders",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  FOREARMS: "Onderarmen",
  QUADS: "Quadriceps",
  HAMSTRINGS: "Hamstrings",
  GLUTES: "Bilspieren",
  CALVES: "Kuiten",
  CORE: "Core",
};

export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  "CHEST",
  "UPPER_BACK",
  "LATS",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "QUADS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "CORE",
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  BARBELL: "Barbell",
  DUMBBELL: "Dumbbell",
  MACHINE: "Machine",
  CABLE: "Kabel",
  BODYWEIGHT: "Lichaamsgewicht",
  KETTLEBELL: "Kettlebell",
  BAND: "Weerstandsband",
  OTHER: "Overig",
};

export const EQUIPMENT_ORDER: Equipment[] = [
  "BARBELL",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "KETTLEBELL",
  "BAND",
  "OTHER",
];

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  COMPOUND: "Samengesteld",
  ISOLATION: "Isolatie",
  CORE: "Core",
  CARDIO: "Cardio",
};

export const EXERCISE_CATEGORY_ORDER: ExerciseCategory[] = [
  "COMPOUND",
  "ISOLATION",
  "CORE",
  "CARDIO",
];

export const GOAL_LABELS: Record<Goal, string> = {
  RECOMP: "Recompositie",
  MUSCLE_GAIN: "Spieropbouw",
  FAT_LOSS: "Vetverlies",
  MAINTAIN: "Onderhoud",
};

export const DIETARY_PREFERENCE_LABELS: Record<DietaryPreference, string> = {
  VEGETARIAN: "Vegetarisch",
  VEGETARIAN_PLUS_CHICKEN: "Vegetarisch, soms kip",
  VEGAN: "Veganistisch",
  OMNIVORE: "Alles",
};

export const MEASUREMENT_TYPE_LABELS: Record<MeasurementType, string> = {
  WAIST: "Taille",
  CHEST: "Borst",
  HIPS: "Heupen",
  THIGH: "Been",
  ARM: "Arm",
  NECK: "Nek",
  CALF: "Kuit",
};

export const MEASUREMENT_TYPE_ORDER: MeasurementType[] = [
  "WAIST",
  "CHEST",
  "ARM",
  "THIGH",
  "HIPS",
  "NECK",
  "CALF",
];

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  FRONT: "Voorkant",
  SIDE: "Zijkant",
  BACK: "Achterkant",
};

export const PHOTO_CATEGORY_ORDER: PhotoCategory[] = ["FRONT", "SIDE", "BACK"];

/**
 * Base UI toont in een gesloten keuzelijst de ruwe waarde, tenzij het een
 * `items`-tabel krijgt met de bijbehorende teksten. Deze helper plakt daar een
 * "alles"-optie voor de filters bij.
 */
export function labelsWithAll<T extends string>(
  labels: Record<T, string>,
  allLabel: string,
): Record<string, string> {
  return { ALL: allLabel, ...labels };
}

export const UNIT_LABELS_WITH_NONE: Record<string, string> = {
  NONE: "Geen",
  ...UNIT_LABELS_LONG,
};
