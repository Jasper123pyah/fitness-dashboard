import type { Exercise, SetLog } from "@/db/types";

/**
 * Geschatte 1RM volgens Epley. Alleen zinvol bij oefeningen met een duidelijke
 * externe belasting en bij series tot ongeveer 12 herhalingen; daarboven wordt
 * de schatting snel onbetrouwbaar.
 */
export function estimateOneRepMax(
  weightKg: number,
  reps: number,
): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return null;
  if (weightKg <= 0 || reps <= 0) return null;
  if (reps > 12) return null;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export function canEstimateOneRepMax(
  exercise: Pick<Exercise, "supportsOneRepMax">,
): boolean {
  return exercise.supportsOneRepMax;
}

export interface CompletedSet {
  weightKg: number;
  reps: number;
}

export function completedWorkingSets(sets: SetLog[]): CompletedSet[] {
  return sets
    .filter((set) => set.completed && !set.isWarmup)
    .filter((set) => set.weightKg != null && set.reps != null && set.reps > 0)
    .map((set) => ({
      weightKg: set.weightKg as number,
      reps: set.reps as number,
    }));
}

export type ProgressionAdvice =
  | {
      kind: "increase";
      suggestedWeightKg: number;
      incrementKg: number;
      reason: string;
    }
  | { kind: "hold"; reason: string }
  | { kind: "reduce"; suggestedWeightKg: number; reason: string }
  | { kind: "unknown"; reason: string };

export interface ProgressionInput {
  sets: CompletedSet[];
  targetSets: number;
  repMin: number;
  repMax: number;
  /** Gewichtsstap die bij deze oefening past (bijv. 2,5 kg of 1,25 kg). */
  incrementKg: number;
}

/**
 * Advies voor de volgende sessie, op basis van wat er werkelijk is gehaald.
 *
 * - alle voorgeschreven werksets op of boven de bovengrens van het repbereik en
 *   met hetzelfde gewicht: verhoog het gewicht met één stap en begin weer
 *   onderaan het repbereik;
 * - zit je nog in het bereik: hetzelfde gewicht, probeer een rep extra;
 * - haal je de ondergrens niet in de meeste sets: verlaag het gewicht iets.
 *
 * Het advies verandert nooit zelf een gewicht; de gebruiker beslist.
 */
export function suggestProgression(input: ProgressionInput): ProgressionAdvice {
  const { sets, targetSets, repMin, repMax, incrementKg } = input;

  if (sets.length === 0) {
    return {
      kind: "unknown",
      reason: "Nog geen afgeronde sets voor deze oefening.",
    };
  }

  const topWeight = Math.max(...sets.map((set) => set.weightKg));
  const setsAtTopWeight = sets.filter((set) => set.weightKg === topWeight);

  const allPrescribedSetsDone = setsAtTopWeight.length >= targetSets;
  const everySetHitTop = setsAtTopWeight.every((set) => set.reps >= repMax);

  if (allPrescribedSetsDone && everySetHitTop) {
    return {
      kind: "increase",
      suggestedWeightKg: Math.round((topWeight + incrementKg) * 100) / 100,
      incrementKg,
      reason: `Alle ${targetSets} sets op ${formatKg(topWeight)} met ${repMax}+ reps gehaald.`,
    };
  }

  const belowMinimum = setsAtTopWeight.filter((set) => set.reps < repMin);
  if (
    belowMinimum.length > setsAtTopWeight.length / 2 &&
    setsAtTopWeight.length >= 2
  ) {
    const reduced = Math.max(
      0,
      Math.round((topWeight - incrementKg) * 100) / 100,
    );
    return {
      kind: "reduce",
      suggestedWeightKg: reduced,
      reason: `Meerdere sets onder ${repMin} reps; iets lichter geeft weer schone sets.`,
    };
  }

  const bestReps = Math.max(...setsAtTopWeight.map((set) => set.reps));
  return {
    kind: "hold",
    reason: `Blijf op ${formatKg(topWeight)} en probeer ${Math.min(bestReps + 1, repMax)} reps per set.`,
  };
}

function formatKg(value: number): string {
  return `${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 }).format(value)} kg`;
}

/** Welke gewichtsstap past bij deze oefening. */
export function incrementForExercise(
  exercise: Pick<Exercise, "category" | "equipment">,
  settings: { compoundIncrementKg: number; isolationIncrementKg: number },
): number {
  return exercise.category === "COMPOUND"
    ? settings.compoundIncrementKg
    : settings.isolationIncrementKg;
}

export interface PersonalRecords {
  heaviestSet: { weightKg: number; reps: number; date: string } | null;
  bestEstimatedOneRepMax: {
    value: number;
    weightKg: number;
    reps: number;
    date: string;
  } | null;
  bestVolumeSession: { volumeKg: number; date: string } | null;
  bestRepsAtTopWeight: { weightKg: number; reps: number; date: string } | null;
}

export interface SessionPerformance {
  date: string;
  sets: CompletedSet[];
}

export function personalRecords(
  sessions: SessionPerformance[],
  options: { supportsOneRepMax: boolean },
): PersonalRecords {
  let heaviestSet: PersonalRecords["heaviestSet"] = null;
  let bestOneRm: PersonalRecords["bestEstimatedOneRepMax"] = null;
  let bestVolume: PersonalRecords["bestVolumeSession"] = null;

  for (const session of sessions) {
    let volume = 0;

    for (const set of session.sets) {
      volume += set.weightKg * set.reps;

      if (
        !heaviestSet ||
        set.weightKg > heaviestSet.weightKg ||
        (set.weightKg === heaviestSet.weightKg && set.reps > heaviestSet.reps)
      ) {
        heaviestSet = {
          weightKg: set.weightKg,
          reps: set.reps,
          date: session.date,
        };
      }

      if (options.supportsOneRepMax) {
        const estimate = estimateOneRepMax(set.weightKg, set.reps);
        if (estimate != null && (!bestOneRm || estimate > bestOneRm.value)) {
          bestOneRm = {
            value: estimate,
            weightKg: set.weightKg,
            reps: set.reps,
            date: session.date,
          };
        }
      }
    }

    if (volume > 0 && (!bestVolume || volume > bestVolume.volumeKg)) {
      bestVolume = { volumeKg: Math.round(volume), date: session.date };
    }
  }

  const bestRepsAtTopWeight = heaviestSet
    ? (sessions
        .flatMap((session) =>
          session.sets
            .filter((set) => set.weightKg === heaviestSet!.weightKg)
            .map((set) => ({
              weightKg: set.weightKg,
              reps: set.reps,
              date: session.date,
            })),
        )
        .sort((a, b) => b.reps - a.reps)[0] ?? null)
    : null;

  return {
    heaviestSet,
    bestEstimatedOneRepMax: options.supportsOneRepMax ? bestOneRm : null,
    bestVolumeSession: bestVolume,
    bestRepsAtTopWeight,
  };
}

/** Totaal getild gewicht in een sessie (sets × gewicht × reps). */
export function sessionVolume(sets: CompletedSet[]): number {
  return Math.round(
    sets.reduce((total, set) => total + set.weightKg * set.reps, 0),
  );
}
