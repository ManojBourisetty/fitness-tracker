"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Footprints, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { Card, Pill, SectionHeading } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/Skeleton";
import { ProgressRing } from "@/components/ProgressRing";
import { LineChart } from "@/components/LineChart";
import { averageSteps, bestStepDay, todayStepEntry } from "@/lib/derived";
import { formatShortDate, todayIso } from "@/lib/utils";
import { useHealthMetrics } from "@/lib/useHealthMetrics";
import { mergeStepEntries } from "@/lib/mergeHealth";

export default function StepsPage() {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const manualEntries = useAppStore((s) => s.stepEntries);
  const upsertStepEntry = useAppStore((s) => s.upsertStepEntry);
  const removeStepEntry = useAppStore((s) => s.removeStepEntry);
  const health = useHealthMetrics();

  const [showForm, setShowForm] = useState(false);
  const [steps, setSteps] = useState("");
  const [date, setDate] = useState(todayIso());
  const [durationMin, setDurationMin] = useState("");

  if (!hydrated) return <PageSkeleton />;

  const entries = mergeStepEntries(manualEntries, health.rows);
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const today = todayStepEntry(entries);
  const weekAvg = averageSteps(entries, 7);
  const best = bestStepDay(entries);
  const todayPercent = today ? Math.round((today.steps / profile.stepGoal) * 100) : 0;
  const todayDistanceKm = today?.distanceKm ?? (today ? Math.round((today.steps * 0.0008) * 10) / 10 : undefined);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = parseInt(steps, 10);
    if (!s || s < 0) return;
    upsertStepEntry({
      date,
      steps: s,
      durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
      distanceKm: Math.round(s * 0.0008 * 10) / 10,
      source: "manual",
    });
    setSteps("");
    setDurationMin("");
    setDate(todayIso());
    setShowForm(false);
  }

  return (
    <div className="space-y-5 px-4 pt-4 pb-8 md:px-6">
      <Link href="/" className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="text-2xl font-semibold text-text">Steps</h1>

      {entries.length === 0 && !showForm ? (
        <EmptyState
          icon={Footprints}
          title="Add today's steps"
          description="Log your steps manually for now. This is structured so Apple Health can sync automatically in the future."
          actionLabel="Add Steps"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          <Card className="flex flex-col items-center gap-3 text-center">
            <ProgressRing value={todayPercent} size={140} strokeWidth={12}>
              <span className="text-3xl font-bold text-text">{(today?.steps ?? 0).toLocaleString()}</span>
              <span className="text-xs text-text-muted">of {profile.stepGoal.toLocaleString()}</span>
            </ProgressRing>
            <div className="flex gap-6 text-sm text-text-muted">
              {todayDistanceKm != null && <span>{todayDistanceKm} km</span>}
              {today?.durationMin && <span>{today.durationMin} min</span>}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <p className="text-xs text-text-muted">Weekly average</p>
              <p className="mt-1 text-xl font-semibold text-text">{weekAvg.toLocaleString()}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-text-muted">Best day</p>
              <p className="mt-1 text-xl font-semibold text-text">{best ? best.steps.toLocaleString() : "—"}</p>
            </Card>
          </div>

          <Card>
            <SectionHeading>Last 14 days</SectionHeading>
            <LineChart
              points={sorted.slice(-14).map((e) => ({ x: formatShortDate(e.date), y: e.steps }))}
              formatY={(y) => `${y.toLocaleString()} steps`}
              goal={profile.stepGoal}
            />
          </Card>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Add Steps
            </button>
          )}
        </>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="steps" className="mb-1 block text-sm font-medium text-text">
                Steps
              </label>
              <input
                id="steps"
                type="number"
                inputMode="numeric"
                autoFocus
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg p-3 text-text focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="stepDate" className="mb-1 block text-sm font-medium text-text">
                Date
              </label>
              <input
                id="stepDate"
                type="date"
                value={date}
                max={todayIso()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg p-3 text-text focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="walkDuration" className="mb-1 block text-sm font-medium text-text">
                Walking duration, minutes (optional)
              </label>
              <input
                id="walkDuration"
                type="number"
                inputMode="numeric"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg p-3 text-text focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-full border border-border py-3 text-sm font-semibold text-text">
                Cancel
              </button>
              <button type="submit" className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">
                Save
              </button>
            </div>
          </form>
        </Card>
      )}

      {sorted.length > 0 && (
        <div>
          <SectionHeading>History</SectionHeading>
          <div className="space-y-2">
            {[...sorted].reverse().slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated p-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-text">
                    {e.steps.toLocaleString()} steps
                    {e.source === "apple-health" && <Pill tone="primary">Synced</Pill>}
                  </p>
                  <p className="text-xs text-text-muted">{formatShortDate(e.date)}</p>
                </div>
                {e.source === "manual" && (
                  <button
                    onClick={() => removeStepEntry(e.id)}
                    aria-label="Delete entry"
                    className="rounded-full p-2 text-text-faint hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
