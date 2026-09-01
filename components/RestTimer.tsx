"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/utils";

type Props = {
  endsAt: string; // ISO timestamp
  nextLabel?: string;
  onComplete: () => void;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
};

/**
 * Rest countdown driven by a wall-clock end time (not a naive interval
 * decrement) so it stays correct even if the tab is backgrounded and
 * timers get throttled -- the remaining time is always recomputed from
 * Date.now() vs endsAt.
 */
export function RestTimer({ endsAt, nextLabel, onComplete, onSkip, onAddTime }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((new Date(endsAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = () => {
      const secs = Math.max(0, Math.round((new Date(endsAt).getTime() - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) onComplete();
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt, onComplete]);

  const totalGuess = Math.max(remaining, 1);

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Rest</p>
      <div
        className="relative flex h-48 w-48 items-center justify-center rounded-full bg-primary-soft"
        role="timer"
        aria-live="polite"
      >
        <span className="text-5xl font-bold tabular-nums text-text">{formatClock(remaining)}</span>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - remaining / Math.max(totalGuess, remaining))}
            style={{ transition: "stroke-dashoffset 0.25s linear" }}
          />
        </svg>
      </div>
      {nextLabel && <p className="text-sm text-text-muted">Up next: {nextLabel}</p>}
      <div className="flex w-full max-w-xs gap-3">
        <button
          onClick={() => onAddTime(30)}
          className="flex-1 rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm font-semibold text-text active:scale-[0.97]"
        >
          +30 sec
        </button>
        <button
          onClick={onSkip}
          className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground active:scale-[0.97]"
        >
          Skip Rest
        </button>
      </div>
    </div>
  );
}
