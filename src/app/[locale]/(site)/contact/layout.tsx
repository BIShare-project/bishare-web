import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { IntlScope } from "@/components/intl-scope";

// Client components under this route read these namespaces; see
// src/i18n/client-messages.ts for why the site-wide provider carries so little.
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <IntlScope namespaces={["contact"]}>{children}</IntlScope>;
}
