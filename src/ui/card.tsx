import type { Child } from "@/jsx";
import { cn } from "@/lib/utils";

/** The site's card: a hairline around a raised surface. `hover` brightens the hairline. */
export const Card = ({ hover, className, children }: { hover?: boolean; className?: string; children?: Child }) => (
  <div className={cn("rounded-xl border border-border bg-card", hover && "hover:border-border-strong", className)}>{children}</div>
);
