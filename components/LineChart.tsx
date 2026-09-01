"use client";

import { useId } from "react";

export type ChartPoint = { x: string; y: number };

type Props = {
  points: ChartPoint[];
  height?: number;
  formatY?: (y: number) => string;
  color?: string;
  goal?: number;
};

/**
 * Minimal dependency-free SVG line chart. Keeps bundle size down compared
 * to a full charting library, and inherits theme colors via CSS variables.
 */
export function LineChart({ points, height = 160, formatY, color = "var(--primary)", goal }: Props) {
  const gradientId = useId();

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-bg-subtle text-sm text-text-faint"
        style={{ height }}
      >
        Not enough data yet
      </div>
    );
  }

  const width = 320;
  const padding = 24;
  const values = points.map((p) => p.y);
  const min = Math.min(...values, goal ?? Infinity);
  const max = Math.max(...values, goal ?? -Infinity);
  const span = max - min || 1;

  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (p.y - min) / span) * (height - padding * 2);
    return { x, y, raw: p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padding} L ${coords[0].x.toFixed(1)} ${height - padding} Z`;

  const goalY = goal != null ? padding + (1 - (goal - min) / span) * (height - padding * 2) : null;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {goalY != null && (
          <line
            x1={padding}
            x2={width - padding}
            y1={goalY}
            y2={goalY}
            stroke="var(--text-faint)"
            strokeDasharray="3 4"
            strokeWidth="1"
          />
        )}
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4 : 2.5} fill={color} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-text-faint">
        <span>{points[0].x}</span>
        {formatY && <span className="font-medium text-text-muted">{formatY(points[points.length - 1].y)}</span>}
        <span>{points[points.length - 1].x}</span>
      </div>
    </div>
  );
}
