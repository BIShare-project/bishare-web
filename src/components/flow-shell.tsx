import type { Child } from "@/jsx";
import { SiteHeader } from "@/ui/header";
import { cn } from "@/lib/utils";

/**
 * Shared layout for the functional deep-link pages (/transfer, /share,
 * /request) — Geist: sticky header + a centered column over the faint
 * hairline grid.
 */
export function FlowShell({
  children,
  maxWidthClassName = "max-w-md",
}: {
  children: Child;
  maxWidthClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-6 py-14 md:py-20">
        <div className="geist-grid pointer-events-none absolute inset-0 -z-10" />
        <div className={cn("w-full", maxWidthClassName)}>{children}</div>
      </main>
    </div>
  );
}
