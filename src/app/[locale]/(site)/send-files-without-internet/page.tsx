import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { ComparisonLanding } from "@/components/site/comparison-landing";

const SLUG = "/send-files-without-internet";
const NS = "offlineTransfer";

const ROWS = [
  { id: "r0", c1: true, c2: false, c3: true },
  { id: "r1", c1: false, c2: true, c3: true },
  { id: "r2", c1: false, c2: false, c3: true },
  { id: "r3", c1: false, c2: false, c3: true },
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
    ...sharedOpenGraph(t("meta.ogTitle"), description, SLUG),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ComparisonLanding namespace={NS} slug={SLUG} rows={ROWS} />;
}
