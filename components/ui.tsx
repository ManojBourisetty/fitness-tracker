import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-bg-elevated p-4 shadow-[var(--shadow-card)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function BarMeter({
  value,
  label,
  color = "primary",
}: {
  value: number;
  label?: string;
  color?: "primary" | "accent" | "success";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const bg = color === "accent" ? "bg-accent" : color === "success" ? "bg-success" : "bg-primary";
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-text-muted">{label}</span>
          <span className="font-semibold text-text">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
        <div
          className={`h-full rounded-full ${bg} transition-[width] duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "accent" | "success" | "danger";
}) {
  const toneClass = {
    neutral: "bg-bg-subtle text-text-muted",
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}
