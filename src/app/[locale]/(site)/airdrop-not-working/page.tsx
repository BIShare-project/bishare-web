import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { ArticleLanding } from "@/components/site/article-landing";

/**
 * Troubleshooting landing for "AirDrop not working" — the seven fixes are the
 * content the searcher came for, so they run before everything else. No
 * comparison table here; the page ends on why a cross-platform tool avoids the
 * problem in the first place.
 */

const SLUG = "/airdrop-not-working";
const NS = "airdropFix";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, SLUG),
    ...sharedOpenGraph(title, description, SLUG),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ArticleLanding
      namespace={NS}
      slug={SLUG}
      rows={[]}
      leadSections={[{ id: "fixes", key: "fixes", count: 7 }]}
    />
  );
}
