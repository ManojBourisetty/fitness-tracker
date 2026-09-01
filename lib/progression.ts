import type { Workout, WorkoutHistoryEntry, WorkoutSection } from "@/lib/types";
import { daysAgoIso, round1 } from "@/lib/utils";

export type ProgressionLevel = "foundation" | "building" | "advancing";

export type ProgressionResult = {
  level: ProgressionLevel;
  label: string;
  message: string;
  /** Multiplier applied to each strength/cardio section's round count. */
  roundMultiplier: number;
  /** Extra reps added per rep-based exercise (bounded, gentle). */
  repBonus: number;
};

/**
 * Adherence-driven progression. Reads only real tracked history:
 * - Consistent completion + moderate-or-easier difficulty -> advance.
 * - High reported difficulty (4-5) -> hold steady.
 * - Completion dropping -> ease back, never increase workload.
 */
export function getProgression(
  history: WorkoutHistoryEntry[],
  programStartDate: string
): ProgressionResult {
  const weeksSinceStart = Math.max(
    0,
    Math.floor((Date.now() - new Date(programStartDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
  );

  const twoWeeksAgo = daysAgoIso(14);
  const recent = history.filter((h) => h.date >= twoWeeksAgo);

  if (weeksSinceStart < 2 || recent.length < 3) {
    return {
      level: "foundation",
      label: "Building the habit",
      message: "Focus on showing up and learning good form. Volume will increase once a consistent routine is in place.",
      roundMultiplier: 1,
      repBonus: 0,
    };
  }

  const avgCompletion = recent.reduce((s, h) => s + h.completionPercent, 0) / recent.length;
  const rated = recent.filter((h) => h.difficulty != null);
  const avgDifficulty = rated.length
    ? rated.reduce((s, h) => s + (h.difficulty ?? 3), 0) / rated.length
    : 3;

  if (avgCompletion < 60) {
    return {
      level: "foundation",
      label: "Easing back in",
      message: "Recent completion has dipped, so this week stays at baseline volume. Consistency first, intensity later.",
      roundMultiplier: 1,
      repBonus: 0,
    };
  }

  if (avgCompletion >= 80 && avgDifficulty <= 3) {
    const level: ProgressionLevel = weeksSinceStart >= 4 ? "advancing" : "building";
    return {
      level,
      label: level === "advancing" ? "Progressing well" : "Ready for a bit more",
      message:
        level === "advancing"
          ? "Workouts have felt manageable and consistent, so reps and rounds are nudged up this week."
          : "Consistent completion at a comfortable difficulty. A small rep increase is added this week.",
      roundMultiplier: level === "advancing" ? 1.25 : 1,
      repBonus: level === "advancing" ? 2 : 1,
    };
  }

  return {
    level: "building",
    label: "Steady pace",
    message: "Holding volume steady this week to let your body adapt before the next increase.",
    roundMultiplier: 1,
    repBonus: 0,
  };
}

/** Applies a progression result to a workout's sections without mutating the source data. */
export function applyProgression(workout: Workout, progression: ProgressionResult): Workout {
  if (progression.roundMultiplier === 1 && progression.repBonus === 0) return workout;

  const sections: WorkoutSection[] = workout.sections.map((section) => {
    if (section.title === "Warm-up" || section.title === "Mobility" || section.title === "Walk") {
      return section;
    }
    return {
      ...section,
      rounds: Math.max(1, Math.round(section.rounds * progression.roundMultiplier)),
      items: section.items.map((item) =>
        item.reps
          ? { ...item, reps: item.reps + progression.repBonus }
          : item
      ),
    };
  });

  return { ...workout, sections };
}

export function estimateCalories(durationSeconds: number, bodyWeightKg: number, intensity: "low" | "moderate"): number {
  // Rough MET-based estimate for low-impact bodyweight/cardio work (MET ~3.0-4.0).
  const met = intensity === "moderate" ? 4 : 3;
  const hours = durationSeconds / 3600;
  return Math.round(met * bodyWeightKg * hours);
}

export function roundToTenth(n: number): number {
  return round1(n);
}
