import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Section, SectionHeading } from "@/components/site/section";
import { FadeUp } from "@/components/site/motion";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { VButton } from "@/components/site/vbutton";
import { RoomsApp } from "@/components/rooms/rooms-app";
import {
  DoorOpen,
  Share2,
  FileDown,
  Cloud,
  Radio,
  Check,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rooms" });
  const description = t("page.metaDescription");
  return {
    title: t("page.metaTitle"),
    description,
    alternates: buildAlternates(locale, "/rooms"),
    openGraph: {
      title: t("page.metaTitle"),
      description,
      type: "website",
      siteName: "BIShare",
    },
  };
}

type Step = { title: string; desc: string };
type Faq = { q: string; a: string };
type ComparePane = { title: string; points: string[] };

const STEP_ICONS = [DoorOpen, Share2, FileDown];

/**
 * Rooms — a shared space where a group (by code) collects and pulls files
 * together. The interactive client is the hero; rich content below explains how
 * it works (how-to, Cloud vs Local, FAQ with structured data) for search.
 */
export default async function RoomsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; mode?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rooms");
  const sp = await searchParams;
  const initialCode = sp.code;
  const initialMode = sp.mode === "local" ? "local" : "cloud";

  const steps = t.raw("seo.how.steps") as Step[];
  const cloud = t.raw("seo.compare.cloud") as ComparePane;
  const local = t.raw("seo.compare.local") as ComparePane;
  const faqs = t.raw("seo.faq.items") as Faq[];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero + interactive room client */}
        <section className="mx-auto w-full max-w-xl px-4 pt-8 sm:px-6 md:pt-16">
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
            <RoomsApp initialCode={initialCode} initialMode={initialMode} />
          </div>

          <p className="mx-auto mt-8 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
            {t("seo.lead")}
          </p>
        </section>

        {/* How it works */}
        <Section backdrop="dots">
          <SectionHeading
            eyebrow={t("seo.how.eyebrow")}
            title={t("seo.how.title")}
            sub={t("seo.how.sub")}
            centered
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? DoorOpen;
              return (
                <FadeUp key={step.title} delay={i * 0.07} className="h-full">
                  <SpotlightCard className="h-full p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-blue">
                        {`0${i + 1}`}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold tracking-[-0.01em]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </SpotlightCard>
                </FadeUp>
              );
            })}
          </div>
        </Section>

        {/* Cloud vs Local */}
        <div className="h-px bg-border" aria-hidden />
        <Section className="bg-background-raised" backdrop="lines">
          <SectionHeading
            eyebrow={t("seo.compare.eyebrow")}
            title={t("seo.compare.title")}
            sub={t("seo.compare.sub")}
            centered
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { pane: cloud, icon: Cloud },
              { pane: local, icon: Radio },
            ].map(({ pane, icon: Icon }) => (
              <FadeUp key={pane.title} className="h-full">
                <SpotlightCard className="h-full p-6 md:p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold tracking-[-0.01em]">{pane.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {pane.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                        <span className="text-sm leading-relaxed text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </FadeUp>
            ))}
          </div>
        </Section>
        <div className="h-px bg-border" aria-hidden />

        {/* FAQ */}
        <Section>
          <SectionHeading
            eyebrow={t("seo.faq.eyebrow")}
            title={t("seo.faq.title")}
            sub={t("seo.faq.sub")}
            centered
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, i) => (
              <FadeUp key={faq.q} delay={Math.min(i, 4) * 0.05}>
                <details className="group overflow-hidden rounded-xl border border-border bg-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold md:text-base [&::-webkit-details-marker]:hidden">
                    <span>{faq.q}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-[transform,color] duration-300 group-open:rotate-180 group-open:text-foreground">
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </summary>
                  <div className="px-6 pb-5">
                    <div className="mb-4 h-px bg-border" aria-hidden />
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                </details>
              </FadeUp>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Section backdrop="dots">
          <FadeUp className="text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
              {t("seo.cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
              {t("seo.cta.sub")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <VButton size="lg" href="/transfer">
                {t("seo.cta.transfer")}
                <ArrowRight className="h-4 w-4" />
              </VButton>
              <Link
                href="/features"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
              >
                {t("seo.cta.features")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
