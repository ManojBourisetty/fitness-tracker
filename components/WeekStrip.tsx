import { Check, Minus } from "lucide-react";

export type DayStatus = "done" | "missed" | "today" | "future" | "rest";

type DayInfo = {
  label: string;
  status: DayStatus;
};

const dot: Record<DayStatus, string> = {
  done: "bg-success text-white",
  missed: "bg-bg-subtle text-text-faint",
  today: "bg-primary text-primary-foreground ring-2 ring-primary-soft",
  future: "bg-bg-subtle text-text-faint",
  rest: "bg-accent-soft text-accent",
};

export function WeekStrip({ days }: { days: DayInfo[] }) {
  return (
    <ul className="flex items-center justify-between gap-1">
      {days.map((day, i) => (
        <li key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[11px] font-medium text-text-muted">{day.label}</span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${dot[day.status]}`}
            aria-label={day.status}
          >
            {day.status === "done" ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : day.status === "missed" ? (
              <Minus className="h-3.5 w-3.5" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
