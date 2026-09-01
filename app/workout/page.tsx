"use client";

import { useState } from "react";
import Link from "next/link";
import { weeklyProgram } from "@/lib/data/program";
import { getExercise } from "@/lib/data/exercises";
import { exerciseCount, maxRounds } from "@/lib/derived";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { ExerciseFigure } from "@/components/ExerciseFigure";
import { Card, Pill, SectionHeading } from "@/components/ui";
import { PageSkeleton } from "@/components/Skeleton";
import { formatDuration, todayIso } from "@/lib/utils";

export default function WorkoutPage() {
  const hydrated = useHasHydrated();
  const history = useAppStore((s) => s.workoutHistory);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDay());

  if (!hydrated) return <PageSkeleton />;

  const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const workout = weeklyProgram.find((w) => w.day === selectedDay)!;
  const isToday = selectedDay === today.getDay();
  const completedToday = isToday && history.some((h) => h.date === todayIso() && h.workoutId === workout.id);
  const isRestType = workout.type === "rest" || workout.type === "recovery";

  return (
    <div className="space-y-5 px-4 pt-6 md:px-6">
      <h1 className="text-2xl font-semibold text-text">This Week&apos;s Plan</h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {orderedDays.map((day) => {
          const w = weeklyProgram.find((x) => x.day === day)!;
          const active = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground" : "bg-bg-elevated text-text-muted border border-border"
              }`}
            >
              <span>{w.dayLabel.slice(0, 3)}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary-foreground" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{workout.dayLabel}</p>
            <h2 className="mt-1 text-xl font-semibold text-text">{workout.name}</h2>
          </div>
          {completedToday && <Pill tone="success">Completed</Pill>}
        </div>
        <p className="mt-2 text-sm text-text-muted">{workout.description}</p>
        {workout.notes && <p className="mt-2 text-xs text-text-faint">{workout.notes}</p>}

        {!isRestType && (
          <div className="mt-4 flex items-center gap-3 text-sm text-text-muted">
            <span>{workout.duration} min</span>
            <span aria-hidden>·</span>
            <span>{exerciseCount(workout)} exercises</span>
            <span aria-hidden>·</span>
            <span>
              {maxRounds(workout)} round{maxRounds(workout) === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {!isRestType && (
          <Link
            href={`/workout/session?workoutId=${workout.id}`}
            className="mt-5 flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
          >
            {completedToday ? "Do it again" : isToday ? "Start Workout" : `Start ${workout.dayLabel}'s Workout`}
          </Link>
        )}
      </Card>

      {!isRestType &&
        workout.sections.map((section) => (
          <div key={section.title}>
            <SectionHeading>
              {section.title}
              {section.rounds > 1 ? ` · ${section.rounds} rounds` : ""}
            </SectionHeading>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const ex = getExercise(item.exerciseId);
                if (!ex) return null;
                return (
                  <Link
                    key={`${item.exerciseId}-${i}`}
                    href={`/exercises/${ex.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-bg-elevated p-3"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg-subtle">
                      <ExerciseFigure pattern={ex.animation} equipment={ex.equipment} title={ex.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">{ex.name}</p>
                      <p className="text-xs text-text-muted">
                        {item.sets > 1 ? `${item.sets} × ` : ""}
                        {item.reps ? `${item.reps} reps` : item.duration ? formatDuration(item.duration) : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
