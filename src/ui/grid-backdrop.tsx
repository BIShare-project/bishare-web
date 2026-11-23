import { cn } from "@/lib/utils";

interface GridBackdropProps {
  pattern: "dots" | "lines";
  className?: string;
}

/**
 * Static dot-grid / line-grid section backdrop (Nightglass §1.8), masked to
 * fade toward the edges. Server component.
 *
 * The positioned host MUST carry `relative isolate` — this layer sits at
 * `-z-10`, and without `isolate` the negative z-index escapes the host's
 * stacking context and the grid paints BEHIND any opaque ancestor background,
 * i.e. it silently disappears (review #1).
 */
export function GridBackdrop({ pattern, className }: GridBackdropProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10",
        pattern === "dots" ? "grid-dots" : "grid-lines",
        className
      )}
    />
  );
}
