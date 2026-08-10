import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Brand button v2 (Nightglass): gradient pill with glow shadow, 300ms glow
 * transitions, active scale 0.98. Keep in sync with
 * `src/components/site/button-classes.ts` and `site/glow-button.tsx`.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent font-medium tracking-[-0.01em] whitespace-nowrap transition-[opacity,background-color,border-color,transform] duration-200 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
