import { cn } from "@/lib/utils";

/**
 * Nightglass button classes for plain anchors and elements that can't use a
 * component. Primary = brand-gradient pill with glow (matches <GlowButton>,
 * minus the magnetic JS). Keep visually in sync with
 * `src/components/site/glow-button.tsx` and `src/components/ui/button.tsx`.
 */
export type BrandButtonVariant = "primary" | "outline" | "ghost";
export type BrandButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-[-0.01em] whitespace-nowrap transition-[opacity,background-color,border-color] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const SIZES: Record<BrandButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[15px]",
  lg: "h-[52px] px-8 text-base",
};

const VARIANTS: Record<BrandButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary hover:opacity-90",
  outline:
    "border border-border-strong bg-transparent text-foreground hover:bg-secondary hover:border-foreground/25",
  ghost: "bg-transparent text-foreground hover:bg-secondary",
};

export function brandButton(
  variant: BrandButtonVariant = "primary",
  size: BrandButtonSize = "md",
  className?: string
) {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}
