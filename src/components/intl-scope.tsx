import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";

/**
 * Server component. Hands the client components below it the listed
 * namespaces (plus the site-wide "chrome"/"common"), nothing else. Used from
 * route layouts whose pages mount client widgets with their own strings.
 *
 * Note: a nested NextIntlClientProvider replaces the parent's messages, it
 * does not merge, which is why pickMessages always re-adds the shared set.
 */
export async function IntlScope({
  namespaces,
  children,
}: {
  namespaces: readonly string[];
  children: ReactNode;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, namespaces)}>
      {children}
    </NextIntlClientProvider>
  );
}
