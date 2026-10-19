import { db, getMeta, META_KEYS, setMeta } from "../db";
import { createId, nowIso } from "../ids";
import type {
  Exercise,
  ExerciseLog,
  SetLog,
  WorkoutDayExercise,
  WorkoutSession,
} from "../types";
import { todayKey } from "@/lib/dates";
import {
  completedWorkingSets,
  estimateOneRepMax,
  incrementForExercise,
  personalRecords,
  sessionVolume,
  suggestProgression,
  type ProgressionAdvice,
} from "@/lib/progression";
import { getSettings } from "./settings";

/**
 * Vaste volgorde voor sessies: op dag, dan op starttijd, dan op id. Zonder die
 * laatste stap kunnen twee trainingen op dezelfde dag van plek wisselen en
 * klopt de grafiek niet meer.
 */
function compareSessions(a: WorkoutSession, b: WorkoutSession): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  const byStart = a.startedAt.localeCompare(b.startedAt);
  if (byStart !== 0) return byStart;
  return a.id.localeCompare(b.id);
}

export interface ExerciseLogWithSets extends ExerciseLog {
  exercise: Exercise;
  sets: SetLog[];
}

export interface SessionDetail extends WorkoutSession {
  exercises: ExerciseLogWithSets[];
}

/** De sets van dezelfde oefening in de vorige afgeronde training. */
export interface PreviousPerformance {
  date: string;
  sets: { setNumber: number; weightKg: number | null; reps: number | null }[];
}

export async function getSessionDetail(
  sessionId: string,
): Promise<SessionDetail | null> {
  const session = await db.sessions.get(sessionId);
  if (!session) return null;

  const logs = await db.exerciseLogs
    .where("sessionId")
    .equals(sessionId)
    .sortBy("sortOrder");
  const sets = await db.setLogs
    .where("exerciseLogId")
    .anyOf(logs.map((log) => log.id))
    .toArray();
  const exercises = await db.exercises.bulkGet(
    logs.map((log) => log.exerciseId),
  );
  const exerciseById = new Map(
    exercises
      .filter((item): item is Exercise => item != null)
      .map((item) => [item.id, item]),
  );

  return {
    ...session,
    exercises: logs
      .map((log) => {
        const exercise = exerciseById.get(log.exerciseId);
        if (!exercise) return null;
        return {
          ...log,
          exercise,
          sets: sets
            .filter((set) => set.exerciseLogId === log.id)
            .sort((a, b) => a.setNumber - b.setNumber),
        };
      })
      .filter((item): item is ExerciseLogWithSets => item != null),
  };
}

export async function getActiveSession(): Promise<WorkoutSession | undefined> {
  const stored = await getMeta<string>(META_KEYS.activeSessionId);
  if (stored) {
    const session = await db.sessions.get(stored);
    if (session && session.status === "IN_PROGRESS") return session;
  }

  const open = await db.sessions
    .where("status")
    .equals("IN_PROGRESS")
    .reverse()
    .sortBy("startedAt");
  // Niet terugschrijven naar meta: dit draait binnen useLiveQuery, waar Dexie
  // schrijven verbiedt.
  return open[0];
}

/**
 * Zoekt de laatst afgeronde training waarin deze oefening voorkwam, om de
 * gewichten van vorige keer te kunnen laten zien en voorvullen.
 */
export async function getPreviousPerformance(
  exerciseId: string,
  options: { excludeSessionId?: string } = {},
): Promise<PreviousPerformance | null> {
  const logs = await db.exerciseLogs
    .where("exerciseId")
    .equals(exerciseId)
    .toArray();
  if (logs.length === 0) return null;

  const sessions = await db.sessions.bulkGet(logs.map((log) => log.sessionId));
  const candidates = sessions
    .map((session, index) => ({ session, log: logs[index] }))
    .filter(
      (entry): entry is { session: WorkoutSession; log: ExerciseLog } =>
        entry.session != null &&
        entry.session.status === "COMPLETED" &&
        entry.session.id !== options.excludeSessionId,
    )
    .sort((a, b) => compareSessions(b.session, a.session));

  for (const candidate of candidates) {
    const sets = await db.setLogs
      .where("exerciseLogId")
      .equals(candidate.log.id)
      .sortBy("setNumber");
    const done = sets.filter((set) => set.completed && !set.isWarmup);
    if (done.length === 0) continue;

    return {
      date: candidate.session.date,
      sets: done.map((set) => ({
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
      })),
    };
  }

  return null;
}

/** Start een training op basis van een dag uit het schema. */
export async function startSessionFromDay(
  workoutDayId: string,
): Promise<string> {
  const day = await db.workoutDays.get(workoutDayId);
  if (!day) throw new Error("Trainingsdag niet gevonden");

  const dayExercises = await db.workoutDayExercises
    .where("workoutDayId")
    .equals(workoutDayId)
    .sortBy("sortOrder");

  const sessionId = createId();
  const now = nowIso();

  // Gewichten van vorige keer alvast invullen, buiten de transactie opgehaald.
  const previous = new Map<string, PreviousPerformance | null>();
  for (const item of dayExercises) {
    previous.set(
      item.exerciseId,
      await getPreviousPerformance(item.exerciseId),
    );
  }

  await db.transaction(
    "rw",
    [db.sessions, db.exerciseLogs, db.setLogs, db.meta],
    async () => {
      await db.sessions.put({
        id: sessionId,
        programId: day.programId,
        workoutDayId: day.id,
        name: day.name,
        date: todayKey(),
        startedAt: now,
        status: "IN_PROGRESS",
      });

      for (const [index, item] of dayExercises.entries()) {
        const logId = createId();
        await db.exerciseLogs.put({
          id: logId,
          sessionId,
          exerciseId: item.exerciseId,
          sortOrder: index,
          targetSets: item.sets,
          targetRepMin: item.repMin,
          targetRepMax: item.repMax,
          targetRestSec: item.restSeconds,
        });

        await db.setLogs.bulkPut(
          buildEmptySets(logId, item, previous.get(item.exerciseId) ?? null),
        );
      }

      await setMeta(META_KEYS.activeSessionId, sessionId);
    },
  );

  return sessionId;
}

/** Start een losse training zonder schema. */
export async function startEmptySession(
  name = "Losse training",
): Promise<string> {
  const sessionId = createId();
  await db.transaction("rw", [db.sessions, db.meta], async () => {
    await db.sessions.put({
      id: sessionId,
      name,
      date: todayKey(),
      startedAt: nowIso(),
      status: "IN_PROGRESS",
    });
    await setMeta(META_KEYS.activeSessionId, sessionId);
  });
  return sessionId;
}

function buildEmptySets(
  exerciseLogId: string,
  target: Pick<WorkoutDayExercise, "sets">,
  previous: PreviousPerformance | null,
): SetLog[] {
  const fallbackWeight =
    previous && previous.sets.length > 0
      ? previous.sets[previous.sets.length - 1].weightKg
      : null;

  return Array.from({ length: Math.max(1, target.sets) }, (_, index) => {
    const previousSet = previous?.sets.find(
      (set) => set.setNumber === index + 1,
    );
    return {
      id: createId(),
      exerciseLogId,
      setNumber: index + 1,
      weightKg: previousSet?.weightKg ?? fallbackWeight,
      reps: null,
      completed: false,
      isWarmup: false,
    };
  });
}

export async function updateSet(
  setId: string,
  patch: Partial<Pick<SetLog, "weightKg" | "reps" | "completed" | "isWarmup">>,
): Promise<void> {
  const next: Partial<SetLog> = { ...patch };
  if (patch.completed === true) next.completedAt = nowIso();
  if (patch.completed === false) next.completedAt = undefined;
  await db.setLogs.update(setId, next);
}

export async function addSet(exerciseLogId: string): Promise<void> {
  const sets = await db.setLogs
    .where("exerciseLogId")
    .equals(exerciseLogId)
    .sortBy("setNumber");
  const last = sets[sets.length - 1];
  await db.setLogs.put({
    id: createId(),
    exerciseLogId,
    setNumber: (last?.setNumber ?? 0) + 1,
    weightKg: last?.weightKg ?? null,
    reps: null,
    completed: false,
    isWarmup: false,
  });
}

export async function removeSet(setId: string): Promise<void> {
  const set = await db.setLogs.get(setId);
  if (!set) return;

  await db.transaction("rw", db.setLogs, async () => {
    await db.setLogs.delete(setId);
    const remaining = await db.setLogs
      .where("exerciseLogId")
      .equals(set.exerciseLogId)
      .sortBy("setNumber");
    await db.setLogs.bulkPut(
      remaining.map((entry, index) => ({ ...entry, setNumber: index + 1 })),
    );
  });
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  options: { sets?: number; repMin?: number; repMax?: number } = {},
): Promise<void> {
  const existing = await db.exerciseLogs
    .where("sessionId")
    .equals(sessionId)
    .and((log) => log.exerciseId === exerciseId)
    .first();
  if (existing) return;

  const count = await db.exerciseLogs
    .where("sessionId")
    .equals(sessionId)
    .count();
  const previous = await getPreviousPerformance(exerciseId, {
    excludeSessionId: sessionId,
  });
  const logId = createId();
  const sets = options.sets ?? 3;

  await db.transaction("rw", [db.exerciseLogs, db.setLogs], async () => {
    await db.exerciseLogs.put({
      id: logId,
      sessionId,
      exerciseId,
      sortOrder: count,
      targetSets: sets,
      targetRepMin: options.repMin ?? 8,
      targetRepMax: options.repMax ?? 12,
    });
    await db.setLogs.bulkPut(buildEmptySets(logId, { sets }, previous));
  });
}

export async function removeExerciseFromSession(
  exerciseLogId: string,
): Promise<void> {
  const log = await db.exerciseLogs.get(exerciseLogId);
  if (!log) return;

  await db.transaction("rw", [db.exerciseLogs, db.setLogs], async () => {
    await db.setLogs.where("exerciseLogId").equals(exerciseLogId).delete();
    await db.exerciseLogs.delete(exerciseLogId);
    const remaining = await db.exerciseLogs
      .where("sessionId")
      .equals(log.sessionId)
      .sortBy("sortOrder");
    await db.exerciseLogs.bulkPut(
      remaining.map((entry, index) => ({ ...entry, sortOrder: index })),
    );
  });
}

/** Vervangt een oefening in een lopende training; de ingevulde sets gaan mee. */
export async function replaceSessionExercise(
  exerciseLogId: string,
  newExerciseId: string,
): Promise<void> {
  const log = await db.exerciseLogs.get(exerciseLogId);
  if (!log) return;

  const duplicate = await db.exerciseLogs
    .where("sessionId")
    .equals(log.sessionId)
    .and(
      (entry) =>
        entry.exerciseId === newExerciseId && entry.id !== exerciseLogId,
    )
    .first();
  if (duplicate) throw new Error("Deze oefening staat al in de training");

  const previous = await getPreviousPerformance(newExerciseId, {
    excludeSessionId: log.sessionId,
  });

  await db.transaction("rw", [db.exerciseLogs, db.setLogs], async () => {
    await db.exerciseLogs.update(exerciseLogId, { exerciseId: newExerciseId });

    // Het gewicht van de oude oefening zegt niets over de nieuwe: leeg maken en
    // voorvullen met de historie van de nieuwe oefening.
    const sets = await db.setLogs
      .where("exerciseLogId")
      .equals(exerciseLogId)
      .sortBy("setNumber");
    await db.setLogs.bulkPut(
      sets.map((set, index) => ({
        ...set,
        weightKg:
          previous?.sets.find((item) => item.setNumber === index + 1)
            ?.weightKg ?? null,
        reps: null,
        completed: false,
        completedAt: undefined,
      })),
    );
  });
}

export async function moveSessionExercise(
  exerciseLogId: string,
  direction: -1 | 1,
): Promise<void> {
  const log = await db.exerciseLogs.get(exerciseLogId);
  if (!log) return;

  await db.transaction("rw", db.exerciseLogs, async () => {
    const list = await db.exerciseLogs
      .where("sessionId")
      .equals(log.sessionId)
      .sortBy("sortOrder");
    const index = list.findIndex((entry) => entry.id === exerciseLogId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;

    [list[index], list[target]] = [list[target], list[index]];
    await db.exerciseLogs.bulkPut(
      list.map((entry, position) => ({ ...entry, sortOrder: position })),
    );
  });
}

export async function updateSessionNotes(
  sessionId: string,
  notes: string,
): Promise<void> {
  await db.sessions.update(sessionId, {
    notes: notes.trim() === "" ? undefined : notes,
  });
}

export async function completeSession(sessionId: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.sessions, db.setLogs, db.exerciseLogs, db.meta],
    async () => {
      const logs = await db.exerciseLogs
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      const sets = await db.setLogs
        .where("exerciseLogId")
        .anyOf(logs.map((log) => log.id))
        .toArray();

      // Niet ingevulde sets horen niet in de geschiedenis: ze zouden de voortgang
      // en de adviezen vertroebelen.
      const empty = sets.filter((set) => !set.completed && set.reps == null);
      await db.setLogs.bulkDelete(empty.map((set) => set.id));

      await db.sessions.update(sessionId, {
        status: "COMPLETED",
        completedAt: nowIso(),
      });
      await setMeta(META_KEYS.activeSessionId, null);
    },
  );
}

export async function reopenSession(sessionId: string): Promise<void> {
  await db.transaction("rw", [db.sessions, db.meta], async () => {
    await db.sessions.update(sessionId, {
      status: "IN_PROGRESS",
      completedAt: undefined,
    });
    await setMeta(META_KEYS.activeSessionId, sessionId);
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.sessions, db.exerciseLogs, db.setLogs, db.meta],
    async () => {
      const logs = await db.exerciseLogs
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      await db.setLogs
        .where("exerciseLogId")
        .anyOf(logs.map((log) => log.id))
        .delete();
      await db.exerciseLogs.where("sessionId").equals(sessionId).delete();
      await db.sessions.delete(sessionId);
      const active = await getMeta<string>(META_KEYS.activeSessionId);
      if (active === sessionId) await setMeta(META_KEYS.activeSessionId, null);
    },
  );
}

export interface SessionSummary extends WorkoutSession {
  exerciseCount: number;
  setCount: number;
  volumeKg: number;
}

export async function listSessionSummaries(
  limit?: number,
): Promise<SessionSummary[]> {
  const sessions = await db.sessions.orderBy("date").reverse().toArray();
  const ordered = sessions.sort((a, b) => compareSessions(b, a));
  const selected = limit ? ordered.slice(0, limit) : ordered;

  const logs = await db.exerciseLogs
    .where("sessionId")
    .anyOf(selected.map((session) => session.id))
    .toArray();
  const sets = await db.setLogs
    .where("exerciseLogId")
    .anyOf(logs.map((log) => log.id))
    .toArray();
  const setsByLog = new Map<string, SetLog[]>();
  for (const set of sets) {
    const list = setsByLog.get(set.exerciseLogId);
    if (list) list.push(set);
    else setsByLog.set(set.exerciseLogId, [set]);
  }

  return selected.map((session) => {
    const sessionLogs = logs.filter((log) => log.sessionId === session.id);
    const sessionSets = sessionLogs.flatMap(
      (log) => setsByLog.get(log.id) ?? [],
    );
    const done = completedWorkingSets(sessionSets);
    return {
      ...session,
      exerciseCount: sessionLogs.length,
      setCount: done.length,
      volumeKg: sessionVolume(done),
    };
  });
}

export async function getLastCompletionForDay(
  workoutDayId: string,
): Promise<string | null> {
  const sessions = await db.sessions
    .where("workoutDayId")
    .equals(workoutDayId)
    .and((session) => session.status === "COMPLETED")
    .sortBy("date");
  const last = sessions[sessions.length - 1];
  return last?.date ?? null;
}

export interface ExerciseProgressPoint {
  date: string;
  sessionId: string;
  topWeightKg: number;
  topSetReps: number;
  totalReps: number;
  volumeKg: number;
  estimatedOneRepMax: number | null;
}

export interface ExerciseHistory {
  exercise: Exercise;
  points: ExerciseProgressPoint[];
  records: ReturnType<typeof personalRecords>;
  /** Advies voor de volgende keer, op basis van de laatste training. */
  advice: ProgressionAdvice | null;
  lastTarget: { sets: number; repMin: number; repMax: number } | null;
}

export async function getExerciseHistory(
  exerciseId: string,
): Promise<ExerciseHistory | null> {
  const exercise = await db.exercises.get(exerciseId);
  if (!exercise) return null;

  const logs = await db.exerciseLogs
    .where("exerciseId")
    .equals(exerciseId)
    .toArray();
  const sessions = await db.sessions.bulkGet(logs.map((log) => log.sessionId));
  const sets = await db.setLogs
    .where("exerciseLogId")
    .anyOf(logs.map((log) => log.id))
    .toArray();

  const entries = logs
    .map((log, index) => ({ log, session: sessions[index] }))
    .filter(
      (entry): entry is { log: ExerciseLog; session: WorkoutSession } =>
        entry.session != null && entry.session.status === "COMPLETED",
    )
    .map((entry) => ({
      ...entry,
      sets: completedWorkingSets(
        sets.filter((set) => set.exerciseLogId === entry.log.id),
      ),
    }))
    .filter((entry) => entry.sets.length > 0)
    .sort((a, b) => compareSessions(a.session, b.session));

  const points: ExerciseProgressPoint[] = entries.map((entry) => {
    const topWeightKg = Math.max(...entry.sets.map((set) => set.weightKg));
    const topSet = entry.sets
      .filter((set) => set.weightKg === topWeightKg)
      .sort((a, b) => b.reps - a.reps)[0];

    return {
      date: entry.session.date,
      sessionId: entry.session.id,
      topWeightKg,
      topSetReps: topSet.reps,
      totalReps: entry.sets.reduce((sum, set) => sum + set.reps, 0),
      volumeKg: sessionVolume(entry.sets),
      estimatedOneRepMax: exercise.supportsOneRepMax
        ? estimateOneRepMax(topWeightKg, topSet.reps)
        : null,
    };
  });

  const settings = await getSettings();
  const lastEntry = entries[entries.length - 1];
  const advice = lastEntry
    ? suggestProgression({
        sets: lastEntry.sets,
        targetSets: lastEntry.log.targetSets,
        repMin: lastEntry.log.targetRepMin,
        repMax: lastEntry.log.targetRepMax,
        incrementKg: incrementForExercise(exercise, settings),
      })
    : null;

  return {
    exercise,
    points,
    records: personalRecords(
      entries.map((entry) => ({ date: entry.session.date, sets: entry.sets })),
      { supportsOneRepMax: exercise.supportsOneRepMax },
    ),
    advice,
    lastTarget: lastEntry
      ? {
          sets: lastEntry.log.targetSets,
          repMin: lastEntry.log.targetRepMin,
          repMax: lastEntry.log.targetRepMax,
        }
      : null,
  };
}

/** Advies per oefening binnen een lopende training. */
export async function getAdviceForSession(
  sessionId: string,
): Promise<Map<string, ProgressionAdvice>> {
  const settings = await getSettings();
  const logs = await db.exerciseLogs
    .where("sessionId")
    .equals(sessionId)
    .toArray();
  const result = new Map<string, ProgressionAdvice>();

  for (const log of logs) {
    const exercise = await db.exercises.get(log.exerciseId);
    if (!exercise) continue;

    const previousLogs = await db.exerciseLogs
      .where("exerciseId")
      .equals(log.exerciseId)
      .toArray();
    const previousSessions = await db.sessions.bulkGet(
      previousLogs.map((item) => item.sessionId),
    );
    const candidates = previousLogs
      .map((item, index) => ({ log: item, session: previousSessions[index] }))
      .filter(
        (entry): entry is { log: ExerciseLog; session: WorkoutSession } =>
          entry.session != null &&
          entry.session.status === "COMPLETED" &&
          entry.session.id !== sessionId,
      )
      .sort((a, b) => compareSessions(b.session, a.session));

    const last = candidates[0];
    if (!last) continue;

    const sets = completedWorkingSets(
      await db.setLogs.where("exerciseLogId").equals(last.log.id).toArray(),
    );
    if (sets.length === 0) continue;

    result.set(
      log.id,
      suggestProgression({
        sets,
        targetSets: last.log.targetSets,
        repMin: log.targetRepMin,
        repMax: log.targetRepMax,
        incrementKg: incrementForExercise(exercise, settings),
      }),
    );
  }

  return result;
}

/** Recente persoonlijke records over alle oefeningen, voor het voortgangsoverzicht. */
export interface RecentRecord {
  exerciseId: string;
  exerciseName: string;
  date: string;
  weightKg: number;
  reps: number;
  estimatedOneRepMax: number | null;
}

export async function listRecentRecords(limit = 6): Promise<RecentRecord[]> {
  const exercises = await db.exercises.toArray();
  const records: RecentRecord[] = [];

  for (const exercise of exercises) {
    const history = await getExerciseHistory(exercise.id);
    const heaviest = history?.records.heaviestSet;
    if (!history || !heaviest) continue;

    records.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      date: heaviest.date,
      weightKg: heaviest.weightKg,
      reps: heaviest.reps,
      estimatedOneRepMax: history.records.bestEstimatedOneRepMax?.value ?? null,
    });
  }

  return records.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
