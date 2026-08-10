"use client";

import {
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT, revealBlur, revealClip, revealScale } from "@/lib/motion";

/**
 * Root motion provider. `reducedMotion="user"` collapses all framer-motion
 * transforms to opacity-only when the OS requests reduced motion.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds. Use `staggerDelay(i)` for grids. */
  delay?: number;
}

interface FadeUpProps extends RevealProps {
  /** Vertical travel in px (12–16 band; hero uses 16). */
  y?: number;
  duration?: number;
}

/**
 * Standard scroll reveal: fade-up on first entry into the viewport.
 * Server components can use this directly (children pass through).
 */
export function FadeUp({
  children,
  className,
  delay = 0,
  y = 14,
  duration = 0.5,
}: FadeUpProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Blur-in scroll reveal (Nightglass headings + copy). */
export function RevealBlur({ children, className, delay = 0 }: RevealProps) {
  const { transition, ...rest } = revealBlur;
  return (
    <motion.div
      className={className}
      {...rest}
      transition={{ ...(transition as object), delay }}
    >
      {children}
    </motion.div>
  );
}

/** Clip-wipe scroll reveal (cards + mocks). */
export function RevealClip({ children, className, delay = 0 }: RevealProps) {
  const { transition, ...rest } = revealClip;
  return (
    <motion.div
      className={className}
      {...rest}
      transition={{ ...(transition as object), delay }}
    >
      {children}
    </motion.div>
  );
}

/** Scale scroll reveal (small chips/tiles). */
export function RevealScale({ children, className, delay = 0 }: RevealProps) {
  const { transition, ...rest } = revealScale;
  return (
    <motion.div
      className={className}
      {...rest}
      transition={{ ...(transition as object), delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll parallax wrapper (home hero aurora only): translates children
 * -60px over the first 600px of scroll. Renders a static div under
 * reduced motion.
 */
export function ParallaxLayer({
  children,
  className,
  range = -60,
}: RevealProps & { range?: number }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, range]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} style={{ y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}
