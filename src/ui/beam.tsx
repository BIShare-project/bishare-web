import { cn } from "@/lib/utils";

/** The dashed line between two devices: `path` in a box of `width` by `height`. */
export const Beam = ({ path, width, height, preserveAspectRatio, className }: { path: string; width: number; height: number; preserveAspectRatio?: string; className?: string }) => (
  <svg viewBox={`0 0 ${width} ${height}`} fill="none" className={cn("overflow-visible", className)} preserveAspectRatio={preserveAspectRatio} aria-hidden>
    <path d={path} opacity="0.5" stroke="rgba(148,163,199,0.18)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
  </svg>
);
