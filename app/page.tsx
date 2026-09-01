"use client";

import Link from "next/link";
import { ChevronRight, Footprints, Scale, Dumbbell } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { getWorkoutForDay } from "@/lib/data/program";
import { exerciseCount, getWeekStrip, latestWeight, maxRounds, todayStepEntry } from "@/lib/derived";
import { ProgressRing } from "@/components/ProgressRing";
import { WeekStrip } from "@/components/WeekStrip";
import { Card, Pill, SectionHeading } from "@/components/ui";
import { PageSkeleton } from "@/components/Skeleton";
import { todayIso } from "@/lib/utils";
import { useHealthMetrics } from "@/lib/useHealthMetrics";
import { mergeStepEntries, mergeWeightEntries } from "@/lib/mergeHealth";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const history = useAppStore((s) => s.workoutHistory);
  const stepEntries = useAppStore((s) => s.stepEntries);
  const weightEntries = useAppStore((s) => s.weightEntries);
  const health = useHealthMetrics();

  if (!hydrated) return <PageSkeleton />;

  const today = new Date();
  const workout = getWorkoutForDay(today.getDay());
  const todaysHistory = workout ? history.find((h) => h.date === todayIso() && h.workoutId === workout.id) : undefined;
  const mergedSteps = mergeStepEntries(stepEntries, health.rows);
  const mergedWeights = mergeWeightEntries(weightEntries, health.rows);
  const steps = todayStepEntry(mergedSteps);
  const weight = latestWeight(mergedWeights);
  const weekStrip = getWeekStrip(history, today);
  const stepPercent = steps ? Math.round((steps.steps / profile.stepGoal) * 100) : 0;

  return (
    <div className="space-y-6 px-4 pt-6 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">
          {greeting()}, {profile.name} <span aria-hidden>👋</span>
        </h1>
      </div>

      {/* Today's workout */}
      {workout && workout.type !== "rest" && workout.type !== "recovery" && (
        <Card className="overflow-hidden !p-0">
          <div className="bg-gradient-to-br from-primary to-primary-strong p-5 text-primary-foreground">
            <p className="text-xs font-medium uppercase tracking-widest opacity-80">{workout.dayLabel}</p>
            <h2 className="mt-1 text-xl font-semibold">{workout.name}</h2>
            <div className="mt-3 flex items-center gap-3 text-sm opacity-90">
              <span>{workout.duration} min</span>
              <span aria-hidden>·</span>
              <span>{exerciseCount(workout)} exercises</span>
              <span aria-hidden>·</span>
              <span>
                {maxRounds(workout)} round{maxRounds(workout) === 1 ? "" : "s"}
              </span>
            </div>
            {todaysHistory ? (
              <div className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-sm font-medium">
                ✓ Completed today · {todaysHistory.completionPercent}%
              </div>
            ) : (
              <Link
                href={`/workout/session?workoutId=${workout.id}`}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-primary-strong active:scale-[0.98]"
              >
                Start Workout
              </Link>
            )}
          </div>
        </Card>
      )}

      {workout && (workout.type === "rest" || workout.type === "recovery") && (
        <Card className="bg-accent-soft !border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{workout.dayLabel}</p>
          <h2 className="mt-1 text-xl font-semibold text-text">{workout.name}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">{workout.description}</p>
        </Card>
      )}

      {/* Today's activity */}
      <div>
        <SectionHeading>Today&apos;s Activity</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/progress/steps">
            <Card className="flex h-full items-center gap-4">
              <ProgressRing value={stepPercent} size={64} strokeWidth={7} color="primary">
                <Footprints className="h-5 w-5 text-primary" />
              </ProgressRing>
              <div>
                <p className="text-xs font-medium text-text-muted">Steps</p>
                <p className="text-lg font-semibold text-text">
                  {(steps?.steps ?? 0).toLocaleString()}{" "}
                  <span className="text-sm font-normal text-text-faint">/ {profile.stepGoal.toLocaleString()}</span>
                </p>
              </div>
            </Card>
          </Link>

          <Card className="flex h-full items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Dumbbell className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-medium text-text-muted">Workout</p>
              {todaysHistory ? (
                <Pill tone="success">Completed</Pill>
              ) : workout?.type === "rest" || workout?.type === "recovery" ? (
                <Pill tone="accent">{workout.type === "rest" ? "Rest day" : "Recovery"}</Pill>
              ) : (
                <p className="text-sm font-medium text-text-faint">Not completed</p>
              )}
            </div>
          </Card>

          <Link href="/progress/weight">
            <Card className="flex h-full items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Scale className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-medium text-text-muted">Weight</p>
                <p className="text-lg font-semibold text-text">
                  {weight ? `${weight.weightKg} kg` : "Add weight"}
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* This week */}
      <div>
        <SectionHeading>This Week</SectionHeading>
        <Card>
          <WeekStrip days={weekStrip} />
        </Card>
      </div>

      <Link href="/progress" className="flex items-center justify-between rounded-2xl px-1 py-2 text-sm font-medium text-primary">
        Weekly progress
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
