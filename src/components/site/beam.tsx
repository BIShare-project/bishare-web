import { useId } from "react";
import { cn } from "@/lib/utils";

interface BeamProps {
  /** SVG path `d`. Defaults to a horizontal S-curve across the viewBox. */
  path?: string;
  width?: number;
  height?: number;
  /** Seconds per light-packet trip. */
  duration?: number;
  /** Seconds before the first trip. */
  delay?: number;
  reverse?: boolean;
  /** Scale the whole beam via the SVG box. */
  preserveAspectRatio?: string;
  className?: string;
}

/**
 * Animated file-transfer beam (Nightglass §2.7 — the brand moment): a dashed
 * base path plus a normalized-pathLength gradient "light packet" traveling it.
 * Pure SVG + CSS; reduced motion hides the packet and brightens the base.
 */
export function Beam({
  path,
  width = 300,
  height = 120,
  duration = 2.8,
  delay = 0,
  reverse = false,
  preserveAspectRatio,
  className,
}: BeamProps) {
  const id = useId();
  const gradId = `beam-grad-${id.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const d =
    path ??
    `M 8 ${height * 0.6} C ${width * 0.3} ${height * 0.15}, ${width * 0.7} ${
      height * 1.05
    }, ${width - 8} ${height * 0.5}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={cn("overflow-visible", className)}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden
    >
      <path
        d={d}
        className="beam-base"
        stroke="rgba(148,163,199,0.18)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={100}
        className="beam-pulse"
        style={
          {
            "--beam-dur": `${duration}s`,
            animationDelay: delay ? `${delay}s` : undefined,
            animationDirection: reverse ? "reverse" : undefined,
          } as React.CSSProperties
        }
      />
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
