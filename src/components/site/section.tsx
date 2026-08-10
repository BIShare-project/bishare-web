import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RevealBlur } from "./motion";
import { AuroraBackground } from "./aurora-background";
import { GridBackdrop } from "./grid-backdrop";

interface SectionProps {
  children: ReactNode;
  className?: string;
  /** Inner container class; defaults to the marketing width. */
  containerClassName?: string;
  id?: string;
  /**
   * Ambient backdrop layer. "aurora" is animated — never combine with
   * another animated background in the same viewport.
   */
  backdrop?: "none" | "dots" | "lines" | "aurora";
}

/** Standard page section: py-20 md:py-24 with a max-w-7xl px-6 container. */
export function Section({
  children,
  className,
  containerClassName,
  id,
  backdrop = "none",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 md:py-24",
        // `isolate` scopes the backdrops' negative z-index to this section so
        // they can never slip behind an opaque ancestor background (review #1)
        backdrop !== "none" && "relative isolate overflow-hidden",
        className
      )}
    >
      {backdrop === "dots" && <GridBackdrop pattern="dots" />}
      {backdrop === "lines" && <GridBackdrop pattern="lines" />}
      {backdrop === "aurora" && <AuroraBackground variant="section" />}
      <div className={cn("max-w-7xl mx-auto px-6", containerClassName)}>
        {children}
      </div>
    </section>
  );
}

interface SectionHeadingProps {
  /** Small mono eyebrow above the title, e.g. "Features". */
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  centered?: boolean;
  className?: string;
}

/**
 * Section header v2 (Nightglass §2.11): gradient mono eyebrow with an inline
 * gradient divider stub, display-scale H2, blur-in entrance.
 */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  centered = false,
  className,
}: SectionHeadingProps) {
  return (
    <RevealBlur className={cn("mb-14", centered && "text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "mb-4 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
            centered && "justify-center"
          )}
        >
          <span
            className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
            aria-hidden
          />
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-[2.75rem] md:leading-[1.1] font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            "text-muted-foreground mt-4 max-w-xl text-lg leading-relaxed",
            centered && "mx-auto"
          )}
        >
          {sub}
        </p>
      )}
    </RevealBlur>
  );
}
