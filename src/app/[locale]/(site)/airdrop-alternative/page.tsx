import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { ArticleLanding } from "@/components/site/article-landing";

/**
 * High-intent SEO landing targeting "AirDrop for Windows" / "AirDrop for PC" and
 * the cluster of iPhone/Mac ↔ Windows transfer queries. Fully localized across
 * all 13 locales via the "airdropAlt" namespace, with FAQPage structured
 * data for long-tail snippets. Sibling of /airdrop-for-android (same template).
 */

const SLUG = "/airdrop-alternative";
const NS = "airdropAlt";

/* Comparison truth table — c1/c2 are the competitor columns named by COLS,
   c3 is always BIShare. Labels come from the namespace. */
const COLS = ["airdrop", "quick", "bishare"] as const;
const ROWS = [
  { id: "r0", c1: false, c2: false, c3: true },
  { id: "r1", c1: false, c2: false, c3: true },
  { id: "r2", c1: false, c2: false, c3: true },
  { id: "r3", c1: true, c2: false, c3: true },
  { id: "r4", c1: true, c2: true, c3: true },
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
