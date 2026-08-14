"use client";

import { useEffect } from "react";

/**
 * Remounts on every route navigation (template semantics), so its effect
 * firing = the new page tree is committed to the DOM. NavigationProgress
 * listens for this to finish the top loading bar — usePathname can't be the
 * signal because the App Router updates it optimistically at navigation
 * START, not completion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  // Mount-only ([]): a template re-render during a *pending* transition must
  // not fire this — only the fresh mount that comes with the committed page.
  useEffect(() => {
    window.dispatchEvent(new Event("bishare:navigated"));
  }, []);
  return children;
}
