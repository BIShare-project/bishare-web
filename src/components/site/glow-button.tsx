"use client";

import { Link } from "@/i18n/navigation";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { SPRING_MAGNETIC } from "@/lib/motion";

const MotionLink = motion.create(Link);

type GlowButtonSize = "sm" | "md" | "lg" | "xl";
type GlowButtonVariant = "primary" | "ghost";

interface GlowButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  size?: GlowButtonSize;
  variant?: GlowButtonVariant;
  /** Subtle translate toward the cursor (±6px). Off under reduced motion. */
  magnetic?: boolean;
  /** Animated glow pulse — hero CTA only. */
  pulse?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

const SIZES: Record<GlowButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] gap-2",
  md: "h-11 px-6 text-[15px] gap-2.5",
  lg: "h-[52px] px-8 text-base gap-2.5",
  xl: "h-14 px-9 text-base md:text-[17px] gap-3",
};

const VARIANTS: Record<GlowButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary hover:opacity-90",
  ghost:
    "bg-transparent text-foreground border border-border-strong hover:bg-secondary hover:border-foreground/25",
};

const BASE =
  "inline-flex items-center justify-center rounded-lg font-medium tracking-[-0.01em] whitespace-nowrap select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 transition-[opacity,background-color,border-color] duration-200 [&_svg]:shrink-0";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Nightglass pill button (§2.5): brand-gradient fill, colored glow shadow,
 * magnetic hover (framer springs), optional hero glow pulse. Renders a
 * Next Link for internal hrefs, <a> for external, <button> otherwise.
 */
export function GlowButton({
  children,
  href,
  onClick,
  size = "md",
  variant = "primary",
  magnetic = true,
  pulse = false,
  type = "button",
  disabled,
  className,
  "aria-label": ariaLabel,
}: GlowButtonProps) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING_MAGNETIC);
  const sy = useSpring(y, SPRING_MAGNETIC);
  const magneticOn = magnetic && !reduced;

  function onMove(e: MouseEvent<HTMLElement>) {
    if (!magneticOn) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set(clamp((e.clientX - (r.left + r.width / 2)) * 0.18, -6, 6));
    y.set(clamp((e.clientY - (r.top + r.height / 2)) * 0.18, -6, 6));
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  const cls = cn(
    BASE,
    SIZES[size],
    VARIANTS[variant],
    pulse && variant === "primary" && "glow-pulse",
    className
  );
  const motionProps = {
    className: cls,
    style: magneticOn ? { x: sx, y: sy } : undefined,
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    whileTap: reduced ? undefined : { scale: 0.97 },
    "aria-label": ariaLabel,
  };

  if (href) {
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          {...motionProps}
        >
          {children}
        </motion.a>
      );
    }
    return (
      <MotionLink href={href} onClick={onClick} {...motionProps}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
