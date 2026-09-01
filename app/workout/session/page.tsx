"use client";

import { Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Minus, Pause, Play, Plus, SkipForward, X } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { getWorkoutById } from "@/lib/data/program";
import { getExercise } from "@/lib/data/exercises";
import { flattenWorkout, countUniqueExercises } from "@/lib/workoutSteps";
import { ExerciseFigure } from "@/components/ExerciseFigure";
import { RestTimer } from "@/components/RestTimer";
import { SafetyModal } from "@/components/SafetyModal";
import { PageSkeleton } from "@/components/Skeleton";
import { formatClock, todayIso } from "@/lib/utils";
import { estimateCalories } from "@/lib/progression";
import type { CompletedExerciseLog, Workout } from "@/lib/types";

export default function WorkoutSessionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SessionInner />
    </Suspense>
  );
}

function SessionInner() {
  const hydrated = useHasHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workoutIdParam = searchParams.get("workoutId");
  const soloParam = searchParams.get("solo");

  const session = useAppStore((s) => s.activeSession);
  const startSession = useAppStore((s) => s.startSession);
  const updateSession = useAppStore((s) => s.updateSession);
  const clearSession = useAppStore((s) => s.clearSession);
  const addWorkoutHistory = useAppStore((s) => s.addWorkoutHistory);
  const latestWeight = useAppStore((s) => s.weightEntries.at(-1)?.weightKg ?? s.profile.startingWeightKg);

  const [showExit, setShowExit] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const exerciseLogRef = useRef<Map<string, number>>(new Map());

  const soloExercise = soloParam ? getExercise(soloParam) : undefined;
  const soloWorkout: Workout | undefined = soloExercise
    ? {
        id: `solo-${soloExercise.id}`,
        day: -1,
        dayLabel: "Practice",
        name: soloExercise.name,
        type: "strength",
        duration: 1,
        sections: [
          {
            title: "Practice",
            rounds: 1,
            items: [{ exerciseId: soloExercise.id, sets: 1, reps: soloExercise.reps, duration: soloExercise.duration }],
          },
        ],
      }
    : undefined;

  const activeWorkoutId = session?.workoutId ?? workoutIdParam ?? soloWorkout?.id ?? undefined;
  const workout = useMemo(
    () => (soloWorkout && activeWorkoutId === soloWorkout.id ? soloWorkout : activeWorkoutId ? getWorkoutById(activeWorkoutId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeWorkoutId]
  );
  const steps = useMemo(() => (workout ? flattenWorkout(workout) : []), [workout]);

  // Initialize a session if one isn't already active.
  useEffect(() => {
    if (!hydrated || !workout) return;
    if (!session) {
      startSession({
        workoutId: workout.id,
        startedAt: new Date().toISOString(),
        stepIndex: 0,
        status: "active",
        skipped: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, workout?.id]);

  const stepIndex = session?.stepIndex ?? 0;
  const currentStep = steps[stepIndex];
  const nextStep = steps[stepIndex + 1];
  const exercise = currentStep ? getExercise(currentStep.exerciseId) : undefined;
  const nextExercise = nextStep ? getExercise(nextStep.exerciseId) : undefined;

  if (!hydrated) return <PageSkeleton />;

  if (!workout || steps.length === 0) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="text-lg font-semibold text-text">No active workout</p>
        <p className="mt-2 text-sm text-text-muted">Head back and pick today&apos;s workout to get started.</p>
        <Link href="/workout" className="mt-4 inline-block rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          View Workouts
        </Link>
      </div>
    );
  }

  function logSet(exerciseId: string) {
    const m = exerciseLogRef.current;
    m.set(exerciseId, (m.get(exerciseId) ?? 0) + 1);
  }

  function finishWorkout() {
    setShowFinish(true);
  }

  function handleCompleteStep() {
    if (!session || !currentStep) return;
    logSet(currentStep.exerciseId);
    const nextIndex = session.stepIndex + 1;
    if (nextIndex >= steps.length) {
      finishWorkout();
      return;
    }
    if (currentStep.restSeconds) {
      updateSession({
        stepIndex: nextIndex,
        status: "resting",
        restEndsAt: new Date(Date.now() + currentStep.restSeconds * 1000).toISOString(),
      });
    } else {
      updateSession({ stepIndex: nextIndex, status: "active" });
    }
  }

  function handleSkip() {
    if (!session || !currentStep) return;
    updateSession({
      skipped: [...session.skipped, currentStep.exerciseId],
    });
    const nextIndex = session.stepIndex + 1;
    if (nextIndex >= steps.length) {
      finishWorkout();
      return;
    }
    updateSession({ stepIndex: nextIndex, status: "active" });
  }

  function handlePrevious() {
    if (!session || session.stepIndex === 0) return;
    updateSession({ stepIndex: session.stepIndex - 1, status: "active" });
  }

  function handleRestComplete() {
    updateSession({ status: "active" });
  }

  function handleAddRestTime(seconds: number) {
    if (!session?.restEndsAt) return;
    updateSession({ restEndsAt: new Date(new Date(session.restEndsAt).getTime() + seconds * 1000).toISOString() });
  }

  function handleExitConfirmed() {
    clearSession();
    router.push("/workout");
  }

  const progressPercent = Math.round((stepIndex / steps.length) * 100);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col px-4 pt-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <button
          onClick={() => setShowExit(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-bg-subtle"
          aria-label="Exit workout"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-text">{workout.name}</p>
        <button
          onClick={() => setShowSafety(true)}
          className="text-xs font-medium text-text-faint underline underline-offset-2"
        >
          Feeling unwell?
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="mt-2 text-center text-xs font-medium text-text-muted">
        Exercise {stepIndex + 1} of {steps.length}
        {currentStep.roundsTotal > 1 ? ` · Round ${currentStep.round}/${currentStep.roundsTotal}` : ""}
      </p>

      {session?.status === "resting" && session.restEndsAt && !isPaused ? (
        <RestTimer
          endsAt={session.restEndsAt}
          nextLabel={nextExercise?.name}
          onComplete={handleRestComplete}
          onSkip={handleRestComplete}
          onAddTime={handleAddRestTime}
        />
      ) : isPaused ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-lg font-semibold text-text">Paused</p>
          <button
            onClick={() => setIsPaused(false)}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Play className="h-4 w-4" /> Resume
          </button>
        </div>
      ) : (
        exercise && (
          <div className="flex flex-1 flex-col items-center py-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-text-faint">
              {currentStep.sectionTitle}
            </div>
            <h1 className="text-2xl font-semibold text-text">{exercise.name}</h1>

            <div className="my-4 aspect-square w-full max-w-[280px]">
              <ExerciseFigure pattern={exercise.animation} equipment={exercise.equipment} title={exercise.name} className="h-full w-full" />
            </div>

            {currentStep.duration ? (
              <ExerciseCountdown
                key={stepIndex}
                duration={currentStep.duration}
                paused={isPaused}
                onDone={handleCompleteStep}
              />
            ) : (
              <RepCounter key={stepIndex} target={currentStep.reps ?? exercise.reps} />
            )}

            <p className="mt-4 max-w-xs text-center text-sm text-text-muted">{exercise.instructions[0]}</p>
          </div>
        )
      )}

      {/* Controls */}
      {session?.status !== "resting" && !isPaused && (
        <div className="sticky bottom-20 mt-auto space-y-3 pt-4 pb-2 md:bottom-4">
          <button
            onClick={handleCompleteStep}
            className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            Complete
          </button>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrevious}
              disabled={stepIndex === 0}
              className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-text-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button onClick={() => setIsPaused(true)} className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-text-muted">
              <Pause className="h-4 w-4" /> Pause
            </button>
            <button onClick={handleSkip} className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-text-muted">
              Skip <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <SafetyModal
        open={showSafety}
        onClose={() => setShowSafety(false)}
        onStopWorkout={() => {
          setShowSafety(false);
          handleExitConfirmed();
        }}
      />

      {showExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-bg-elevated p-5 text-center">
            <p className="font-semibold text-text">Exit this workout?</p>
            <p className="mt-1 text-sm text-text-muted">Your progress on this session won&apos;t be saved.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowExit(false)} className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold text-text">
                Keep going
              </button>
              <button onClick={handleExitConfirmed} className="flex-1 rounded-full bg-danger py-2.5 text-sm font-semibold text-white">
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinish && session && (
        <FinishFlow
          workoutName={workout.name}
          startedAt={session.startedAt}
          totalExercises={countUniqueExercises(workout)}
          totalSteps={steps.length}
          completedSteps={steps.length - session.skipped.length}
          roundsTotal={Math.max(...workout.sections.map((s) => s.rounds))}
          bodyWeightKg={latestWeight}
          onSave={(difficulty, notes) => {
            const finishedAt = new Date().toISOString();
            const durationSeconds = Math.max(
              60,
              Math.round((new Date(finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
            );
            const exerciseLog: CompletedExerciseLog[] = Array.from(exerciseLogRef.current.entries()).map(
              ([exerciseId, setsCompleted]) => ({
                exerciseId,
                setsCompleted,
                targetSets: steps.filter((s) => s.exerciseId === exerciseId).length,
              })
            );
            addWorkoutHistory({
              workoutId: workout.id,
              workoutName: workout.name,
              date: todayIso(),
              startedAt: session.startedAt,
              finishedAt,
              durationSeconds,
              exercisesCompleted: exerciseLog.length,
              exercisesTotal: countUniqueExercises(workout),
              roundsCompleted: Math.max(...workout.sections.map((s) => s.rounds)),
              roundsTotal: Math.max(...workout.sections.map((s) => s.rounds)),
              completionPercent: Math.round(((steps.length - session.skipped.length) / steps.length) * 100),
              difficulty,
              notes: notes || undefined,
              exerciseLog,
            });
            clearSession();
            router.push("/");
          }}
        />
      )}
    </div>
  );
}

function FinishFlow({
  workoutName,
  startedAt,
  totalExercises,
  totalSteps,
  completedSteps,
  roundsTotal,
  bodyWeightKg,
  onSave,
}: {
  workoutName: string;
  startedAt: string;
  totalExercises: number;
  totalSteps: number;
  completedSteps: number;
  roundsTotal: number;
  bodyWeightKg: number;
  onSave: (difficulty: 1 | 2 | 3 | 4 | 5, notes: string) => void;
}) {
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState("");
  const [durationSeconds] = useState(() =>
    Math.max(60, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000))
  );
  const completionPercent = Math.round((completedSteps / totalSteps) * 100);
  const calories = estimateCalories(durationSeconds, bodyWeightKg, "moderate");

  const difficultyLabels: Record<number, string> = {
    1: "Very easy",
    2: "Easy",
    3: "Moderate",
    4: "Hard",
    5: "Very hard",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg px-4 py-8">
      <div className="mx-auto max-w-sm text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-2 text-2xl font-bold text-text">Workout Complete!</h1>
        <p className="mt-1 text-sm text-text-muted">{workoutName}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <StatTile label="Duration" value={formatClock(durationSeconds)} />
          <StatTile label="Exercises" value={`${totalExercises} done`} />
          <StatTile label="Rounds" value={`${roundsTotal}`} />
          <StatTile label="Completion" value={`${completionPercent}%`} />
        </div>
        <p className="mt-3 text-xs text-text-faint">Estimated {calories} kcal · rough estimate, not medical-grade</p>

        <div className="mt-6 text-left">
          <p className="mb-2 text-sm font-semibold text-text">How difficult was it?</p>
          <div className="flex justify-between gap-1.5">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d as 1 | 2 | 3 | 4 | 5)}
                className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold ${
                  difficulty === d ? "border-primary bg-primary-soft text-primary" : "border-border text-text-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-center text-xs text-text-faint">{difficultyLabels[difficulty]}</p>
        </div>

        <div className="mt-5 text-left">
          <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-text">
            Notes <span className="font-normal text-text-faint">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How did it feel? Anything to remember for next time?"
            className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-sm text-text placeholder:text-text-faint focus:border-primary focus:outline-none"
          />
        </div>

        <button
          onClick={() => onSave(difficulty, notes)}
          className="mt-6 w-full rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground active:scale-[0.98]"
        >
          Save & Finish
        </button>
      </div>
    </div>
  );
}

function ExerciseCountdown({
  duration,
  paused,
  onDone,
}: {
  duration: number;
  paused: boolean;
  onDone: () => void;
}) {
  const [endsAt] = useState(() => Date.now() + duration * 1000);
  const [remaining, setRemaining] = useState(duration);
  const handleDone = useEffectEvent(() => onDone());

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const secs = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        window.clearInterval(id);
        handleDone();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [endsAt, paused]);

  return <p className="text-3xl font-bold tabular-nums text-primary">{formatClock(remaining)}</p>;
}

function RepCounter({ target }: { target?: number }) {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-5">
      <button
        onClick={() => setCount((c) => Math.max(0, c - 1))}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-text active:scale-95"
        aria-label="Decrease rep count"
      >
        <Minus className="h-5 w-5" />
      </button>
      <p className="w-28 text-center text-3xl font-bold tabular-nums text-text">
        {count}
        <span className="text-base font-medium text-text-faint"> / {target ?? "-"}</span>
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-text active:scale-95"
        aria-label="Increase rep count"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-lg font-semibold text-text">{value}</p>
    </div>
  );
}
