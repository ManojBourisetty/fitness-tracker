import type { Workout } from "@/lib/types";

export type WorkoutStep = {
  sectionTitle: string;
  sectionIndex: number;
  round: number;
  roundsTotal: number;
  exerciseId: string;
  reps?: number;
  duration?: number;
  restSeconds?: number;
  isLastOfExerciseAcrossWorkout: boolean;
};

/** Flattens a workout's sections x rounds x exercises into a single ordered step list. */
export function flattenWorkout(workout: Workout): WorkoutStep[] {
  const steps: WorkoutStep[] = [];
  workout.sections.forEach((section, sectionIndex) => {
    for (let round = 1; round <= section.rounds; round++) {
      section.items.forEach((item) => {
        steps.push({
          sectionTitle: section.title,
          sectionIndex,
          round,
          roundsTotal: section.rounds,
          exerciseId: item.exerciseId,
          reps: item.reps,
          duration: item.duration,
          restSeconds: item.restSeconds,
          isLastOfExerciseAcrossWorkout: false,
        });
      });
    }
  });
  return steps;
}

export function countUniqueExercises(workout: Workout): number {
  const ids = new Set<string>();
  workout.sections.forEach((s) => s.items.forEach((i) => ids.add(i.exerciseId)));
  return ids.size;
}
