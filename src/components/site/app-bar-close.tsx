"use client";

import { X } from "lucide-react";

/** Closes the Android app bar for good in this browser (see app-bar.tsx). */
export function AppBarClose({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        try {
          localStorage.setItem("bishare-app-bar", "1");
        } catch {
          /* closed for this page only */
        }
        document.documentElement.removeAttribute("data-app-bar");
      }}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
