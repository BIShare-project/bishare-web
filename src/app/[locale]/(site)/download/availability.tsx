import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SUPPORT_EMAIL = "support@billiongroup.net";

/**
 * mailto fallback for "tell me when it ships" — no list, straight to support.
 * The subject line is passed in already-localized by the caller (which has a
 * translator in scope); this helper stays a pure string builder.
 */
export function notifyHref(subject: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Honest availability state: a deliberately non-interactive pill for builds
 * that don't exist yet. Styled to read as "not ready" (dashed hairline, muted
 * fill) — never a dead link, never focusable.
 */
export function ComingSoonPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-disabled="true"
      className={cn(
        "inline-flex h-11 cursor-not-allowed select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-dashed border-border-strong bg-secondary px-5 text-sm font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
