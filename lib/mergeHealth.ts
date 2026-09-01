import type { HealthMetricRow, StepEntry, WeightEntry } from "@/lib/types";

/**
 * Merges manually-entered data with synced Apple Health rows. A synced
 * entry wins over a manual one for the same date -- once a metric is
 * syncing, Health is the source of truth for that day.
 */
export function mergeStepEntries(manual: StepEntry[], synced: HealthMetricRow[]): StepEntry[] {
  const stepsByDate = new Map<string, number>();
  const distanceByDate = new Map<string, number>();
  for (const r of synced) {
    if (r.metric === "steps") stepsByDate.set(r.date, r.value);
    if (r.metric === "distance_km") distanceByDate.set(r.date, r.value);
  }
  if (stepsByDate.size === 0) return manual;

  const keptManual = manual.filter((e) => !stepsByDate.has(e.date));
  const syncedEntries: StepEntry[] = Array.from(stepsByDate.entries()).map(([date, steps]) => ({
    id: `apple-health-steps-${date}`,
    date,
    steps: Math.round(steps),
    distanceKm: distanceByDate.get(date),
    source: "apple-health",
    createdAt: new Date().toISOString(),
  }));
  return [...keptManual, ...syncedEntries].sort((a, b) => a.date.localeCompare(b.date));
}

export function mergeWeightEntries(manual: WeightEntry[], synced: HealthMetricRow[]): WeightEntry[] {
  const weightByDate = new Map<string, number>();
  for (const r of synced) {
    if (r.metric === "weight_kg") weightByDate.set(r.date, r.value);
  }
  if (weightByDate.size === 0) return manual;

  const keptManual = manual.filter((e) => !weightByDate.has(e.date));
  const syncedEntries: WeightEntry[] = Array.from(weightByDate.entries()).map(([date, weightKg]) => ({
    id: `apple-health-weight-${date}`,
    date,
    weightKg,
    source: "apple-health",
    createdAt: new Date().toISOString(),
  }));
  return [...keptManual, ...syncedEntries].sort((a, b) => a.date.localeCompare(b.date));
}

export function latestHeartRate(
  synced: HealthMetricRow[],
  metric: "resting_heart_rate" | "walking_heart_rate"
): number | null {
  const rows = synced.filter((r) => r.metric === metric).sort((a, b) => b.date.localeCompare(a.date));
  return rows.length ? rows[0].value : null;
}

export function totalExerciseMinutes(synced: HealthMetricRow[], sinceDate: string): number {
  return Math.round(
    synced
      .filter((r) => r.metric === "exercise_minutes" && r.date >= sinceDate)
      .reduce((sum, r) => sum + r.value, 0)
  );
}
