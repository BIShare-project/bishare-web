import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardGlow = "none" | "blue" | "violet";

interface GradientBorderCardProps {
  children: ReactNode;
  className?: string;
  /**
   * Spinning conic border ring (§1.5B). Reserve for the hero widget plus at
   * most one card per section — everything else uses the static gradient.
   */
  animated?: boolean;
  /** Translucent fill + backdrop blur (default). Set false for solid card. */
  glass?: boolean;
  /** Colored glow shadow. "violet" max once per page. */
  glow?: CardGlow;
  /** Radius scale: md 16 / lg 20 / xl 24. */
  radius?: "md" | "lg" | "xl";
}

const RADIUS: Record<NonNullable<GradientBorderCardProps["radius"]>, string> = {
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-xl",
};

/**
 * THE core Nightglass surface: 1px gradient border + glass fill + inner glow.
 * Static variant is zero-JS and server-safe; `animated` adds the spinning
 * conic ring (CSS-only, honors prefers-reduced-motion with a static ring).
 * The spin is compositor-only: a `.conic-ring` child clips a rotating
 * oversized conic-gradient layer to the 1px mask ring (review #11).
 */
export function GradientBorderCard({
  children,
  className,
  glow = "none",
  radius = "lg",
}: GradientBorderCardProps) {
  // Geist redesign: a clean hairline-bordered card. The old conic/gradient
  // borders + glass fill are retired; `glow="blue"` becomes a subtle
  // border-brighten on hover. `animated`/`glass` are accepted but no-ops.
  return (
    <div
      className={cn(
        RADIUS[radius],
        "border border-border bg-card",
        glow !== "none" &&
          "transition-colors duration-300 hover:border-border-strong",
        className
      )}
    >
      {children}
    </div>
  );
}
