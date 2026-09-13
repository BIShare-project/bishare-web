import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { ArticleLanding } from "@/components/site/article-landing";

/**
 * High-intent SEO landing for the photo-specific cluster — "transfer photos
 * from iPhone to PC/computer" is the single largest query family in this
 * niche. Photo-first content (HEIC, Live Photos, quality, the iCloud 5 GB
 * wall) so it never duplicates the generic phone→PC page. Localized ×13 via
 * the "pcToPc" namespace; FAQPage JSON-LD for long-tail snippets.
 */

const SLUG = "/transfer-files-between-computers";
const NS = "pcToPc";

/* Comparison truth table — c1/c2 are the competitor columns named by COLS,
   c3 is always BIShare. Labels come from the namespace. */
const COLS = ["airdrop", "quick", "bishare"] as const;
const ROWS = [
  { id: "r0", c1: false, c2: true, c3: true },
  { id: "r1", c1: true, c2: false, c3: true },
  { id: "r2", c1: false, c2: true, c3: true },
  { id: "r3", c1: true, c2: false, c3: true },
  { id: "r4", c1: true, c2: false, c3: true },
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
