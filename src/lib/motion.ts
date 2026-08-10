import type { MotionProps } from "framer-motion";

/** Shared easeOut curve — entrances (Flutter easeOutCubic-equivalent). */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Symmetric ease — loops and tab panel swaps. */
export const EASE_INOUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

/** Spring presets: magnetic buttons + pop-in elements. */
export const SPRING_MAGNETIC = { stiffness: 300, damping: 20 } as const;
export const SPRING_POP = { stiffness: 260, damping: 22 } as const;

/**
 * Standard scroll reveal: fade-up 14px over 0.5s, fires once.
 * Spread onto a `motion.*` element: `<motion.div {...fadeUp}>`.
 */
export const fadeUp: MotionProps = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: EASE_OUT },
};

/** fadeUp with a per-item delay — use for grid children (70ms stagger). */
export function fadeUpAt(index: number, step = 0.07): MotionProps {
  return {
    ...fadeUp,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
      delay: staggerDelay(index, step),
    },
  };
}

/** Blur-in reveal — section headings, hero copy (Nightglass default). */
export const revealBlur: MotionProps = {
  initial: { opacity: 0, y: 20, filter: "blur(10px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: EASE_OUT },
};

/** Clip-wipe reveal — cards and mocks (wipe up from the bottom edge). */
export const revealClip: MotionProps = {
  initial: { opacity: 0, clipPath: "inset(12% 0 88% 0 round 20px)" },
  whileInView: { opacity: 1, clipPath: "inset(0% 0 0% 0 round 20px)" },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: EASE_OUT },
};

/** Scale reveal — small chips/tiles. */
export const revealScale: MotionProps = {
  initial: { opacity: 0, scale: 0.94 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: EASE_OUT },
};

/**
 * Capped stagger delay: grids 90ms/child, lists 70ms, hero lines 80ms.
 * Total stagger never exceeds 500ms so late grid items don't feel broken.
 */
export function staggerDelay(index: number, step = 0.09): number {
  return Math.min(index * step, 0.5);
}

/** Parent-driven stagger (70ms between children). */
export const stagger: MotionProps = {
  whileInView: { transition: { staggerChildren: 0.07 } },
};
