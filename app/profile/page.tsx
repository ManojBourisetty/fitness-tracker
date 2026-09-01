"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun, Watch } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { Card, Pill, SectionHeading } from "@/components/ui";
import { PageSkeleton } from "@/components/Skeleton";
import { cmToFeetInches } from "@/lib/utils";

const equipmentOptions = ["chair", "wall", "mat"];

export default function ProfilePage() {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState(profile);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showReset, setShowReset] = useState(false);

  if (!hydrated) return <PageSkeleton />;

  const heightParts = cmToFeetInches(form.heightCm);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile(form);
    setSavedAt(Date.now());
    window.setTimeout(() => setSavedAt(null), 2000);
  }

  function handleReset() {
    localStorage.removeItem("fitness-tracker-store");
    // A full reload is intentional here: it's the simplest reliable way to
    // clear the in-memory zustand store back to defaults after wiping storage.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  return (
    <div className="space-y-5 px-4 pt-6 pb-10 md:px-6">
      <h1 className="text-2xl font-semibold text-text">Profile</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <Card className="space-y-3">
          <SectionHeading>About You</SectionHeading>
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={`Height (${heightParts})`}>
            <input
              type="range"
              min={140}
              max={210}
              value={Math.round(form.heightCm)}
              onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </Field>
          <Field label="Starting weight (kg)">
            <input
              type="number"
              step="0.1"
              value={form.startingWeightKg}
              onChange={(e) => setForm({ ...form, startingWeightKg: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Experience">
            <select
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value as typeof form.experience })}
              className="input"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
        </Card>

        <Card className="space-y-3">
          <SectionHeading>Program</SectionHeading>
          <Field label="Environment">
            <select
              value={form.environment}
              onChange={(e) => setForm({ ...form, environment: e.target.value as typeof form.environment })}
              className="input"
            >
              <option value="home">Home</option>
              <option value="gym">Gym</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-text">Available equipment</p>
            <div className="flex flex-wrap gap-2">
              {equipmentOptions.map((opt) => {
                const active = form.equipment.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() =>
                      setForm({
                        ...form,
                        equipment: active ? form.equipment.filter((e) => e !== opt) : [...form.equipment, opt],
                      })
                    }
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
                      active ? "bg-primary text-primary-foreground" : "border border-border text-text-muted"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-text-faint">The core weekly program stays equipment-free either way.</p>
          </div>
          <Field label="Workout preference">
            <input
              value={form.workoutPreference}
              onChange={(e) => setForm({ ...form, workoutPreference: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Primary goal">
            <textarea
              value={form.primaryGoal}
              onChange={(e) => setForm({ ...form, primaryGoal: e.target.value })}
              rows={3}
              className="input"
            />
          </Field>
          <Field label="Daily step goal">
            <input
              type="number"
              value={form.stepGoal}
              onChange={(e) => setForm({ ...form, stepGoal: Number(e.target.value) })}
              className="input"
            />
          </Field>
        </Card>

        <button type="submit" className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]">
          {savedAt ? "Saved ✓" : "Save Changes"}
        </button>
      </form>

      <Card className="space-y-3">
        <SectionHeading>Appearance</SectionHeading>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Laptop },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium ${
                theme === value ? "border-primary bg-primary-soft text-primary" : "border-border text-text-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-2">
        <SectionHeading>Data Sources</SectionHeading>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text">Steps, weight & heart rate</span>
          <Pill tone="neutral">Manual entry</Pill>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-text-faint">
          <Watch className="h-3.5 w-3.5" /> Apple Health sync isn&apos;t available from a web app — see the README for the
          planned native integration path.
        </p>
      </Card>

      <Card className="space-y-2">
        <SectionHeading>Data</SectionHeading>
        <p className="text-sm text-text-muted">All your data is stored privately on this device.</p>
        {!showReset ? (
          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-sm font-semibold text-danger"
          >
            Reset all data
          </button>
        ) : (
          <div className="rounded-xl bg-danger-soft p-3">
            <p className="text-sm font-medium text-danger">This permanently deletes your profile, history, and entries on this device.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setShowReset(false)} className="flex-1 rounded-full border border-border py-2 text-xs font-semibold text-text">
                Cancel
              </button>
              <button type="button" onClick={handleReset} className="flex-1 rounded-full bg-danger py-2 text-xs font-semibold text-white">
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </Card>

      <p className="px-2 text-center text-xs leading-relaxed text-text-faint">
        This app is a fitness tracker, not a medical device, and does not diagnose medical conditions. Check with a
        doctor before starting a new exercise program, especially if you have an existing health condition. Stop and
        seek medical attention for chest pain, fainting, severe dizziness, severe shortness of breath, or severe pain.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-text">{label}</span>
      {children}
    </label>
  );
}
