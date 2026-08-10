"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const THEME_KEY = "bishare-theme";

/** --background token values; keep in sync with globals.css + layout.tsx. */
const THEME_COLORS = { light: "#f7f9fd", dark: "#030711" } as const;

/**
 * Keeps `<meta name="theme-color">` in sync with a manual theme switch
 * (review #5) — the media-scoped metas from layout.tsx only follow the OS
 * preference, so all of them get the active color; browsers then show the
 * right chrome color whichever meta they pick.
 */
function syncThemeColorMeta(light: boolean) {
  const color = light ? THEME_COLORS.light : THEME_COLORS.dark;
  const metas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
    return;
  }
  metas.forEach((meta) => meta.setAttribute("content", color));
}

/**
 * Theme toggle (Nightglass §2.13). Both icons render always and CSS gates
 * which one shows (`.light` on <html>), so the server markup never depends
 * on the theme — zero hydration mismatch. The swap animation (rotate-in)
 * lives in globals.css, gated behind prefers-reduced-motion.
 *
 * Persists the explicit choice to localStorage; the boot script in
 * layout.tsx then stops following the OS preference.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("chrome");

  function toggle() {
    const root = document.documentElement;
    const light = !root.classList.contains("light");
    root.classList.toggle("light", light);
    root.classList.toggle("dark", !light);
    syncThemeColorMeta(light);
    try {
      localStorage.setItem(THEME_KEY, light ? "light" : "dark");
    } catch {
      // Storage unavailable (private mode) — the toggle still works for the session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("themeToggleLabel")}
      className={cn(
        "theme-toggle flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-foreground transition-colors duration-300 hover:border-[rgba(96,165,250,0.4)] hover:bg-foreground/[0.04] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Sun className="theme-icon-sun h-4 w-4" aria-hidden />
      <Moon className="theme-icon-moon h-4 w-4" aria-hidden />
    </button>
  );
}
