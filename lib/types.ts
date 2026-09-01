// Core data model for the fitness tracker.
// Nothing here should be hard-coded into UI components -- pages read from
// lib/data and lib/store instead, so new programs/exercises are pure data changes.

export type AnimationPattern =
  | "march"
  | "march-arms"
  | "arm-circle"
  | "hip-circle"
  | "ankle-circle"
  | "squat"
  | "wall-pushup"
  | "bridge"
  | "knee-raise"
  | "bird-dog"
  | "calf-raise"
  | "hip-extension"
  | "dead-bug"
  | "side-step"
  | "step-touch"
  | "mobility"
  | "walk"
  | "rest";

export type ExerciseCategory =
  | "warmup"
  | "strength"
  | "cardio"
  | "mobility"
  | "core";

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  /** 1 (very easy) - 5 (advanced). The initial program only uses 1-2. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  equipment: string[];
  instructions: string[];
  commonMistakes: string[];
  modification?: string;
  /** Default target reps, when the exercise is rep-based. */
  reps?: number;
  /** Default target duration in seconds, when the exercise is time-based. */
  duration?: number;
  animation: AnimationPattern;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps?: number;
  duration?: number;
  /** Rest in seconds after this exercise. 0/undefined = no rest screen. */
  restSeconds?: number;
};

export type WorkoutSection = {
  title: string;
  rounds: number;
  items: WorkoutExercise[];
};

export type WorkoutType = "strength" | "cardio" | "walk" | "recovery" | "rest";

export type Workout = {
  id: string;
  /** 0 = Sunday ... 6 = Saturday, matches Date#getDay() */
  day: number;
  dayLabel: string;
  name: string;
  type: WorkoutType;
  duration: number;
  sections: WorkoutSection[];
  description?: string;
  notes?: string;
};

export type UserProfile = {
  name: string;
  heightCm: number;
  startingWeightKg: number;
  environment: "home" | "gym" | "outdoor";
  equipment: string[];
  experience: "beginner" | "intermediate" | "advanced";
  primaryGoal: string;
  workoutPreference: string;
  stepGoal: number;
  programStartDate: string; // ISO date
  theme: "light" | "dark" | "system";
};

export type DataSource = "manual" | "apple-health";

export type WeightEntry = {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  weightKg: number;
  note?: string;
  source: DataSource;
  createdAt: string;
};

export type StepEntry = {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  steps: number;
  distanceKm?: number;
  durationMin?: number;
  source: DataSource;
  createdAt: string;
};

export type CompletedExerciseLog = {
  exerciseId: string;
  setsCompleted: number;
  targetSets: number;
};

export type WorkoutHistoryEntry = {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string; // ISO date
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  roundsCompleted: number;
  roundsTotal: number;
  completionPercent: number;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  exerciseLog: CompletedExerciseLog[];
};

/** In-progress workout session, persisted so a refresh/close doesn't lose state. */
export type ActiveWorkoutSession = {
  workoutId: string;
  startedAt: string;
  /** Index into the workout's flattened (section x round x exercise) step list. */
  stepIndex: number;
  status: "active" | "resting" | "paused";
  restEndsAt?: string;
  /** Exercise ids skipped so far this session, for the completion summary. */
  skipped: string[];
};
