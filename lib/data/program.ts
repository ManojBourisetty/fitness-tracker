import type { Workout } from "@/lib/types";

// Weeks 1-2 baseline program. Day numbers match Date#getDay() (0 = Sunday).
// Progressive variants are derived from this in lib/progression.ts --
// this file stays the single "week 1" source of truth.
export const weeklyProgram: Workout[] = [
  {
    id: "mon-full-body-a",
    day: 1,
    dayLabel: "Monday",
    name: "Full Body A",
    type: "strength",
    duration: 30,
    description: "A gentle full-body strength session using just your bodyweight and a chair.",
    sections: [
      {
        title: "Warm-up",
        rounds: 1,
        items: [
          { exerciseId: "march-in-place", sets: 1, duration: 60 },
          { exerciseId: "arm-circles", sets: 1, duration: 30 },
          { exerciseId: "hip-circles", sets: 1, duration: 30 },
          { exerciseId: "ankle-circles", sets: 1, duration: 30 },
          { exerciseId: "march-in-place", sets: 1, duration: 120 },
        ],
      },
      {
        title: "Main Workout",
        rounds: 2,
        items: [
          { exerciseId: "chair-squat", sets: 1, reps: 10, restSeconds: 45 },
          { exerciseId: "wall-pushup", sets: 1, reps: 12, restSeconds: 45 },
          { exerciseId: "glute-bridge", sets: 1, reps: 12, restSeconds: 45 },
          { exerciseId: "standing-knee-raise", sets: 1, reps: 10, restSeconds: 45 },
          { exerciseId: "bird-dog", sets: 1, reps: 6, restSeconds: 45 },
          { exerciseId: "standing-calf-raise", sets: 1, reps: 15, restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "tue-walk-mobility",
    day: 2,
    dayLabel: "Tuesday",
    name: "Walking + Mobility",
    type: "walk",
    duration: 30,
    description: "An easy walk followed by gentle mobility work. This counts as your activity for the day.",
    sections: [
      {
        title: "Walk",
        rounds: 1,
        items: [{ exerciseId: "march-with-arms", sets: 1, duration: 1500 }],
      },
      {
        title: "Mobility",
        rounds: 1,
        items: [{ exerciseId: "gentle-mobility", sets: 1, duration: 300 }],
      },
    ],
    notes: "Swap the marching block for a comfortable 20-30 minute walk outside if you can.",
  },
  {
    id: "wed-full-body-b",
    day: 3,
    dayLabel: "Wednesday",
    name: "Full Body B",
    type: "strength",
    duration: 30,
    description: "A second full-body session with floor-free alternatives available for every move.",
    sections: [
      {
        title: "Warm-up",
        rounds: 1,
        items: [
          { exerciseId: "march-in-place", sets: 1, duration: 60 },
          { exerciseId: "hip-circles", sets: 1, duration: 30 },
          { exerciseId: "ankle-circles", sets: 1, duration: 30 },
        ],
      },
      {
        title: "Main Workout",
        rounds: 2,
        items: [
          { exerciseId: "sit-to-stand", sets: 1, reps: 10, restSeconds: 45 },
          { exerciseId: "wall-pushup", sets: 1, reps: 12, restSeconds: 45 },
          { exerciseId: "standing-hip-extension", sets: 1, reps: 10, restSeconds: 45 },
          { exerciseId: "glute-bridge", sets: 1, reps: 15, restSeconds: 45 },
          { exerciseId: "standing-calf-raise", sets: 1, reps: 15, restSeconds: 45 },
          { exerciseId: "dead-bug", sets: 1, reps: 6, restSeconds: 60 },
        ],
      },
    ],
    notes: "Getting onto the floor for Dead Bug? Try Standing Knee Raise instead, holding a counter for balance.",
  },
  {
    id: "thu-recovery",
    day: 4,
    dayLabel: "Thursday",
    name: "Recovery Day",
    type: "recovery",
    duration: 0,
    description: "No formal workout today. Recommended: short walking breaks, gentle stretching, and normal daily movement.",
    sections: [],
  },
  {
    id: "fri-low-impact-cardio",
    day: 5,
    dayLabel: "Friday",
    name: "Low-Impact Cardio",
    type: "cardio",
    duration: 22,
    description: "A no-jumping cardio circuit: 40 seconds of work, 20 seconds of rest, for 3-4 rounds.",
    sections: [
      {
        title: "Circuit",
        rounds: 3,
        items: [
          { exerciseId: "march-in-place", sets: 1, duration: 40, restSeconds: 20 },
          { exerciseId: "side-to-side-step", sets: 1, duration: 40, restSeconds: 20 },
          { exerciseId: "step-touch", sets: 1, duration: 40, restSeconds: 20 },
          { exerciseId: "alternating-knee-raise", sets: 1, duration: 40, restSeconds: 20 },
          { exerciseId: "march-with-arms", sets: 1, duration: 40, restSeconds: 20 },
        ],
      },
    ],
    notes: "No jumping required. Repeat the 5-move circuit 3-4 times based on how you feel.",
  },
  {
    id: "sat-full-body-walk",
    day: 6,
    dayLabel: "Saturday",
    name: "Full Body + Walk",
    type: "strength",
    duration: 35,
    description: "Strength circuit followed by an easy walk.",
    sections: [
      {
        title: "Strength",
        rounds: 2,
        items: [
          { exerciseId: "chair-squat", sets: 1, reps: 10, restSeconds: 45 },
          { exerciseId: "wall-pushup", sets: 1, reps: 10, restSeconds: 45 },
          { exerciseId: "glute-bridge", sets: 1, reps: 12, restSeconds: 45 },
          { exerciseId: "bird-dog", sets: 1, reps: 6, restSeconds: 45 },
          { exerciseId: "standing-calf-raise", sets: 1, reps: 15, restSeconds: 45 },
          { exerciseId: "standing-knee-raise", sets: 1, reps: 10, restSeconds: 45 },
        ],
      },
      {
        title: "Walk",
        rounds: 1,
        items: [{ exerciseId: "march-with-arms", sets: 1, duration: 1050 }],
      },
    ],
    notes: "Finish with a 15-20 minute easy walk outside if the weather allows.",
  },
  {
    id: "sun-rest",
    day: 0,
    dayLabel: "Sunday",
    name: "Rest & Recovery",
    type: "rest",
    duration: 0,
    description: "A full rest day. An optional gentle walk is welcome, but nothing is required today.",
    sections: [],
  },
];

export function getWorkoutForDay(day: number): Workout | undefined {
  return weeklyProgram.find((w) => w.day === day);
}

export function getWorkoutById(id: string): Workout | undefined {
  return weeklyProgram.find((w) => w.id === id);
}

/** Total number of discrete "steps" (exercise x round) in a workout, used for progress bars. */
export function countWorkoutSteps(workout: Workout): number {
  return workout.sections.reduce((sum, section) => sum + section.items.length * section.rounds, 0);
}
