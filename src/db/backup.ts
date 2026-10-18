import { db, META_KEYS, setMeta } from "./db";
import { nowIso } from "./ids";
import { seedDatabase } from "./seed";
import {
  SEED_EXERCISES,
  SEED_INGREDIENTS,
  SEED_RECIPES,
  SEED_VERSION,
} from "./seed-data";
import type { ProgressPhoto } from "./types";

export const BACKUP_FORMAT = "trainlog-backup";
export const BACKUP_VERSION = 1;

interface PhotoBackup extends Omit<ProgressPhoto, "blob"> {
  /** De foto als data-URL, zodat hij in de JSON past. */
  blobDataUrl: string;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  counts: Record<string, number>;
  data: {
    settings: unknown[];
    householdMembers: unknown[];
    exercises: unknown[];
    programs: unknown[];
    workoutDays: unknown[];
    workoutDayExercises: unknown[];
    sessions: unknown[];
    exerciseLogs: unknown[];
    setLogs: unknown[];
    ingredients: unknown[];
    recipes: unknown[];
    recipeIngredients: unknown[];
    mealPlans: unknown[];
    plannedMeals: unknown[];
    mealPlanTemplates: unknown[];
    mealPlanTemplateItems: unknown[];
    groceryLists: unknown[];
    groceryItems: unknown[];
    weightEntries: unknown[];
    bodyMeasurements: unknown[];
    progressPhotos: PhotoBackup[];
    meta: unknown[];
  };
}

/**
 * Foto's gaan als data-URL mee in de JSON. Dat gebeurt met base64 in plaats van
 * FileReader, zodat dezelfde code ook buiten de browser werkt (bijvoorbeeld in
 * de tests).
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  const type = blob.type || "application/octet-stream";
  return `data:${type};base64,${btoa(binary)}`;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64 = ""] = dataUrl.split(",");
  const type =
    header.slice(header.indexOf(":") + 1, header.indexOf(";")) || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type });
}

/**
 * Zet de hele database in één JSON-bestand, inclusief de voortgangsfoto's.
 * Dit is de back-up: er staat niets op een server, dus dit bestand is de enige
 * kopie van de gegevens.
 */
export async function exportBackup(): Promise<BackupFile> {
  const [
    settings,
    householdMembers,
    exercises,
    programs,
    workoutDays,
    workoutDayExercises,
    sessions,
    exerciseLogs,
    setLogs,
    ingredients,
    recipes,
    recipeIngredients,
    mealPlans,
    plannedMeals,
    mealPlanTemplates,
    mealPlanTemplateItems,
    groceryLists,
    groceryItems,
    weightEntries,
    bodyMeasurements,
    photos,
    meta,
  ] = await Promise.all([
    db.settings.toArray(),
    db.householdMembers.toArray(),
    db.exercises.toArray(),
    db.programs.toArray(),
    db.workoutDays.toArray(),
    db.workoutDayExercises.toArray(),
    db.sessions.toArray(),
    db.exerciseLogs.toArray(),
    db.setLogs.toArray(),
    db.ingredients.toArray(),
    db.recipes.toArray(),
    db.recipeIngredients.toArray(),
    db.mealPlans.toArray(),
    db.plannedMeals.toArray(),
    db.mealPlanTemplates.toArray(),
    db.mealPlanTemplateItems.toArray(),
    db.groceryLists.toArray(),
    db.groceryItems.toArray(),
    db.weightEntries.toArray(),
    db.bodyMeasurements.toArray(),
    db.progressPhotos.toArray(),
    db.meta.toArray(),
  ]);

  const progressPhotos: PhotoBackup[] = [];
  for (const photo of photos) {
    const { blob, ...rest } = photo;
    progressPhotos.push({ ...rest, blobDataUrl: await blobToDataUrl(blob) });
  }

  const data = {
    settings,
    householdMembers,
    exercises,
    programs,
    workoutDays,
    workoutDayExercises,
    sessions,
    exerciseLogs,
    setLogs,
    ingredients,
    recipes,
    recipeIngredients,
    mealPlans,
    plannedMeals,
    mealPlanTemplates,
    mealPlanTemplateItems,
    groceryLists,
    groceryItems,
    weightEntries,
    bodyMeasurements,
    progressPhotos,
    meta,
  };

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    counts: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        (value as unknown[]).length,
      ]),
    ),
    data,
  };
}

export async function downloadBackup(): Promise<string> {
  const backup = await exportBackup();
  const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
  const fileName = `trainlog-backup-${backup.exportedAt.slice(0, 10)}.json`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);

  await setMeta(META_KEYS.lastBackupAt, backup.exportedAt);
  return fileName;
}

export class BackupError extends Error {}

export const BACKUP_TABLES = [
  "settings",
  "householdMembers",
  "exercises",
  "programs",
  "workoutDays",
  "workoutDayExercises",
  "sessions",
  "exerciseLogs",
  "setLogs",
  "ingredients",
  "recipes",
  "recipeIngredients",
  "mealPlans",
  "plannedMeals",
  "mealPlanTemplates",
  "mealPlanTemplateItems",
  "groceryLists",
  "groceryItems",
  "weightEntries",
  "bodyMeasurements",
  "progressPhotos",
  "meta",
] as const satisfies readonly (keyof BackupFile["data"])[];

type BackupTable = (typeof BACKUP_TABLES)[number];

/**
 * Verwijzingen die de app zelf altijd heel houdt (bij verwijderen gaan de
 * afhankelijke rijen mee). Een back-up waarin zo'n verwijzing nergens heen
 * wijst, is beschadigd of met de hand aangepast.
 */
const REFERENCES: {
  table: BackupTable;
  field: string;
  target: BackupTable;
  optional?: boolean;
}[] = [
  { table: "workoutDays", field: "programId", target: "programs" },
  { table: "workoutDayExercises", field: "workoutDayId", target: "workoutDays" },
  { table: "workoutDayExercises", field: "exerciseId", target: "exercises" },
  { table: "exerciseLogs", field: "sessionId", target: "sessions" },
  { table: "exerciseLogs", field: "exerciseId", target: "exercises" },
  { table: "setLogs", field: "exerciseLogId", target: "exerciseLogs" },
  { table: "recipeIngredients", field: "recipeId", target: "recipes" },
  { table: "recipeIngredients", field: "ingredientId", target: "ingredients" },
  { table: "plannedMeals", field: "mealPlanId", target: "mealPlans" },
  {
    table: "plannedMeals",
    field: "recipeId",
    target: "recipes",
    optional: true,
  },
  {
    table: "mealPlanTemplateItems",
    field: "templateId",
    target: "mealPlanTemplates",
  },
  { table: "mealPlanTemplateItems", field: "recipeId", target: "recipes" },
  { table: "groceryLists", field: "mealPlanId", target: "mealPlans" },
  { table: "groceryItems", field: "groceryListId", target: "groceryLists" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Controleert de hele back-up voordat er iets wordt gewist: elke tabel moet
 * aanwezig zijn, elke rij moet een sleutel hebben en verwijzingen moeten
 * kloppen. Importeren vervangt alles, dus een half bestand zou anders stil alle
 * voortgang weggooien.
 */
function validateBackupData(backup: BackupFile): void {
  const data = backup.data as unknown as Record<string, unknown>;

  const missing = BACKUP_TABLES.filter((table) => !Array.isArray(data[table]));
  if (missing.length > 0) {
    throw new BackupError(
      `De back-up is onvolledig: ${missing.join(", ")} ontbreekt. Er is niets gewijzigd.`,
    );
  }

  if (isRecord(backup.counts)) {
    for (const table of BACKUP_TABLES) {
      const expected = backup.counts[table];
      const actual = (data[table] as unknown[]).length;
      if (typeof expected === "number" && expected !== actual) {
        throw new BackupError(
          `De back-up is onvolledig: ${table} bevat ${actual} van de ${expected} rijen. Er is niets gewijzigd.`,
        );
      }
    }
  }

  const ids = new Map<BackupTable, Set<string>>();
  for (const table of BACKUP_TABLES) {
    const keyField = table === "meta" ? "key" : "id";
    const keys = new Set<string>();
    for (const row of data[table] as unknown[]) {
      const key = isRecord(row) ? row[keyField] : undefined;
      if (typeof key !== "string" || key === "") {
        throw new BackupError(
          `De back-up bevat een ongeldige rij in ${table}. Er is niets gewijzigd.`,
        );
      }
      if (
        table === "progressPhotos" &&
        (typeof (row as Record<string, unknown>).blobDataUrl !== "string" ||
          !((row as Record<string, unknown>).blobDataUrl as string).startsWith(
            "data:",
          ))
      ) {
        throw new BackupError(
          `De back-up bevat een foto zonder beeld (${key}). Er is niets gewijzigd.`,
        );
      }
      keys.add(key);
    }
    ids.set(table, keys);
  }

  if (ids.get("settings")!.size === 0) {
    throw new BackupError(
      "De back-up bevat geen instellingen. Er is niets gewijzigd.",
    );
  }

  // Na het terugzetten vult seedDatabase() ontbrekende standaardoefeningen,
  // -ingrediënten en -recepten aan, maar alleen als de back-up van een oudere
  // seedversie is. Alleen dan mogen verwijzingen daarop leunen.
  const seedVersion = (data.meta as Record<string, unknown>[]).find(
    (row) => row.key === META_KEYS.seedVersion,
  )?.value;
  if (typeof seedVersion !== "number" || seedVersion < SEED_VERSION) {
    for (const item of SEED_EXERCISES) ids.get("exercises")!.add(item.id);
    for (const item of SEED_INGREDIENTS) ids.get("ingredients")!.add(item.id);
    for (const item of SEED_RECIPES) ids.get("recipes")!.add(item.id);
  }

  for (const { table, field, target, optional } of REFERENCES) {
    const known = ids.get(target)!;
    for (const row of data[table] as Record<string, unknown>[]) {
      const value = row[field];
      if (optional && value == null) continue;
      if (typeof value !== "string" || !known.has(value)) {
        throw new BackupError(
          `De back-up is beschadigd: ${table} ${String(row.id)} verwijst naar een onbekend item in ${target}. Er is niets gewijzigd.`,
        );
      }
    }
  }
}

export function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupError("Dit bestand is geen geldige JSON.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as BackupFile).format !== BACKUP_FORMAT
  ) {
    throw new BackupError("Dit lijkt geen back-up van deze app te zijn.");
  }

  const backup = parsed as BackupFile;
  if (backup.version > BACKUP_VERSION) {
    throw new BackupError(
      "Deze back-up komt uit een nieuwere versie van de app. Werk de app eerst bij.",
    );
  }
  if (typeof backup.data !== "object" || backup.data === null) {
    throw new BackupError("De back-up bevat geen gegevens.");
  }
  validateBackupData(backup);
  return backup;
}

export interface ImportResult {
  restored: Record<string, number>;
}

/**
 * Zet een back-up terug. De huidige inhoud wordt vervangen, zodat er geen
 * mengsel van twee toestellen ontstaat. De aanroeper vraagt eerst om
 * bevestiging.
 */
export async function importBackup(raw: string): Promise<ImportResult> {
  const backup = parseBackup(raw);
  const data = backup.data;

  const photos = await Promise.all(
    data.progressPhotos.map(async (photo) => {
      const { blobDataUrl, ...rest } = photo;
      return { ...rest, blob: dataUrlToBlob(blobDataUrl) };
    }),
  );

  await db.transaction(
    "rw",
    [
      db.settings,
      db.householdMembers,
      db.exercises,
      db.programs,
      db.workoutDays,
      db.workoutDayExercises,
      db.sessions,
      db.exerciseLogs,
      db.setLogs,
      db.ingredients,
      db.recipes,
      db.recipeIngredients,
      db.mealPlans,
      db.plannedMeals,
      db.mealPlanTemplates,
      db.mealPlanTemplateItems,
      db.groceryLists,
      db.groceryItems,
      db.weightEntries,
      db.bodyMeasurements,
      db.progressPhotos,
      db.meta,
    ],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.householdMembers.clear(),
        db.exercises.clear(),
        db.programs.clear(),
        db.workoutDays.clear(),
        db.workoutDayExercises.clear(),
        db.sessions.clear(),
        db.exerciseLogs.clear(),
        db.setLogs.clear(),
        db.ingredients.clear(),
        db.recipes.clear(),
        db.recipeIngredients.clear(),
        db.mealPlans.clear(),
        db.plannedMeals.clear(),
        db.mealPlanTemplates.clear(),
        db.mealPlanTemplateItems.clear(),
        db.groceryLists.clear(),
        db.groceryItems.clear(),
        db.weightEntries.clear(),
        db.bodyMeasurements.clear(),
        db.progressPhotos.clear(),
        db.meta.clear(),
      ]);

      await Promise.all([
        bulkPut(db.settings, data.settings),
        bulkPut(db.householdMembers, data.householdMembers),
        bulkPut(db.exercises, data.exercises),
        bulkPut(db.programs, data.programs),
        bulkPut(db.workoutDays, data.workoutDays),
        bulkPut(db.workoutDayExercises, data.workoutDayExercises),
        bulkPut(db.sessions, data.sessions),
        bulkPut(db.exerciseLogs, data.exerciseLogs),
        bulkPut(db.setLogs, data.setLogs),
        bulkPut(db.ingredients, data.ingredients),
        bulkPut(db.recipes, data.recipes),
        bulkPut(db.recipeIngredients, data.recipeIngredients),
        bulkPut(db.mealPlans, data.mealPlans),
        bulkPut(db.plannedMeals, data.plannedMeals),
        bulkPut(db.mealPlanTemplates, data.mealPlanTemplates),
        bulkPut(db.mealPlanTemplateItems, data.mealPlanTemplateItems),
        bulkPut(db.groceryLists, data.groceryLists),
        bulkPut(db.groceryItems, data.groceryItems),
        bulkPut(db.weightEntries, data.weightEntries),
        bulkPut(db.bodyMeasurements, data.bodyMeasurements),
        db.progressPhotos.bulkPut(photos),
        bulkPut(db.meta, data.meta),
      ]);
    },
  );

  // Een back-up van een oudere versie kan nieuwe standaardinhoud missen.
  await seedDatabase();

  return {
    restored: Object.fromEntries(
      BACKUP_TABLES.map((table) => [table, data[table].length]),
    ),
  };
}

// Dexie's bulkPut is per tabel getypeerd; parseBackup() heeft de rijen al
// gecontroleerd, maar hun precieze type is hier niet bekend.
function bulkPut(
  table: { bulkPut: (rows: never[]) => Promise<unknown> },
  rows: unknown[],
) {
  return table.bulkPut(rows as never[]);
}
