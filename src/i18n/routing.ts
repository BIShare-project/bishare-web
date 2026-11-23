/**
 * Locale routing for the site (bishare.app / (site)).
 *
 * Order matters: `en` is the default and renders WITHOUT a URL prefix
 * (localePrefix "as-needed" → "/features"); every other locale is prefixed
 * ("/id/features", "/ar/features", …). `ar` is right-to-left (see the
 * per-locale <html dir> in src/site/layout/document.tsx).
 */
export const routing = {
  locales: [
    "en", // default — no URL prefix
    "id",
    "es",
    "fr",
    "de",
    "pt-BR",
    "ru",
    "ar", // RTL
    "hi",
    "ja",
    "ko",
    "zh-Hans",
    "zh-Hant",
  ],
  defaultLocale: "en",
} as const;

export type Locale = (typeof routing.locales)[number];

/** Locales that render right-to-left. */
export const RTL_LOCALES = new Set<string>(["ar"]);

export function dirForLocale(locale: string): "rtl" | "ltr" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}
