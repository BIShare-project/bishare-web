"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Autonyms — each language written in its own script. */
const NAMES: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português (BR)",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
  ja: "日本語",
  ko: "한국어",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
};

/**
 * A representative flag per language. Language ≠ country, so these are the
 * conventional stand-ins (e.g. Arabic → 🇸🇦, Traditional Chinese → 🇹🇼). Note:
 * Windows has no flag-emoji glyphs and shows the 2-letter code instead — the
 * autonym beside it keeps every row legible there.
 */
const FLAGS: Record<string, string> = {
  en: "🇬🇧",
  id: "🇮🇩",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  "pt-BR": "🇧🇷",
  ru: "🇷🇺",
  ar: "🇸🇦",
  hi: "🇮🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  "zh-Hans": "🇨🇳",
  "zh-Hant": "🇹🇼",
};

const SHORT: Record<string, string> = {
  en: "EN",
  id: "ID",
  es: "ES",
  fr: "FR",
  de: "DE",
  "pt-BR": "PT",
  ru: "RU",
  ar: "AR",
  hi: "HI",
  ja: "JA",
  ko: "KO",
  "zh-Hans": "中",
  "zh-Hant": "繁",
};

/**
 * Header language picker. Switches to the SAME page in the chosen locale using
 * the locale-aware router (usePathname returns the locale-stripped path, so
 * router.replace(pathname, {locale}) lands on e.g. /id/features).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("chrome");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(l: string) {
    setOpen(false);
    if (l !== locale) router.replace(pathname, { locale: l });
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("changeLanguage")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border-strong px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">{SHORT[locale] ?? locale.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-52 overflow-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/25"
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={l === locale}
              onClick={() => switchTo(l)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                l === locale
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="text-base leading-none">{FLAGS[l]}</span>
                {NAMES[l] ?? l}
              </span>
              {l === locale && <Check className="h-3.5 w-3.5 text-accent-blue" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
