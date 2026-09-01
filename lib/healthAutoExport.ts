import type { HealthMetricKey } from "@/lib/types";

type NormalizedRow = { metric: HealthMetricKey; date: string; value: number; source: string };

// Health Auto Export metric names -> our normalized keys. The app's export
// settings can rename/reorder metrics, so this list errs toward covering
// every common alias rather than assuming one exact name.
const METRIC_NAME_MAP: Record<string, HealthMetricKey> = {
  step_count: "steps",
  steps: "steps",
  walking_running_distance: "distance_km",
  distance_walking_running: "distance_km",
  distance: "distance_km",
  weight_body_mass: "weight_kg",
  body_mass: "weight_kg",
  weight: "weight_kg",
  resting_heart_rate: "resting_heart_rate",
  walking_heart_rate_average: "walking_heart_rate",
  walking_heart_rate: "walking_heart_rate",
  apple_exercise_time: "exercise_minutes",
  exercise_time: "exercise_minutes",
};

const CUMULATIVE: ReadonlySet<HealthMetricKey> = new Set(["steps", "distance_km", "exercise_minutes"]);

function toIsoDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function convertUnit(metric: HealthMetricKey, value: number, unit: unknown): number {
  const u = typeof unit === "string" ? unit.toLowerCase() : "";
  if (metric === "weight_kg" && (u === "lb" || u === "lbs" || u === "pound")) {
    return value / 2.20462;
  }
  if (metric === "distance_km" && (u === "mi" || u === "miles" || u === "mile")) {
    return value * 1.60934;
  }
  return value;
}

/**
 * Parses a Health Auto Export "REST API automation" payload into normalized
 * rows. Deliberately tolerant of shape drift (unknown metric names or
 * malformed points are skipped, not fatal) since the export format can vary
 * by app version and export settings, and this endpoint has no live device
 * to validate against ahead of time -- check Vercel function logs after a
 * real export if a metric isn't showing up.
 */
export function parseHealthAutoExportPayload(body: unknown): NormalizedRow[] {
  const root = body as { data?: { metrics?: unknown }; metrics?: unknown } | null;
  const metrics = root?.data?.metrics ?? root?.metrics;
  if (!Array.isArray(metrics)) return [];

  // `${metric}|${date}` -> accumulated or latest value
  const daily = new Map<string, number>();

  for (const m of metrics) {
    if (typeof m !== "object" || m === null) continue;
    const rawName = String((m as { name?: unknown }).name ?? "")
      .toLowerCase()
      .trim();
    const metric = METRIC_NAME_MAP[rawName];
    if (!metric) continue;

    const points = (m as { data?: unknown }).data;
    if (!Array.isArray(points)) continue;

    for (const p of points) {
      if (typeof p !== "object" || p === null) continue;
      const point = p as Record<string, unknown>;
      const date = toIsoDate(point.date ?? point.Date ?? point.qty_date);
      const rawValue = point.qty ?? point.value ?? point.Avg ?? point.avg;
      if (!date || typeof rawValue !== "number") continue;

      const value = convertUnit(metric, rawValue, (m as { units?: unknown }).units);
      const key = `${metric}|${date}`;
      if (CUMULATIVE.has(metric)) {
        daily.set(key, (daily.get(key) ?? 0) + value);
      } else {
        daily.set(key, value);
      }
    }
  }

  const rows: NormalizedRow[] = [];
  for (const [key, value] of daily) {
    const [metric, date] = key.split("|") as [HealthMetricKey, string];
    rows.push({ metric, date, value: Math.round(value * 100) / 100, source: "apple-health" });
  }
  return rows;
}
