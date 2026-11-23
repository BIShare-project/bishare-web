import type { CSSProperties } from "@/jsx";
import { cn } from "@/lib/utils";

/**
 * Glow progress bar (Nightglass flow treatment): brand-gradient fill with a
 * colored halo on a muted track. Server-safe; drives itself purely off the
 * `value` prop (0–100).
 */
export function GlowProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-border",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-accent-blue"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/**
 * Success checkmark that draws itself on (confetti-free success moment):
 * gradient-stroked circle + tick using the `.demo-check-*` draw-on keyframes.
 * Reduced motion renders it fully drawn (the base classes' static pose).
 * Server-safe — stable gradient id, no hooks.
 */
export function SuccessCheck({
  size = 72,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={className}
    >
      <circle
        cx="48"
        cy="48"
        r="42"
        stroke="var(--accent-blue)"
        strokeWidth="3"
        strokeLinecap="round"
        className="demo-check-circle"
        style={{ "--draw": 264 } as CSSProperties}
      />
      <path
        d="M31 50l12 12 22-26"
        stroke="var(--accent-blue)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="demo-check-mark"
        style={{ "--draw": 52 } as CSSProperties}
      />
    </svg>
  );
}
