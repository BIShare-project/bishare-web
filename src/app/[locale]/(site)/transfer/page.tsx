import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { bumpStat } from "@/lib/stats-bump";
import { buildAlternates } from "@/i18n/metadata";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { TransferWidget } from "@/components/site/transfer-widget";
import { AppPromo } from "@/components/app-promo";
import { YourUploads } from "./your-uploads";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "flows" });
  const description = t("transferLanding.metaDescription");
  return {
    title: t("transferLanding.metaTitle"),
    description,
    alternates: buildAlternates(locale, "/transfer"),
    openGraph: {
      title: t("transferLanding.ogTitle"),
      description,
      type: "website",
      siteName: "BIShare",
    },
  };
}

/**
 * Dedicated transfer tool — a focused, product-first page (not embedded in the
 * marketing home). Send a file to get a shareable link/QR/code, or receive one
 * by entering a code. The send/receive tool is the whole page.
 */
export default async function TransferToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tool");

  // Receive-loop conversion: this visit came from a transfer's "Send a file"
  // CTA — a recipient becoming a sender. Count it (best-effort).
  if ((await searchParams).ref === "recv") bumpStat("loop_sends");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12 md:py-16">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("page.eyebrow")}
          </p>
          <h1 className="mt-4 text-[clamp(2rem,4.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
            {t("page.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
            {t("page.subtitle")}
          </p>
        </div>

        <div className="mt-9 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <TransferWidget />
        </div>

        <YourUploads />
        <AppPromo />
      </main>
      <SiteFooter />
    </div>
  );
}
