import type { AbstractIntlMessages } from "next-intl";

/**
 * Namespaces every page hands to the client. Only client components
 * (`"use client"`) read messages through NextIntlClientProvider; server
 * components use getTranslations() and never touch this list.
 *
 * Site-wide client components: SiteHeader, ThemeToggle, LanguageSwitcher,
 * InstallApp and StoreButtons read "chrome"; "common" is 78 bytes.
 *
 * A page whose client tree needs more (transfer, rooms, download, features,
 * contact, privacy, terms) declares that in a route layout via <IntlScope>.
 * Before this split the provider inherited every namespace, so each of the
 * 546 URLs inlined ~776 KB of the whole site's translations (Lighthouse
 * mobile LCP 5.3 s on a guide page whose LCP element was a paragraph).
 */
export const SHARED_CLIENT_NAMESPACES = ["chrome", "common"] as const;

export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[]
): AbstractIntlMessages {
  const out: AbstractIntlMessages = {};
  for (const ns of new Set([...SHARED_CLIENT_NAMESPACES, ...namespaces])) {
    if (ns in messages) out[ns] = messages[ns];
  }
  return out;
}
