import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Namespace registry. Messages live in `src/messages/<locale>/<namespace>.json`
 * and are exposed to components under their namespace key
 * (`useTranslations("common")` reads `src/messages/<locale>/common.json`).
 *
 * TO ADD A NAMESPACE (per-page string extraction, later phases):
 *   1. Create `src/messages/en/<ns>.json` (+ the other locales as they are
 *      translated — missing files resolve to `{}` and never crash the load).
 *   2. Append "<ns>" to NAMESPACES below.
 *
 * We use an explicit list + a template-literal dynamic import (rather than a
 * filesystem glob) on purpose: the marketing surface runs on Cloudflare
 * Workers where there is no runtime filesystem, so message JSON must be part
 * of the bundle. The template import lets the bundler include every message
 * JSON under src/messages, and each namespace is resolved (or defaulted to
 * an empty object) at request time.
 */
const NAMESPACES = [
  "common",
  "home",
  "features",
  "flows",
  "security",
  "philosophy",
  "faq",
  "download",
  "how-it-works",
  "chrome",
  "about",
  "contact",
  "legal",
  "airdrop",
  "airdropWindows",
  "airdropAlt",
  "iphoneToAndroid",
  "androidToIphone",
  "pcToPhone",
  "phoneToPc",
  "macToWindows",
  "largeFiles",
  "wetransferAlt",
  "snapdropAlt",
  "sharedropAlt",
  "nearbyShareAlt",
  "shareitAlt",
  "firefoxSendAlt",
  "encryptedTransfer",
  "sendAnywhereAlt",
  "noAccountShare",
  "smashAlt",
  "wormholeAlt",
  "tool",
  "nearby",
  "beam",
  "offlineTransfer",
  "related",
  "cookies",
  "stats",
  "rooms",
  "bestApps",
  "localsendAlt",
  "photosIphonePc",
  "airdropFix",
  "pcToPc",
] as const;

async function loadNamespace(
  locale: string,
  ns: string
): Promise<Record<string, unknown>> {
  try {
    const mod = await import(`../messages/${locale}/${ns}.json`);
    return (mod.default ?? mod) as Record<string, unknown>;
  } catch {
    // Missing namespace file for this locale — treat as empty, never crash.
    return {};
  }
}

/** Deep-merge `over` on top of `base` (objects only — strings replace). */
function deepMerge(
  base: Record<string, unknown>,
  over: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] =
      v && b && typeof v === "object" && typeof b === "object" &&
      !Array.isArray(v) && !Array.isArray(b)
        ? deepMerge(b as Record<string, unknown>, v as Record<string, unknown>)
        : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // English is the fallback: a key missing from a locale file renders the
  // English string instead of a raw message key. Locale files win per-key.
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const localized = await loadNamespace(locale, ns);
      if (locale === routing.defaultLocale) return [ns, localized] as const;
      const base = await loadNamespace(routing.defaultLocale, ns);
      return [ns, deepMerge(base, localized)] as const;
    })
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
  };
});
