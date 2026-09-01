"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Scale, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { Card, Pill, SectionHeading } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/Skeleton";
import { LineChart } from "@/components/LineChart";
import { daysAgoIso, formatShortDate, round1, todayIso } from "@/lib/utils";
import { useHealthMetrics } from "@/lib/useHealthMetrics";
import { mergeWeightEntries } from "@/lib/mergeHealth";

export default function WeightPage() {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const manualEntries = useAppStore((s) => s.weightEntries);
  const addWeightEntry = useAppStore((s) => s.addWeightEntry);
  const removeWeightEntry = useAppStore((s) => s.removeWeightEntry);
  const health = useHealthMetrics();

  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");

  if (!hydrated) return <PageSkeleton />;

  const entries = mergeWeightEntries(manualEntries, health.rows);
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.at(-1);
  const starting = sorted[0] ?? { weightKg: profile.startingWeightKg };
  const totalChange = current ? round1(current.weightKg - profile.startingWeightKg) : null;

  const sevenDaysAgo = daysAgoIso(7);
  const thirtyDaysAgo = daysAgoIso(30);
  const trend7 = sorted.filter((e) => e.date >= sevenDaysAgo);
  const trend30 = sorted.filter((e) => e.date >= thirtyDaysAgo);
  const change7 = trend7.length >= 2 ? round1(trend7.at(-1)!.weightKg - trend7[0].weightKg) : null;
  const change30 = trend30.length >= 2 ? round1(trend30.at(-1)!.weightKg - trend30[0].weightKg) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    addWeightEntry({ date, weightKg: round1(w), note: note.trim() || undefined, source: "manual" });
    setWeight("");
    setNote("");
    setDate(todayIso());
    setShowForm(false);
  }

  return (
    <div className="space-y-5 px-4 pt-4 pb-8 md:px-6">
      <Link href="/" className="flex items-center gap-1 text-sm font-medium text-text-muted">
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="text-2xl font-semibold text-text">Weight</h1>

      {entries.length === 0 && !showForm ? (
        <EmptyState
          icon={Scale}
          title="Start your weight trend"
          description="Log your first entry to start tracking. A single day's number matters far less than the trend over time."
          actionLabel="Add Weight"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          <Card className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-text-muted">Current</p>
              <p className="text-lg font-semibold text-text">{current?.weightKg ?? "—"} kg</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Starting</p>
              <p className="text-lg font-semibold text-text">{starting.weightKg} kg</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Total change</p>
              <p className={`text-lg font-semibold ${totalChange != null && totalChange < 0 ? "text-success" : "text-text"}`}>
                {totalChange != null ? `${totalChange > 0 ? "+" : ""}${totalChange} kg` : "—"}
              </p>
            </div>
          </Card>

          <Card>
            <SectionHeading>Trend</SectionHeading>
            <LineChart
              points={sorted.slice(-30).map((e) => ({ x: formatShortDate(e.date), y: e.weightKg }))}
              formatY={(y) => `${y} kg`}
            />
            <p className="mt-3 text-center text-xs text-text-faint">
              Focus on the trend line, not any single day &mdash; weight naturally fluctuates.
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <p className="text-xs text-text-muted">7-day trend</p>
              <p className="mt-1 font-semibold text-text">{change7 != null ? `${change7 > 0 ? "+" : ""}${change7} kg` : "Not enough data"}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-text-muted">30-day trend</p>
              <p className="mt-1 font-semibold text-text">{change30 != null ? `${change30 > 0 ? "+" : ""}${change30} kg` : "Not enough data"}</p>
            </Card>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Add Weight
            </button>
          )}
        </>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="weight" className="mb-1 block text-sm font-medium text-text">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                autoFocus
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg p-3 text-text focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="date" className="mb-1 block text-sm font-medium text-text">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                max={todayIso()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg p-3 text-text focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="note" className="mb-1 block text-sm font-medium text-text">
                Note (optional)
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                    {e.weightKg} kg
                    {e.source === "apple-health" && <Pill tone="primary">Synced</Pill>}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatShortDate(e.date)} {e.note ? `· ${e.note}` : ""}
                  </p>
                </div>
                {e.source === "manual" && (
                  <button
                    onClick={() => removeWeightEntry(e.id)}
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
