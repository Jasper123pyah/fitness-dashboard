import { db } from "../db";
import { createId, nowIso } from "../ids";
import type {
  Exercise,
  ExerciseCategory,
  Equipment,
  MuscleGroup,
} from "../types";

export function listExercises(): Promise<Exercise[]> {
  return db.exercises.orderBy("name").toArray();
}

export function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export interface ExerciseFilter {
  search?: string;
  muscle?: MuscleGroup | "ALL";
  equipment?: Equipment | "ALL";
  category?: ExerciseCategory | "ALL";
}

export function filterExercises(
  exercises: Exercise[],
  filter: ExerciseFilter,
): Exercise[] {
  const search = filter.search?.trim().toLowerCase() ?? "";

  return exercises.filter((exercise) => {
    if (search.length > 0) {
      const haystack =
        `${exercise.name} ${exercise.instructions ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filter.muscle && filter.muscle !== "ALL") {
      const matches =
        exercise.primaryMuscle === filter.muscle ||
        exercise.secondaryMuscles.includes(filter.muscle);
      if (!matches) return false;
    }
    if (
      filter.equipment &&
      filter.equipment !== "ALL" &&
      exercise.equipment !== filter.equipment
    ) {
      return false;
    }
    if (
      filter.category &&
      filter.category !== "ALL" &&
      exercise.category !== filter.category
    ) {
      return false;
    }
    return true;
  });
}

export async function createExercise(
  input: Omit<Exercise, "id" | "createdAt" | "updatedAt" | "isCustom">,
): Promise<string> {
  const id = createId();
  const now = nowIso();
  await db.exercises.put({
    ...input,
    id,
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateExercise(
  id: string,
  patch: Partial<Omit<Exercise, "id" | "createdAt">>,
): Promise<void> {
  await db.exercises.update(id, { ...patch, updatedAt: nowIso() });
}

export interface DeleteExerciseResult {
  deleted: boolean;
  /** Aantal keer dat de oefening nog in een schema of logboek voorkomt. */
  usedInPrograms: number;
  usedInSessions: number;
}

/**
 * Verwijdert een oefening alleen als er geen geschiedenis aan hangt. Logs
 * weggooien om een naam op te ruimen zou voortgang wissen.
 */
export async function deleteExercise(
  id: string,
): Promise<DeleteExerciseResult> {
  const usedInPrograms = await db.workoutDayExercises
    .where("exerciseId")
    .equals(id)
    .count();
  const usedInSessions = await db.exerciseLogs
    .where("exerciseId")
    .equals(id)
    .count();

  if (usedInPrograms > 0 || usedInSessions > 0) {
    return { deleted: false, usedInPrograms, usedInSessions };
  }

  await db.exercises.delete(id);
  return { deleted: true, usedInPrograms: 0, usedInSessions: 0 };
}
