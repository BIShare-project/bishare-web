import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { bumpStat } from "@/lib/stats-bump";
import { buildAlternates } from "@/i18n/metadata";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { TransferStudio } from "@/components/site/transfer-studio";
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

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (["0", "1", "2", "3", "4"] as const).map((i) => ({
      "@type": "Question",
      name: t(`seo.faq.items.${i}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`seo.faq.items.${i}.a`) },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-7 md:py-10">
        <div className="text-center">
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
            {t("page.eyebrow")}
          </p>
          <h1 className="mt-2 text-[clamp(1.75rem,4.5vw,2.75rem)] sm:mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
            {t("page.title")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
            {t("page.subtitle")}
          </p>
        </div>

        <div className="mt-7">
          <TransferStudio />
        </div>

        <div className="mx-auto w-full max-w-xl">
          <YourUploads />
        </div>

        {/* SEO body: what this tool is, how it works, and the questions
            searchers actually ask — with matching FAQPage structured data. */}
        <p className="mx-auto mt-16 max-w-2xl text-center text-[15px] leading-relaxed text-muted-foreground">
          {t("seo.lead")}
        </p>

        <section aria-labelledby="how-title" className="mt-14">
          <h2
            id="how-title"
            className="text-center text-2xl font-semibold tracking-[-0.02em]"
          >
            {t("seo.how.title")}
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {(["0", "1", "2"] as const).map((i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-card p-5"
              >
                <span className="font-mono text-[12px] font-semibold text-accent-blue">
                  {Number(i) + 1}
                </span>
                <h3 className="mt-2 font-semibold">
                  {t(`seo.how.items.${i}.h`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`seo.how.items.${i}.b`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="faq-title"
          className="mx-auto mt-14 w-full max-w-2xl"
        >
          <h2
            id="faq-title"
            className="text-center text-2xl font-semibold tracking-[-0.02em]"
          >
            {t("seo.faq.title")}
          </h2>
          <div className="mt-5 space-y-3">
            {(["0", "1", "2", "3", "4"] as const).map((i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card p-5"
              >
                <summary className="cursor-pointer list-none font-medium marker:content-['']">
                  {t(`seo.faq.items.${i}.q`)}
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`seo.faq.items.${i}.a`)}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-xl">
          <AppPromo />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
