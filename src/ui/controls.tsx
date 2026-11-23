import type { Child, ComponentProps } from "@/jsx";
import { type VariantProps, variants } from "@/ui/variants";
import { cn } from "@/lib/utils";

// The buttons and fields of the tools (upload, rooms, forms). Links that look like buttons: ./button.

/**
 * Brand button v2 (Nightglass): gradient pill with glow shadow, 300ms glow
 * transitions, active scale 0.98. Keep in sync with
 * `src/components/site/button-classes.ts` and `site/glow-button.tsx`.
 */
export const toolButton = /* @__PURE__ */ variants(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent font-medium tracking-[-0.01em] whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary hover:opacity-90 disabled:opacity-50",
        outline:
          "border-border-strong bg-transparent text-foreground hover:bg-secondary hover:border-foreground/25 aria-expanded:bg-secondary disabled:opacity-50",
        secondary:
          "bg-secondary text-foreground hover:bg-secondary/70 aria-expanded:bg-secondary disabled:opacity-50",
        ghost:
          "bg-transparent text-foreground hover:bg-secondary aria-expanded:bg-secondary disabled:opacity-50",
        destructive:
          "bg-destructive text-white hover:opacity-90 focus-visible:ring-destructive/20 disabled:opacity-50",
        link: "text-accent-blue underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default: "h-11 px-[18px] text-[15px]",
        xs: "h-8 gap-1.5 rounded-[10px] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-2 px-3.5 text-[13px]",
        lg: "h-[52px] px-[22px] text-base [&_svg:not([class*='size-'])]:size-[18px]",
        icon: "size-11",
        "icon-xs": "size-8 rounded-[10px] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-[10px]",
        "icon-lg": "size-[52px] [&_svg:not([class*='size-'])]:size-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export function ToolButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof toolButton>) {
  return (
    <button
      type="button"
      data-slot="button"
      className={cn(toolButton({ variant, size, className }))}
      {...props}
      {...(props.disabled ? { "data-disabled": "" } : {})}
    />
  )
}

export const roomButton = /* @__PURE__ */ variants(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export function RoomButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof roomButton>) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(roomButton({ variant, size, className }))}
      {...props}
    />
  )
}

export function ToolInput({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export function RoomInput({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

const GLOW_SIZES = { sm: "h-9 px-4 text-[13px] gap-2", md: "h-11 px-6 text-[15px] gap-2.5", lg: "h-[52px] px-8 text-base gap-2.5", xl: "h-14 px-9 text-base md:text-[17px] gap-3" };
const GLOW =
  "inline-flex items-center justify-center rounded-lg font-medium tracking-[-0.01em] whitespace-nowrap select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

/** The big button of a form. */
export function GlowButton({ children, size = "md", className, ...props }: { children?: Child; size?: keyof typeof GLOW_SIZES; type?: "button" | "submit"; disabled?: boolean; className?: string }) {
  return (
    <button className={cn(GLOW, GLOW_SIZES[size], "bg-primary text-primary-foreground border border-primary hover:opacity-90", className)} {...props}>
      {children}
    </button>
  );
}
