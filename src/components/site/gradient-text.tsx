import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Brand gradient text (blue → sky → cyan → periwinkle). Use on 1–3 words
 * inside a heading. `shimmer` animates the background-position (hero
 * headline only); without it the gradient is static — which is also the
 * reduced-motion fallback.
 */
export function GradientText({
  children,
  className,
  shimmer = false,
}: {
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
}) {
  return (
    <span className={cn("text-shimmer", shimmer && "animate", className)}>
      {children}
    </span>
  );
}
