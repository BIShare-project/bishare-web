import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { ArticleLanding } from "@/components/site/article-landing";

/**
 * High-intent SEO landing targeting "LocalSend alternative" and the cluster of
 * open-source / local-transfer queries. LocalSend is the most-recommended
 * open-source peer for same-network transfer, so this page meets that searcher
 * and shows what BIShare adds (link sharing + cloud) without disparaging it.
 * Fully localized via the "localsendAlt" namespace; FAQPage structured data.
 */

const SLUG = "/localsend-alternative";
const NS = "localsendAlt";

/* Comparison truth table — c1/c2 are the competitor columns named by COLS,
   c3 is always BIShare. Labels come from the namespace. */
const COLS = ["localsend", "snapdrop", "bishare"] as const;
const ROWS = [
  { id: "r0", c1: true, c2: true, c3: true },
  { id: "r1", c1: true, c2: true, c3: true },
  { id: "r2", c1: false, c2: false, c3: true },
  { id: "r3", c1: false, c2: true, c3: true },
  { id: "r4", c1: false, c2: false, c3: true },
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
