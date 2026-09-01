"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, History } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { getExercise } from "@/lib/data/exercises";
import { Card, Pill } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/Skeleton";
import { formatDuration, formatShortDate } from "@/lib/utils";

export default function HistoryPage() {
  const hydrated = useHasHydrated();
  const history = useAppStore((s) => s.workoutHistory);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!hydrated) return <PageSkeleton />;

  return (
    <div className="space-y-5 px-4 pt-4 pb-8 md:px-6">
      <Link href="/progress" className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <ChevronLeft className="h-4 w-4" /> Progress
      </Link>
      <h1 className="text-2xl font-semibold text-text">Workout History</h1>

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="Your first workout is waiting"
          description="Completed workouts will show up here, so you can look back on your progress."
          actionLabel="Start Workout"
          actionHref="/workout"
        />
      ) : (
        <div className="space-y-2">
          {history.map((h) => {
            const open = openId === h.id;
            return (
              <Card key={h.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : h.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  aria-expanded={open}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{h.workoutName}</p>
                    <p className="text-xs text-text-muted">
                      {formatShortDate(h.date)} · {formatDuration(h.durationSeconds)} · {h.exercisesCompleted}/{h.exercisesTotal} exercises
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Pill tone={h.completionPercent >= 80 ? "success" : "neutral"}>{h.completionPercent}%</Pill>
                    <ChevronDown className={`h-4 w-4 text-text-faint transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {open && (
                  <div className="border-t border-border px-4 py-3">
                    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span>Rounds: {h.roundsCompleted}/{h.roundsTotal}</span>
                      {h.difficulty && <span>Difficulty: {h.difficulty}/5</span>}
                    </div>
                    <ul className="space-y-1">
                      {h.exerciseLog.map((log) => {
                        const ex = getExercise(log.exerciseId);
                        return (
                          <li key={log.exerciseId} className="flex items-center justify-between text-sm text-text">
                            <span>{ex?.name ?? log.exerciseId}</span>
                            <span className="text-text-faint">
                              {log.setsCompleted}/{log.targetSets} sets
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {h.notes && (
                      <p className="mt-2 rounded-lg bg-bg-subtle p-2 text-sm text-text-muted">&ldquo;{h.notes}&rdquo;</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
