import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PillVariant = "online" | "primary" | "muted";

const PILL_STYLES: Record<PillVariant, { pill: string; dot: string }> = {
  online: {
    pill: "border border-border bg-background-raised text-muted-foreground",
    dot: "bg-success",
  },
  primary: {
    pill: "border border-border bg-background-raised text-muted-foreground",
    dot: "bg-accent-blue",
  },
  muted: {
    pill: "border border-border bg-background-raised text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

/** Status pill with dot (mirrors AppStatusPill). */
export function StatusPill({
  children,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  const styles = PILL_STYLES[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold",
        styles.pill,
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", styles.dot)} />
      {children}
    </span>
  );
}

/** Tiny uppercase tag chip (mirrors AppBadge — "TCP", "E2E"). */
export function TagBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] border border-border bg-background-raised px-[7px] py-[2px] font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Hero feature pill: icon + short label on a glass chip. */
export function FeaturePill({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background-raised px-3.5 py-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 text-foreground" />
      {children}
    </span>
  );
}
