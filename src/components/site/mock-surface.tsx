import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The shared surface for every product mock on the marketing site (features
 * flagships, security visuals). Same HUD language as the security-page E2E
 * diagram: hairline card, edge-faded grid, a top light-catch line, and — for
 * the "live" ones — an accent bloom plus corner ticks.
 *
 * Server-safe and zero-JS; the optional motion lives in `.hud-*` / `.metric-*`
 * classes in site.css, all gated behind prefers-reduced-motion.
 */
export function MockSurface({
  children,
  className,
  /** The "active" treatment: accent bloom + accent ring. One per section. */
  accent = false,
  /** HUD corner ticks. Reserve for the largest mock in a section. */
  ticks = false,
  /** Drop the default padding (browser chrome mocks bring their own). */
  bare = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  ticks?: boolean;
  bare?: boolean;
}) {
  return (
    <div
      className={cn(
        "frame-top-line relative isolate overflow-hidden rounded-xl border border-border bg-card",
        accent && "ring-1 ring-accent-blue/20",
        !bare && "p-5",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="hud-grid absolute inset-0" />
        {accent && <div className="hud-bloom absolute inset-0" />}
      </div>

      {ticks && (
        <>
          <span
            className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 border-l border-t border-border-strong"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 border-r border-t border-border-strong"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b border-l border-border-strong"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r border-border-strong"
            aria-hidden
          />
        </>
      )}

      {children}
    </div>
  );
}

const TILE_SIZE = {
  sm: "h-9 w-9 rounded-lg [&>svg]:h-4 [&>svg]:w-4",
  md: "h-11 w-11 rounded-lg [&>svg]:h-5 [&>svg]:w-5",
  lg: "h-12 w-12 rounded-[12px] [&>svg]:h-6 [&>svg]:w-6",
} as const;

/**
 * Bordered icon tile — the repeated unit in every mock. `accent` adds the
 * gradient fill + inner light used on the E2E diagram's device tiles.
 */
export function IconTile({
  icon: Icon,
  size = "md",
  accent = false,
  className,
}: {
  icon: LucideIcon;
  size?: keyof typeof TILE_SIZE;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-border text-foreground",
        TILE_SIZE[size],
        accent ? "hud-tile" : "bg-background",
        className
      )}
    >
      <Icon />
    </div>
  );
}

/**
 * Progress meter. The fill is static (the honest state of the mock); the
 * motion is a light sweep travelling across it, so nothing ever reads as a
 * stalled or looping-from-zero transfer.
 */
export function MetricBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-border", className)}
      aria-hidden
    >
      <div
        className="metric-fill h-full rounded-full bg-accent-blue"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
