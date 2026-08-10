import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Blue glow accent — the "active transfer" treatment. */
  accent?: boolean;
  /** "card" (20px radius) or "modal" (24px radius, deeper shadow, max-w 420px). */
  size?: "card" | "modal";
}

/**
 * Geist redesign: a clean hairline-bordered card (the translucent glass fill +
 * gradient border are retired). API preserved. `accent` adds a subtle blue
 * ring; `size="modal"` deepens the shadow and caps the width.
 */
export function GlassCard({
  children,
  className,
  accent = false,
  size = "card",
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5",
        size === "modal" && "shadow-xl shadow-black/20 max-w-[420px]",
        accent && "ring-1 ring-accent-blue/30",
        className
      )}
    >
      {children}
    </div>
  );
}
