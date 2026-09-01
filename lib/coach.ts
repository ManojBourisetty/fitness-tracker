import type { StepEntry, UserProfile, WeightEntry, WorkoutHistoryEntry } from "@/lib/types";
import { getWeekDates, round1, startOfWeekIso } from "@/lib/utils";

export type WeeklyReview = {
  weekStartIso: string;
  workoutsCompleted: number;
  avgSteps: number;
  exerciseMinutes: number;
  workoutCompletionPercent: number;
  stepGoalHitDays: number;
  weightChangeKg: number | null;
  wentWell: string[];
  nextWeek: string[];
};

/**
 * Builds a plain-language weekly summary purely from tracked data --
 * no synthetic or fabricated metrics.
 */
export function buildWeeklyReview(
  profile: UserProfile,
  history: WorkoutHistoryEntry[],
  steps: StepEntry[],
  weights: WeightEntry[],
  reference: Date = new Date()
): WeeklyReview {
  const weekStartIso = startOfWeekIso(reference);
  const weekDates = getWeekDates(weekStartIso);
  const weekDateSet = new Set(weekDates);

  const weekHistory = history.filter((h) => weekDateSet.has(h.date));
  const weekSteps = steps.filter((s) => weekDateSet.has(s.date));
  const weekWeights = weights.filter((w) => weekDateSet.has(w.date)).sort((a, b) => a.date.localeCompare(b.date));

  const workoutsCompleted = weekHistory.length;
  const exerciseMinutes = Math.round(
    weekHistory.reduce((sum, h) => sum + h.durationSeconds, 0) / 60
  );
  const avgSteps = weekSteps.length
    ? Math.round(weekSteps.reduce((sum, s) => sum + s.steps, 0) / weekSteps.length)
    : 0;
  const stepGoalHitDays = weekSteps.filter((s) => s.steps >= profile.stepGoal).length;

  const workoutDaysPlanned = 5; // Mon, Wed, Fri, Sat strength/cardio + Tue walk are all "activity" days
  const workoutCompletionPercent = Math.round(
    Math.min(100, (workoutsCompleted / workoutDaysPlanned) * 100)
  );

  let weightChangeKg: number | null = null;
  if (weekWeights.length >= 2) {
    weightChangeKg = round1(
      weekWeights[weekWeights.length - 1].weightKg - weekWeights[0].weightKg
    );
  }

  const wentWell: string[] = [];
  const nextWeek: string[] = [];

  if (workoutsCompleted >= 4) {
    wentWell.push("You were consistent with your workouts this week.");
  } else if (workoutsCompleted >= 1) {
    wentWell.push(`You completed ${workoutsCompleted} workout${workoutsCompleted === 1 ? "" : "s"} -- every session counts.`);
  }

  if (stepGoalHitDays >= 4) {
    wentWell.push(`You hit your step goal on ${stepGoalHitDays} days.`);
  }

  if (weightChangeKg !== null && weightChangeKg < 0) {
    wentWell.push("Your weight trend moved in a healthy downward direction.");
  }

  if (wentWell.length === 0) {
    wentWell.push("You showed up and logged data -- that visibility is what makes next week easier.");
  }

  if (workoutsCompleted === 0) {
    nextWeek.push("Aim for at least 2-3 short sessions next week to rebuild momentum.");
  } else if (workoutsCompleted < 4) {
    nextWeek.push("Try adding one more session next week if your schedule allows.");
  } else {
    nextWeek.push("Keep strength volume similar and consider a slightly longer walk on Tuesday or Saturday.");
  }

  if (avgSteps > 0 && avgSteps < profile.stepGoal) {
    nextWeek.push(`Average steps were ${avgSteps.toLocaleString()}/day, just under your ${profile.stepGoal.toLocaleString()} goal -- a short evening walk can close that gap.`);
  }

  return {
    weekStartIso,
    workoutsCompleted,
    avgSteps,
    exerciseMinutes,
    workoutCompletionPercent,
    stepGoalHitDays,
    weightChangeKg,
    wentWell,
    nextWeek,
  };
}
