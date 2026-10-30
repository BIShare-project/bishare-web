import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPromo } from "@/components/app-promo";
import { FlowShell } from "@/components/flow-shell";
import { DriveLink } from "./drive-link";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

/**
 * A link from someone's BIShare Drive (drive-plan.md 6B.3). Everything about
 * it is sealed with the key after `#`, which the server never sees, so the
 * page is the same for every link until the browser opens it; it is never
 * indexed.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "flows" });
  const image = {
    url: `/img/transfer-share/hero.${locale}.jpg`,
    width: 1200,
    height: 630,
    alt: `${t("art.hero.title")}. ${t("art.hero.sub")}`,
  };
  return {
    title: t("driveLink.metaTitle"),
    description: t("driveLink.metaDesc"),
    openGraph: { title: t("driveLink.metaTitle"), description: t("driveLink.metaDesc"), type: "website", siteName: "BIShare", images: [image] },
    twitter: { card: "summary_large_image", title: t("driveLink.metaTitle"), description: t("driveLink.metaDesc"), images: [{ url: image.url, alt: image.alt }] },
    robots: { index: false, follow: false },
  };
}

export default async function DriveLinkPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <FlowShell maxWidthClassName="max-w-xl">
      <DriveLink id={id} />
      <AppPromo campaign="drive_link" />
    </FlowShell>
  );
}
