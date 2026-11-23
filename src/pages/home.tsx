import type { Metadata } from "@/site/metadata";
import { getTranslations } from "@/i18n/translate";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { SiteHeader } from "@/ui/header";
import { SiteFooter } from "@/ui/footer";
import { Home } from "@/components/home/home";
import { AppJsonLd } from "@/lib/app-ld";

export async function generateMetadata({ locale }: { locale: string }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("meta.title");
  const description = t("meta.description");

  return {
    // `absolute` bypasses the "%s — BIShare" template so the home title reads
    // as the full brand line, not a suffixed page name.
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/"),
    ...sharedOpenGraph(title, description, "/", undefined, locale),
  };
}

export default async function HomePage() {

  return (
    <div className="min-h-screen bg-background">
      <AppJsonLd />
      <SiteHeader />
      <Home />
      <SiteFooter />
    </div>
  );
}
