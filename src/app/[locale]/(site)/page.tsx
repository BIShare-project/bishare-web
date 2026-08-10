import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Home } from "@/components/home/home";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("meta.title");
  const description = t("meta.description");

  return {
    // `absolute` bypasses the "%s — BIShare" template so the home title reads
    // as the full brand line, not a suffixed page name.
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/"),
    ...sharedOpenGraph(title, description, "/"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Home />
      <SiteFooter />
    </div>
  );
}
