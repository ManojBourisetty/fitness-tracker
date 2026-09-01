"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Info } from "lucide-react";
import { getExercise } from "@/lib/data/exercises";
import { ExerciseFigure } from "@/components/ExerciseFigure";
import { Card, Pill } from "@/components/ui";

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const exercise = getExercise(params.id);

  if (!exercise) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="font-semibold text-text">Exercise not found</p>
        <Link href="/exercises" className="mt-3 inline-block text-sm font-medium text-primary">
          Back to Exercise Library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-4 pb-8 md:px-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm font-medium text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text">{exercise.name}</h1>
        <Pill tone="neutral">{exercise.category}</Pill>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="aspect-[4/3] w-full bg-primary-soft p-4">
          <ExerciseFigure pattern={exercise.animation} equipment={exercise.equipment} title={exercise.name} className="h-full w-full" />
        </div>
      </Card>

      <p className="text-center text-lg font-semibold text-text">
        {exercise.reps ? `2 × ${exercise.reps} reps` : exercise.duration ? `${exercise.duration}s` : ""}
      </p>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-text">How to perform</h2>
        <ol className="space-y-2">
          {exercise.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-text-muted">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {exercise.modification && (
        <Card className="flex gap-3 bg-primary-soft !border-none">
          <Info className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">Beginner modification</p>
            <p className="mt-0.5 text-sm text-text">{exercise.modification}</p>
          </div>
        </Card>
      )}

      {exercise.commonMistakes.length > 0 && (
        <Card className="flex gap-3 bg-accent-soft !border-none">
          <AlertCircle className="h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-semibold text-accent">Common mistakes</p>
            <ul className="mt-1 space-y-1 text-sm text-text">
              {exercise.commonMistakes.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Link
        href={`/workout/session?solo=${exercise.id}`}
        className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground active:scale-[0.98]"
      >
        Practice This Move
      </Link>
    </div>
  );
}
