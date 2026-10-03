import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { IntlScope } from "@/components/intl-scope";

// The page embeds the Nearby tool, a client component that reads the "nearby"
// namespace; see src/i18n/client-messages.ts for why the site-wide provider
// does not carry it.
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <IntlScope namespaces={["nearby"]}>{children}</IntlScope>;
}
