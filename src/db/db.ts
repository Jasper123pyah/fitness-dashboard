import Dexie, { type EntityTable } from "dexie";

import type {
  AppSettings,
  BodyMeasurement,
  Exercise,
  ExerciseLog,
  GroceryItem,
  GroceryList,
  HouseholdMember,
  Ingredient,
  MealPlan,
  MealPlanTemplate,
  MealPlanTemplateItem,
  MetaRecord,
  PlannedMeal,
  ProgressPhoto,
  Recipe,
  RecipeIngredient,
  SetLog,
  WeightEntry,
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutProgram,
  WorkoutSession,
} from "./types";

/**
 * De volledige database van de app, in IndexedDB op het toestel zelf.
 *
 * Nieuwe velden of tabellen horen in een *nieuwe* `version(n)`-blok met een
 * `upgrade()` wanneer bestaande rijen moeten worden bijgewerkt. Dexie laat de
 * bestaande gegevens dan staan, zodat een update van de app nooit iets wist.
 */
export class TrainlogDatabase extends Dexie {
  settings!: EntityTable<AppSettings, "id">;
  householdMembers!: EntityTable<HouseholdMember, "id">;

  exercises!: EntityTable<Exercise, "id">;
  programs!: EntityTable<WorkoutProgram, "id">;
  workoutDays!: EntityTable<WorkoutDay, "id">;
  workoutDayExercises!: EntityTable<WorkoutDayExercise, "id">;
  sessions!: EntityTable<WorkoutSession, "id">;
  exerciseLogs!: EntityTable<ExerciseLog, "id">;
  setLogs!: EntityTable<SetLog, "id">;

  ingredients!: EntityTable<Ingredient, "id">;
  recipes!: EntityTable<Recipe, "id">;
  recipeIngredients!: EntityTable<RecipeIngredient, "id">;
  mealPlans!: EntityTable<MealPlan, "id">;
  plannedMeals!: EntityTable<PlannedMeal, "id">;
  mealPlanTemplates!: EntityTable<MealPlanTemplate, "id">;
  mealPlanTemplateItems!: EntityTable<MealPlanTemplateItem, "id">;

  groceryLists!: EntityTable<GroceryList, "id">;
  groceryItems!: EntityTable<GroceryItem, "id">;

  weightEntries!: EntityTable<WeightEntry, "id">;
  bodyMeasurements!: EntityTable<BodyMeasurement, "id">;
  progressPhotos!: EntityTable<ProgressPhoto, "id">;

  meta!: EntityTable<MetaRecord, "key">;

  constructor(name = "trainlog") {
    super(name);

    this.version(1).stores({
      settings: "id",
      householdMembers: "id, sortOrder, &name",

      exercises: "id, &name, primaryMuscle, category, equipment, isCustom",
      programs: "id, isActive, name",
      workoutDays:
        "id, programId, weekday, [programId+weekday], [programId+sortOrder]",
      workoutDayExercises:
        "id, workoutDayId, exerciseId, [workoutDayId+sortOrder]",
      sessions:
        "id, date, status, workoutDayId, [status+date], [workoutDayId+date]",
      exerciseLogs:
        "id, sessionId, exerciseId, [sessionId+sortOrder], [exerciseId+sessionId]",
      setLogs: "id, exerciseLogId, &[exerciseLogId+setNumber]",

      ingredients: "id, &name, category",
      recipes: "id, &name, category, isFavorite, isCustom",
      recipeIngredients: "id, recipeId, ingredientId, [recipeId+sortOrder]",
      mealPlans: "id, &weekStart",
      plannedMeals:
        "id, mealPlanId, date, slot, recipeId, [mealPlanId+date], &[mealPlanId+date+slot]",
      mealPlanTemplates: "id, &name",
      mealPlanTemplateItems:
        "id, templateId, recipeId, &[templateId+weekday+slot], [templateId+weekday]",

      groceryLists: "id, &mealPlanId, weekStart",
      groceryItems:
        "id, groceryListId, ingredientId, [groceryListId+category], [groceryListId+sortOrder]",

      weightEntries: "id, &date",
      bodyMeasurements: "id, date, type, &[date+type], [type+date]",
      progressPhotos: "id, date, category, [category+date]",

      meta: "key",
    });
  }
}

export const db = new TrainlogDatabase();

export const META_KEYS = {
  seedVersion: "seedVersion",
  activeSessionId: "activeSessionId",
  lastBackupAt: "lastBackupAt",
  installedAt: "installedAt",
} as const;

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}
