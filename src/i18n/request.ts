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
  "pricing",
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

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const entries = await Promise.all(
    NAMESPACES.map(
      async (ns) => [ns, await loadNamespace(locale, ns)] as const
    )
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
  };
});
