import type { AnimationPattern } from "@/lib/types";

type Props = {
  pattern: AnimationPattern;
  equipment?: string[];
  className?: string;
  /** Render without the animation wrapper div (caller controls sizing). */
  title?: string;
};

/**
 * A small original stick-figure illustration, animated per movement pattern
 * with CSS keyframes (see globals.css `.exercise-figure[data-pattern=...]`).
 * Pure inline SVG + CSS: no external assets, no licensing concerns, and it
 * respects prefers-reduced-motion automatically (see globals.css).
 */
export function ExerciseFigure({ pattern, equipment = [], className, title }: Props) {
  const hasChair = equipment.includes("chair");
  const hasWall = equipment.includes("wall");
  const hasMat = equipment.includes("mat");

  return (
    <div
      className={`exercise-figure relative h-full w-full ${className ?? ""}`}
      data-pattern={pattern}
      role="img"
      aria-label={title ?? `Demonstration of ${pattern.replace(/-/g, " ")}`}
    >
      <svg viewBox="0 0 100 150" className="h-full w-full" aria-hidden="true">
        {hasWall && (
          <line x1="14" y1="6" x2="14" y2="146" className="fig-prop" strokeWidth="4" strokeLinecap="round" />
        )}
        <line x1="4" y1="146" x2="96" y2="146" className="fig-ground" strokeWidth="3" strokeLinecap="round" />
        {hasChair && (
          <g className="fig-prop">
            <line x1="66" y1="96" x2="66" y2="146" strokeWidth="4" strokeLinecap="round" />
            <line x1="88" y1="96" x2="88" y2="146" strokeWidth="4" strokeLinecap="round" />
            <line x1="64" y1="96" x2="90" y2="96" strokeWidth="5" strokeLinecap="round" />
          </g>
        )}
        {hasMat && (
          <ellipse cx="50" cy="140" rx="46" ry="6" className="fig-prop" opacity="0.5" />
        )}

        <g className="fig-root">
          <line className="fig-leg-l" x1="50" y1="82" x2="36" y2="144" strokeWidth="7" strokeLinecap="round" />
          <line className="fig-leg-r" x1="50" y1="82" x2="64" y2="144" strokeWidth="7" strokeLinecap="round" />
          <line className="fig-torso" x1="50" y1="31" x2="50" y2="83" strokeWidth="8" strokeLinecap="round" />
          <line className="fig-arm-l" x1="50" y1="38" x2="30" y2="60" strokeWidth="6" strokeLinecap="round" />
          <line className="fig-arm-r" x1="50" y1="38" x2="70" y2="60" strokeWidth="6" strokeLinecap="round" />
          <circle className="fig-head" cx="50" cy="20" r="10" />
        </g>
      </svg>
    </div>
  );
}
