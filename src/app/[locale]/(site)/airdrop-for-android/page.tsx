import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { ArticleLanding } from "@/components/site/article-landing";

/**
 * High-intent SEO landing page targeting "AirDrop for Android" and the cluster
 * of iPhone↔Android transfer queries. Fully localized across all 13 locales via
 * the "airdrop" namespace — the H1 + metadata target each locale's own phrasing
 * of the query. Includes FAQPage structured data (built from the translated FAQ)
 * for long-tail featured snippets.
 */

const SLUG = "/airdrop-for-android";
const NS = "airdrop";

/* Comparison truth table — c1/c2 are the competitor columns named by COLS,
   c3 is always BIShare. Labels come from the namespace. */
const COLS = ["airdrop", "quick", "bishare"] as const;
const ROWS = [
  { id: "iphoneAndroid", c1: false, c2: false, c3: true },
  { id: "winLinux", c1: false, c2: false, c3: true },
  { id: "noApp", c1: true, c2: false, c3: true },
  { id: "crossPlatform", c1: false, c2: false, c3: true },
  { id: "free", c1: true, c2: true, c3: true },
];

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
  return <ArticleLanding namespace={NS} slug={SLUG} rows={ROWS} cols={[...COLS]} />;
}
