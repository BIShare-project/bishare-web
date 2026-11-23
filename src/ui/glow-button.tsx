import { cn } from "@/lib/utils";
import type { Child } from "@/jsx";

const SIZES = { sm: "h-9 px-4 text-[13px] gap-2", md: "h-11 px-6 text-[15px] gap-2.5", lg: "h-[52px] px-8 text-base gap-2.5", xl: "h-14 px-9 text-base md:text-[17px] gap-3" };
const BASE =
  "inline-flex items-center justify-center rounded-lg font-medium tracking-[-0.01em] whitespace-nowrap select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 transition-[opacity,background-color,border-color] duration-200 [&_svg]:shrink-0";

/** The big button of a form. */
export function GlowButton({ children, size = "md", className, ...props }: { children?: Child; size?: keyof typeof SIZES; type?: "button" | "submit"; disabled?: boolean; className?: string }) {
  return (
    <button className={cn(BASE, SIZES[size], "bg-primary text-primary-foreground border border-primary hover:opacity-90", className)} {...props}>
      {children}
    </button>
  );
}
