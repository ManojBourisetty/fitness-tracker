type Props = {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: "primary" | "accent" | "success";
  label?: string;
  sublabel?: string;
  children?: React.ReactNode;
};

const colorVar: Record<NonNullable<Props["color"]>, string> = {
  primary: "var(--primary)",
  accent: "var(--accent)",
  success: "var(--success)",
};

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 9,
  color = "primary",
  label,
  sublabel,
  children,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="var(--bg-subtle)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={colorVar[color]}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            {label && <span className="text-lg font-semibold text-text">{label}</span>}
            {sublabel && <span className="text-[11px] text-text-muted">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  );
}
