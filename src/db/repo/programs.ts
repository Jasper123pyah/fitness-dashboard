import { db } from "../db";
import { createId, nowIso } from "../ids";
import type {
  Exercise,
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutProgram,
} from "../types";

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: (WorkoutDayExercise & { exercise: Exercise })[];
}

export interface ProgramWithDays extends WorkoutProgram {
  days: WorkoutDayWithExercises[];
}

export function listPrograms(): Promise<WorkoutProgram[]> {
  return db.programs.orderBy("name").toArray();
}

export async function getActiveProgram(): Promise<WorkoutProgram | undefined> {
  const programs = await db.programs.toArray();
  return programs.find((program) => program.isActive) ?? programs[0];
}

export async function getProgramWithDays(
  programId: string,
): Promise<ProgramWithDays | null> {
  const program = await db.programs.get(programId);
  if (!program) return null;

  const days = await db.workoutDays
    .where("programId")
    .equals(programId)
    .sortBy("sortOrder");
  const dayIds = days.map((day) => day.id);
  const dayExercises = await db.workoutDayExercises
    .where("workoutDayId")
    .anyOf(dayIds)
    .sortBy("sortOrder");
  const exercises = await db.exercises.bulkGet([
    ...new Set(dayExercises.map((item) => item.exerciseId)),
  ]);
  const exerciseById = new Map(
    exercises
      .filter((item): item is Exercise => item != null)
      .map((item) => [item.id, item]),
  );

  return {
    ...program,
    days: days.map((day) => ({
      ...day,
      exercises: dayExercises
        .filter((item) => item.workoutDayId === day.id)
        .map((item) => {
          const exercise = exerciseById.get(item.exerciseId);
          return exercise ? { ...item, exercise } : null;
        })
        .filter(
          (item): item is WorkoutDayExercise & { exercise: Exercise } =>
            item != null,
        ),
    })),
  };
}

export async function getActiveProgramWithDays(): Promise<ProgramWithDays | null> {
  const program = await getActiveProgram();
  if (!program) return null;
  return getProgramWithDays(program.id);
}

export async function createProgram(input: {
  name: string;
  description?: string;
  makeActive?: boolean;
}): Promise<string> {
  const id = createId();
  const now = nowIso();
  await db.transaction("rw", db.programs, async () => {
    if (input.makeActive) {
      const programs = await db.programs.toArray();
      await db.programs.bulkPut(
        programs.map((program) => ({ ...program, isActive: false })),
      );
    }
    await db.programs.put({
      id,
      name: input.name,
      description: input.description,
      isActive: input.makeActive ?? false,
      createdAt: now,
      updatedAt: now,
    });
  });
  return id;
}

export async function updateProgram(
  id: string,
  patch: Partial<Pick<WorkoutProgram, "name" | "description">>,
): Promise<void> {
  await db.programs.update(id, { ...patch, updatedAt: nowIso() });
}

export async function setActiveProgram(id: string): Promise<void> {
  await db.transaction("rw", db.programs, async () => {
    const programs = await db.programs.toArray();
    await db.programs.bulkPut(
      programs.map((program) => ({ ...program, isActive: program.id === id })),
    );
  });
}

export async function deleteProgram(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.programs, db.workoutDays, db.workoutDayExercises, db.sessions],
    async () => {
      const days = await db.workoutDays.where("programId").equals(id).toArray();
      const dayIds = days.map((day) => day.id);
      await db.workoutDayExercises.where("workoutDayId").anyOf(dayIds).delete();
      await db.workoutDays.where("programId").equals(id).delete();

      // Sessies blijven bestaan als geschiedenis, maar verwijzen niet meer naar
      // een schema dat er niet meer is.
      const sessions = await db.sessions
        .where("workoutDayId")
        .anyOf(dayIds)
        .toArray();
      for (const session of sessions) {
        await db.sessions.update(session.id, {
          workoutDayId: undefined,
          programId: undefined,
        });
      }
      await db.programs.delete(id);
    },
  );
}

export async function createWorkoutDay(input: {
  programId: string;
  name: string;
  weekday: number | null;
  notes?: string;
}): Promise<string> {
  const id = createId();
  const count = await db.workoutDays
    .where("programId")
    .equals(input.programId)
    .count();
  await db.workoutDays.put({
    id,
    programId: input.programId,
    name: input.name,
    weekday: input.weekday,
    notes: input.notes,
    sortOrder: count,
  });
  return id;
}

export async function updateWorkoutDay(
  id: string,
  patch: Partial<Pick<WorkoutDay, "name" | "weekday" | "notes" | "sortOrder">>,
): Promise<void> {
  await db.workoutDays.update(id, patch);
}

export async function deleteWorkoutDay(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.workoutDays, db.workoutDayExercises, db.sessions],
    async () => {
      await db.workoutDayExercises.where("workoutDayId").equals(id).delete();
      const sessions = await db.sessions
        .where("workoutDayId")
        .equals(id)
        .toArray();
      for (const session of sessions) {
        await db.sessions.update(session.id, { workoutDayId: undefined });
      }
      await db.workoutDays.delete(id);
    },
  );
}

export async function addExerciseToDay(input: {
  workoutDayId: string;
  exerciseId: string;
  sets?: number;
  repMin?: number;
  repMax?: number;
  restSeconds?: number;
}): Promise<string> {
  const id = createId();
  const count = await db.workoutDayExercises
    .where("workoutDayId")
    .equals(input.workoutDayId)
    .count();

  await db.workoutDayExercises.put({
    id,
    workoutDayId: input.workoutDayId,
    exerciseId: input.exerciseId,
    sortOrder: count,
    sets: input.sets ?? 3,
    repMin: input.repMin ?? 8,
    repMax: input.repMax ?? 12,
    restSeconds: input.restSeconds,
  });
  return id;
}

export async function updateDayExercise(
  id: string,
  patch: Partial<Omit<WorkoutDayExercise, "id" | "workoutDayId">>,
): Promise<void> {
  await db.workoutDayExercises.update(id, patch);
}

export async function removeDayExercise(id: string): Promise<void> {
  const item = await db.workoutDayExercises.get(id);
  if (!item) return;

  await db.transaction("rw", db.workoutDayExercises, async () => {
    await db.workoutDayExercises.delete(id);
    const remaining = await db.workoutDayExercises
      .where("workoutDayId")
      .equals(item.workoutDayId)
      .sortBy("sortOrder");
    await db.workoutDayExercises.bulkPut(
      remaining.map((entry, index) => ({ ...entry, sortOrder: index })),
    );
  });
}

/** Verplaatst een oefening één plek omhoog of omlaag binnen de trainingsdag. */
export async function moveDayExercise(
  id: string,
  direction: -1 | 1,
): Promise<void> {
  const item = await db.workoutDayExercises.get(id);
  if (!item) return;

  await db.transaction("rw", db.workoutDayExercises, async () => {
    const list = await db.workoutDayExercises
      .where("workoutDayId")
      .equals(item.workoutDayId)
      .sortBy("sortOrder");

    const index = list.findIndex((entry) => entry.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;

    [list[index], list[target]] = [list[target], list[index]];
    await db.workoutDayExercises.bulkPut(
      list.map((entry, position) => ({ ...entry, sortOrder: position })),
    );
  });
}
