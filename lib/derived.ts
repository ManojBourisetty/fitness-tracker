import { getWorkoutForDay, weeklyProgram } from "@/lib/data/program";
import type { StepEntry, WeightEntry, Workout, WorkoutHistoryEntry } from "@/lib/types";
import type { DayStatus } from "@/components/WeekStrip";
import { getWeekDates, startOfWeekIso, todayIso } from "@/lib/utils";

export function exerciseCount(workout: Workout): number {
  const ids = new Set<string>();
  workout.sections.forEach((s) => s.items.forEach((i) => ids.add(i.exerciseId)));
  return ids.size;
}

export function maxRounds(workout: Workout): number {
  return workout.sections.reduce((max, s) => Math.max(max, s.rounds), 0) || 1;
}

export function getWeekStrip(
  history: WorkoutHistoryEntry[],
  reference: Date = new Date()
): { label: string; status: DayStatus; date: string }[] {
  const weekStart = startOfWeekIso(reference);
  const dates = getWeekDates(weekStart);
  const today = todayIso();
  const historyDates = new Set(history.map((h) => h.date));

  return dates.map((date) => {
    const d = new Date(date + "T00:00:00");
    const label = d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
    const workout = getWorkoutForDay(d.getDay());
    const isRestType = workout?.type === "rest" || workout?.type === "recovery";

    let status: DayStatus;
    if (historyDates.has(date)) status = "done";
    else if (date === today) status = "today";
    else if (date > today) status = "future";
    else if (isRestType) status = "rest";
    else status = "missed";

    return { label, status, date };
  });
}

export function weekPlanSummary() {
  return weeklyProgram.map((w) => ({ day: w.day, dayLabel: w.dayLabel, name: w.name, type: w.type }));
}

export function latestWeight(entries: WeightEntry[]): WeightEntry | undefined {
  return entries.length ? entries[entries.length - 1] : undefined;
}

export function todayStepEntry(entries: StepEntry[]): StepEntry | undefined {
  return entries.find((e) => e.date === todayIso());
}

export function averageSteps(entries: StepEntry[], days: number): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, days);
  return Math.round(sorted.reduce((sum, e) => sum + e.steps, 0) / sorted.length);
}

export function bestStepDay(entries: StepEntry[]): StepEntry | undefined {
  if (entries.length === 0) return undefined;
  return entries.reduce((best, e) => (e.steps > best.steps ? e : best), entries[0]);
}
