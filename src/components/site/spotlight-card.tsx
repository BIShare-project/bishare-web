import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** No-op (kept for API compat). */
  radius?: number;
  /** Render the hairline border + card fill (default). */
  border?: boolean;
  /** No-op (kept for API compat). */
  glass?: boolean;
}

/**
 * Geist redesign: a clean hairline-bordered card. The cursor-tracked spotlight
 * and gradient/glass border are retired; the API is preserved so pages that
 * used it render unchanged in structure. `radius`/`glass` are accepted no-ops.
 */
export function SpotlightCard({
  children,
  className,
  border = true,
}: SpotlightCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        border && "border border-border bg-card",
        className
      )}
    >
      {children}
    </div>
  );
}
