import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Section } from "@/components/site/section";
import { FadeUp, RevealBlur } from "@/components/site/motion";
import { VButton } from "@/components/site/vbutton";
import { sharedOpenGraph } from "@/lib/og";
import { FAQ_GROUPS } from "./faq-data";
import { ArrowRight, ChevronDown } from "lucide-react";

const SUPPORT_EMAIL = "support@billiongroup.net";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const description = t("meta.description");
  return {
    title: t("meta.title"),
    description,
    alternates: buildAlternates(locale, "/faq"),
    ...sharedOpenGraph(t("meta.ogTitle"), description, "/faq"),
  };
}

/* ── Page-local building blocks ──────────────────────────────────────── */

function FaqAccordion({
  q,
  a,
  link,
}: {
  q: string;
  a: string;
  link?: { href: string; label: string };
}) {
  return (
    <details className="group overflow-hidden rounded-xl border border-border bg-card transition-colors duration-200 hover:border-border-strong open:border-border-strong">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:text-base [&::-webkit-details-marker]:hidden">
        <span>{q}</span>
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-strong text-muted-foreground transition-transform duration-300 group-open:rotate-180 group-open:text-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className="px-6 pb-5">
        <div className="mb-4 h-px bg-border" aria-hidden />
        <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
        {link && (
          <Link
            href={link.href}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
          >
            {link.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </details>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");

  /* FAQPage structured data (schema.org) — same strings as the accordions. */
  const FAQ_JSON_LD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((group) =>
      group.items.map((_, i) => ({
        "@type": "Question",
        name: t(`groups.${group.id}.items.${i}.q`),
        acceptedAnswer: {
          "@type": "Answer",
          text: t(`groups.${group.id}.items.${i}.a`),
        },
      }))
    ),
  }).replace(/</g, "\\u003c");

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }}
      />

      <main>
        {/* Hero */}
        <section className="relative border-b border-border">
          <div className="mx-auto max-w-7xl px-6 pb-10 pt-16 text-center md:pt-24">
            <RevealBlur>
              <p className="mb-5 inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
                  aria-hidden
                />
                {t("hero.eyebrow")}
              </p>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("hero.sub")}
              </p>

              {/* Topic jump chips */}
              <nav aria-label={t("hero.topicsAria")}>
                <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {FAQ_GROUPS.map((group) => (
                    <li key={group.id}>
                      <a
                        href={`#${group.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background-raised px-4 py-2 text-sm text-muted-foreground outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <group.icon className="h-4 w-4 text-muted-foreground" />
                        {t(`groups.${group.id}.label`)}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {group.items.length}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </RevealBlur>
          </div>
        </section>

        {/* Grouped accordions */}
        <div className="relative">
          <div className="mx-auto max-w-3xl space-y-16 px-6 pb-20 pt-8 md:space-y-20 md:pb-24">
            {FAQ_GROUPS.map((group) => (
              <section
                key={group.id}
                id={group.id}
                aria-labelledby={`${group.id}-heading`}
                className="scroll-mt-28"
              >
                <FadeUp>
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background-raised text-foreground">
                      <group.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id={`${group.id}-heading`}
                        className="text-xl font-semibold tracking-[-0.02em] md:text-2xl"
                      >
                        {t(`groups.${group.id}.label`)}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {t(`groups.${group.id}.blurb`)}
                      </p>
                    </div>
                    <div
                      className="hidden min-w-8 flex-1 sm:block h-px bg-border"
                      aria-hidden
                    />
                  </div>
                </FadeUp>
                <div className="space-y-3">
                  {group.items.map((item, i) => (
                    <FadeUp key={i} delay={Math.min(i, 4) * 0.05}>
                      <FaqAccordion
                        q={t(`groups.${group.id}.items.${i}.q`)}
                        a={t(`groups.${group.id}.items.${i}.a`)}
                        link={
                          item.linkHref
                            ? {
                                href: item.linkHref,
                                label: t(
                                  `groups.${group.id}.items.${i}.linkLabel`
                                ),
                              }
                            : undefined
                        }
                      />
                    </FadeUp>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Still curious CTA */}
        <Section className="border-t border-border">
          <FadeUp className="text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
              {t("cta.sub")}
            </p>
            <div className="mt-10 flex flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <VButton size="lg" href="/contact">
                  {t("cta.contact")}
                  <ArrowRight className="h-4 w-4" />
                </VButton>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <Link
                href="/security"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
              >
                {t("cta.securityLink")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
