"use client";

import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onStopWorkout: () => void;
};

const warningSymptoms = [
  "Chest pain or pressure",
  "Fainting or near-fainting",
  "Severe or unusual dizziness",
  "Severe or unusual shortness of breath",
  "Severe pain anywhere",
];

export function SafetyModal({ open, onClose, onStopWorkout }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="w-full max-w-sm rounded-t-3xl bg-bg-elevated p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-text-faint hover:bg-bg-subtle">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 id="safety-title" className="text-lg font-semibold text-text">
          Not feeling right?
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Stop this workout and seek appropriate medical attention if you experience any of the following:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-text">
          {warningSymptoms.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-text-faint">
          This app is a fitness tracker, not a medical device, and cannot diagnose medical conditions.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={onStopWorkout}
            className="w-full rounded-full bg-danger px-4 py-3 text-sm font-semibold text-white active:scale-[0.97]"
          >
            Stop workout now
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-full border border-border px-4 py-3 text-sm font-semibold text-text active:scale-[0.97]"
          >
            I&apos;m okay, continue
          </button>
        </div>
      </div>
    </div>
  );
}
