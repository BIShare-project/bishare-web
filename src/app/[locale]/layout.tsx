import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import { hasLocale } from "next-intl";
import { routing, dirForLocale } from "@/i18n/routing";
import { plexSans, plexMono } from "./fonts";
import { NavigationProgress } from "@/components/site/navigation-progress";

/**
 * Root layout for the MARKETING surface (bishare.app). This is where the
 * marketing subtree owns <html>/<body> — moved off the shared
 * src/app/layout.tsx so `lang`/`dir` can vary per locale. admin.bishare.app
 * and app.bishare.app own their own <html> in their respective root layouts.
 *
 * `className="dark"` is the server-rendered default (Nightglass is dark-first);
 * the theme-boot script in (site)/layout.tsx reconciles it to the stored/OS
 * choice before paint, so suppressHydrationWarning is required here.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Unknown locale → 404 (renders through (site)/not-found.tsx).
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale subtree.
  setRequestLocale(locale);

  // Client components site-wide only read "chrome"/"common"; routes with
  // their own client widgets add namespaces in a nested layout (IntlScope).
  // Without an explicit `messages` prop the provider inlines every namespace
  // into each page's RSC payload (~776 KB per URL).
  const messages = pickMessages(await getMessages(), []);

  return (
    <html
      lang={locale}
      dir={dirForLocale(locale)}
      className="dark"
      suppressHydrationWarning
    >
      <body className={`${plexSans.variable} ${plexMono.variable}`}>
        {/* Warm the TLS connection to the API (config, room signaling, transfers)
            before the client widgets need it. */}
        <link rel="preconnect" href="https://api.bishare.app" />
        <NavigationProgress />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
