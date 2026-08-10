import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Geist/Vercel button — the sharp, high-contrast primitive: a solid INVERT
 * primary (black-on-white in light, white-on-black in dark, driven by the
 * --primary token flip) and a hairline-bordered secondary. Small radius, crisp
 * hover, no gradient, no glow. Renders a Next Link for internal hrefs, an <a>
 * for external, a <button> otherwise.
 */
type VButtonVariant = "primary" | "secondary";
type VButtonSize = "sm" | "md" | "lg";

const SIZES: Record<VButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-lg",
};

const VARIANTS: Record<VButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary hover:opacity-90",
  secondary:
    "bg-transparent text-foreground border border-border-strong hover:bg-secondary hover:border-foreground/25",
};

const BASE =
  "inline-flex items-center justify-center font-medium tracking-[-0.01em] whitespace-nowrap select-none outline-none transition-[opacity,background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

interface VButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: VButtonVariant;
  size?: VButtonSize;
  type?: "button" | "submit";
  className?: string;
  "aria-label"?: string;
}

export function VButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  className,
  "aria-label": ariaLabel,
}: VButtonProps) {
  const cls = cn(BASE, SIZES[size], VARIANTS[variant], className);
  const external = href && /^https?:\/\//.test(href);

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={cls}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
