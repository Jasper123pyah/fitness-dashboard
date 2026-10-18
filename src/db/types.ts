/**
 * Alle types van de lokale database. Omdat de app volledig offline werkt is dit
 * het enige datamodel: er is geen server die iets anders zou kunnen zeggen.
 *
 * Kalenderdagen worden opgeslagen als `yyyy-MM-dd` (zie lib/dates.ts) en
 * tijdstippen als ISO-string. Beide zijn direct sorteerbaar en overleven een
 * JSON-export zonder tijdzoneverrassingen.
 */

export type DateKey = string;
export type Timestamp = string;

export const GOALS = ["RECOMP", "MUSCLE_GAIN", "FAT_LOSS", "MAINTAIN"] as const;
export type Goal = (typeof GOALS)[number];

export const WEIGHT_UNITS = ["KG", "LB"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const THEMES = ["SYSTEM", "LIGHT", "DARK"] as const;
export type Theme = (typeof THEMES)[number];

export const DIETARY_PREFERENCES = [
  "VEGETARIAN",
  "VEGETARIAN_PLUS_CHICKEN",
  "VEGAN",
  "OMNIVORE",
] as const;
export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number];

export const MUSCLE_GROUPS = [
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
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = [
  "BARBELL",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "KETTLEBELL",
  "BAND",
  "OTHER",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EXERCISE_CATEGORIES = [
  "COMPOUND",
  "ISOLATION",
  "CORE",
  "CARDIO",
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const SESSION_STATUSES = ["IN_PROGRESS", "COMPLETED"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const MEAL_CATEGORIES = [
  "PRE_WORKOUT",
  "LUNCH",
  "DINNER",
  "EVENING_SNACK",
] as const;
export type MealCategory = (typeof MEAL_CATEGORIES)[number];

export const UNITS = [
  "GRAM",
  "KILOGRAM",
  "MILLILITER",
  "LITER",
  "PIECE",
  "TABLESPOON",
  "TEASPOON",
] as const;
export type Unit = (typeof UNITS)[number];

export const SHOPPING_CATEGORIES = [
  "VEGETABLES",
  "FRUIT",
  "DAIRY_EGGS",
  "PROTEIN",
  "GRAINS",
  "LEGUMES_CANNED",
  "HERBS_SPICES",
  "OTHER",
] as const;
export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

export const MEASUREMENT_TYPES = [
  "WAIST",
  "CHEST",
  "HIPS",
  "THIGH",
  "ARM",
  "NECK",
  "CALF",
] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export const PHOTO_CATEGORIES = ["FRONT", "SIDE", "BACK"] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

// ------------------------------------------------------------------ instellingen

export interface AppSettings {
  id: "settings";
  name: string;
  heightCm: number;
  startWeightKg: number;
  goal: Goal;
  /** 1 = maandag ... 7 = zondag */
  trainingDays: number[];
  weightUnit: WeightUnit;
  defaultRestSeconds: number;
  preferredWorkoutTime: string;
  dietaryPreference: DietaryPreference;
  excludedIngredients: string[];
  proteinTargetMinG: number;
  proteinTargetMaxG: number;
  showNutritionInfo: boolean;
  theme: Theme;
  /** Standaard gewichtsstap voor samengestelde oefeningen. */
  compoundIncrementKg: number;
  /** Standaard gewichtsstap voor isolatieoefeningen. */
  isolationIncrementKg: number;
  updatedAt: Timestamp;
}

export interface HouseholdMember {
  id: string;
  name: string;
  isVegetarian: boolean;
  eatsDinner: boolean;
  /** De gebruiker zelf; kan niet worden verwijderd. */
  isSelf: boolean;
  sortOrder: number;
}

// ------------------------------------------------------------------ training

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  category: ExerciseCategory;
  instructions?: string;
  /**
   * Een geschatte 1RM zegt alleen iets bij oefeningen met een duidelijke,
   * volledig gedragen externe belasting. Bij bijvoorbeeld hanging knee raises
   * of kuitverhogingen op een machine met onbekende hefboom slaan we het over.
   */
  supportsOneRepMax: boolean;
  isCustom: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkoutDay {
  id: string;
  programId: string;
  name: string;
  /** 1 = maandag ... 7 = zondag, of null voor een losse dag. */
  weekday: number | null;
  sortOrder: number;
  notes?: string;
}

export interface WorkoutDayExercise {
  id: string;
  workoutDayId: string;
  exerciseId: string;
  sortOrder: number;
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  programId?: string;
  workoutDayId?: string;
  name: string;
  date: DateKey;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  status: SessionStatus;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  sortOrder: number;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  targetRestSec?: number;
  notes?: string;
}

export interface SetLog {
  id: string;
  exerciseLogId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
  isWarmup: boolean;
  completedAt?: Timestamp;
}

// ------------------------------------------------------------------ voeding

export interface Ingredient {
  id: string;
  name: string;
  category: ShoppingCategory;
  /** Eenheid waarin dit ingrediënt normaal op de boodschappenlijst staat. */
  baseUnit: Unit;
  /** Gram per stuk, als dat bekend is. Alleen informatief. */
  gramsPerPiece?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  category: MealCategory;
  instructions: string;
  prepMinutes: number;
  servings: number;
  isVegetarian: boolean;
  /** Data-URL of object-URL; blijft leeg bij de standaardrecepten. */
  imageUrl?: string;
  kcalPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit: Unit;
  note?: string;
  sortOrder: number;
}

export interface MealPlan {
  id: string;
  /** Maandag van de week waar dit plan over gaat. */
  weekStart: DateKey;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlannedMeal {
  id: string;
  mealPlanId: string;
  date: DateKey;
  slot: MealCategory;
  recipeId?: string;
  customTitle?: string;
  servings: number;
  /** Huisgenoten die meeëten; bepaalt de porties van een gedeelde maaltijd. */
  memberIds: string[];
  note?: string;
}

export interface MealPlanTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MealPlanTemplateItem {
  id: string;
  templateId: string;
  /** 1 = maandag ... 7 = zondag */
  weekday: number;
  slot: MealCategory;
  recipeId: string;
  servings: number;
  memberIds: string[];
}

// ------------------------------------------------------------------ boodschappen

export interface GroceryList {
  id: string;
  mealPlanId: string;
  weekStart: DateKey;
  generatedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroceryItem {
  id: string;
  groceryListId: string;
  ingredientId?: string;
  name: string;
  quantity: number | null;
  unit: Unit | null;
  category: ShoppingCategory;
  checked: boolean;
  /** Zelf toegevoegd: blijft staan bij opnieuw genereren. */
  isCustom: boolean;
  /** Hoeveelheid handmatig aangepast: wordt bij genereren niet overschreven. */
  isEdited: boolean;
  sortOrder: number;
  note?: string;
}

// ------------------------------------------------------------------ voortgang

export interface WeightEntry {
  id: string;
  date: DateKey;
  weightKg: number;
  note?: string;
}

export interface BodyMeasurement {
  id: string;
  date: DateKey;
  type: MeasurementType;
  valueCm: number;
  note?: string;
}

export interface ProgressPhoto {
  id: string;
  date: DateKey;
  category: PhotoCategory;
  /** De foto zelf. Blijft in IndexedDB op dit toestel staan. */
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  note?: string;
  createdAt: Timestamp;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}
