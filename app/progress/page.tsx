"use client";

import Link from "next/link";
import { ChevronRight, HeartPulse } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { buildWeeklyReview } from "@/lib/coach";
import { getWeekDates, round1, startOfWeekIso } from "@/lib/utils";
import { Card, BarMeter, SectionHeading } from "@/components/ui";
import { PageSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";

export default function ProgressPage() {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const history = useAppStore((s) => s.workoutHistory);
  const stepEntries = useAppStore((s) => s.stepEntries);
  const weightEntries = useAppStore((s) => s.weightEntries);

  if (!hydrated) return <PageSkeleton />;

  const hasAnyData = history.length > 0 || stepEntries.length > 0 || weightEntries.length > 0;
  const review = buildWeeklyReview(profile, history, stepEntries, weightEntries);

  const weekDates = getWeekDates(startOfWeekIso());
  const weekSteps = stepEntries.filter((s) => weekDates.includes(s.date));
  const weekWeights = weightEntries.filter((w) => weekDates.includes(w.date)).sort((a, b) => a.date.localeCompare(b.date));
  const walkingSessions = history.filter((h) => weekDates.includes(h.date) && h.workoutName.toLowerCase().includes("walk")).length;

  const stepGoalPercent = weekSteps.length
    ? Math.round((weekSteps.filter((s) => s.steps >= profile.stepGoal).length / 7) * 100)
    : 0;

  return (
    <div className="space-y-6 px-4 pt-6 md:px-6">
      <h1 className="text-2xl font-semibold text-text">Weekly Progress</h1>

      {!hasAnyData ? (
        <EmptyState
          icon={HeartPulse}
          title="No activity yet this week"
          description="Complete a workout or log your steps and weight to see your progress here."
          actionLabel="Start a Workout"
          actionHref="/workout"
        />
      ) : (
        <>
          <div>
            <SectionHeading>Activity</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Avg steps/day" value={review.avgSteps.toLocaleString()} />
              <StatCard label="Exercise minutes" value={`${review.exerciseMinutes} min`} />
              <StatCard label="Workout sessions" value={`${review.workoutsCompleted}`} />
              <StatCard label="Walking sessions" value={`${walkingSessions}`} />
            </div>
          </div>

          <div>
            <SectionHeading>Fitness</SectionHeading>
            <Card className="text-center text-sm text-text-muted">
              <p>Resting heart rate, walking heart rate, and VO₂ max will appear here once available.</p>
              <p className="mt-2 text-xs text-text-faint">These metrics require Apple Health or a wearable — see Profile for sync status.</p>
            </Card>
          </div>

          <div>
            <SectionHeading
              action={
                <Link href="/progress/weight" className="text-xs font-semibold text-primary">
                  Details
                </Link>
              }
            >
              Weight
            </SectionHeading>
            <Card>
              {weekWeights.length === 0 ? (
                <p className="text-sm text-text-muted">No weight logged this week yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-text-muted">Start</p>
                    <p className="font-semibold text-text">{weekWeights[0].weightKg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Now</p>
                    <p className="font-semibold text-text">{weekWeights.at(-1)!.weightKg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Change</p>
                    <p className={`font-semibold ${review.weightChangeKg && review.weightChangeKg < 0 ? "text-success" : "text-text"}`}>
                      {review.weightChangeKg != null
                        ? `${review.weightChangeKg > 0 ? "+" : ""}${round1(review.weightChangeKg)} kg`
                        : "—"}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div>
            <SectionHeading>Consistency</SectionHeading>
            <Card className="space-y-4">
              <BarMeter value={review.workoutCompletionPercent} label="Workout completion" />
              <BarMeter value={stepGoalPercent} label="Step target" color="accent" />
            </Card>
          </div>

          <div>
            <SectionHeading>Your Week</SectionHeading>
            <Card>
              <p className="font-semibold text-text">
                {review.workoutsCompleted} workout{review.workoutsCompleted === 1 ? "" : "s"} completed
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Average steps: {review.avgSteps.toLocaleString()}/day · Exercise time: {review.exerciseMinutes} min ·
                Completion: {review.workoutCompletionPercent}%
              </p>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">What went well</p>
                <ul className="mt-1.5 space-y-1 text-sm text-text">
                  {review.wentWell.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next week</p>
                <ul className="mt-1.5 space-y-1 text-sm text-text">
                  {review.nextWeek.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </>
      )}

      <Link href="/progress/history" className="flex items-center justify-between rounded-2xl px-1 py-2 text-sm font-medium text-primary">
        Workout History
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text">{value}</p>
    </Card>
  );
}
