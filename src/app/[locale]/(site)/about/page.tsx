import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { GridBackdrop } from "@/components/site/grid-backdrop";
import { Section, SectionHeading } from "@/components/site/section";
import { FadeUp } from "@/components/site/motion";
import { GlassCard } from "@/components/site/glass-card";
import { GradientBorderCard } from "@/components/site/gradient-border-card";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { StatusPill, TagBadge } from "@/components/site/status-pill";
import { StoreButtons } from "@/components/site/store-buttons";
import { sharedOpenGraph } from "@/lib/og";
import { staggerDelay } from "@/lib/motion";
import {
  Lock,
  Zap,
  Feather,
  MonitorSmartphone,
  Check,
  ArrowRight,
  Mail,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const description = t("metadata.description");
  return {
    title: t("metadata.title"),
    description,
    alternates: buildAlternates(locale, "/about"),
    ...sharedOpenGraph(t("metadata.ogTitle"), description, "/about"),
  };
}

/** Icons stay in code; titles/descriptions come from the "about" namespace. */
const VALUE_ICONS: LucideIcon[] = [Lock, Zap, Feather, MonitorSmartphone];

interface ValueText {
  title: string;
  desc: string;
}

const CIPHER_TEXT =
  "9f2e 7c41 b3a8 d05f 66e1 4b9c 2ad7 8e30 51fa c96b 03d4 7e28 ";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const values = t.raw("values.items") as ValueText[];
  const commitments = t.raw("privacy.commitments") as string[];
  const traits = t.raw("technology.traits") as string[];

  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <GridBackdrop pattern="dots" />
          <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-8 text-center">
            {/* CSS `.hero-rise` (SSR-visible) instead of a JS reveal so the LCP
                <h1> paints without waiting for hydration. */}
            <div className="hero-rise">
              <div className="mb-7 inline-block">
                <Image
                  src="/logo.svg"
                  alt="BIShare"
                  width={76}
                  height={76}
                  className="rounded-xl border border-border mx-auto"
                />
              </div>
              <p className="mb-4 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
                  aria-hidden
                />
                {t("hero.eyebrow")}
              </p>
              <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
                {t("hero.title")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-5 leading-relaxed">
                {t("hero.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* Story — editorial spread */}
        <Section containerClassName="max-w-5xl">
          <div className="grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10 md:gap-16 items-start">
            <SectionHeading
              eyebrow={t("story.eyebrow")}
              title={t("story.title")}
              className="mb-0"
            />
            <FadeUp delay={0.05}>
              <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                <p>
                  {t.rich("story.p1", {
                    highlight: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
                <p>{t("story.p2")}</p>
              </div>
            </FadeUp>
          </div>

          {/* Pull quote */}
          <FadeUp delay={0.1} className="mt-14">
            <GradientBorderCard
              radius="xl"
              className="relative isolate overflow-hidden p-8 md:p-12"
            >
              <GridBackdrop pattern="dots" />
              <p className="text-2xl md:text-[2.5rem] md:leading-[1.15] font-semibold tracking-[-0.03em] text-balance max-w-3xl">
                {t("quote.text")}
              </p>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("quote.steps")}
              </p>
            </GradientBorderCard>
          </FadeUp>
        </Section>

        {/* Values */}
        <div className="h-px bg-border" aria-hidden />
        <Section className="bg-background-raised" backdrop="lines">
          <SectionHeading
            eyebrow={t("values.eyebrow")}
            title={t("values.title")}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value, i) => {
              const Icon = VALUE_ICONS[i];
              return (
                <FadeUp
                  key={value.title}
                  delay={staggerDelay(i, 0.07)}
                  className="h-full"
                >
                  <SpotlightCard className="h-full p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold mb-1.5">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.desc}
                    </p>
                  </SpotlightCard>
                </FadeUp>
              );
            })}
          </div>
        </Section>
        <div className="h-px bg-border" aria-hidden />

        {/* Privacy stance */}
        <Section containerClassName="max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <SectionHeading
                eyebrow={t("privacy.eyebrow")}
                title={t("privacy.title")}
                className="mb-6"
              />
              <FadeUp delay={0.05}>
                <p className="text-muted-foreground leading-relaxed">
                  {t("privacy.body")}
                </p>
              </FadeUp>
              <FadeUp delay={0.1} className="mt-8">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
                >
                  {t("privacy.link")} <ArrowRight className="h-4 w-4" />
                </Link>
              </FadeUp>
            </div>
            <FadeUp delay={0.08}>
              <GlassCard accent className="p-6 md:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <TagBadge>E2E</TagBadge>
                  <StatusPill variant="online">{t("privacy.status")}</StatusPill>
                </div>
                <ul className="space-y-3.5">
                  {commitments.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background-raised">
                        <Check className="h-3 w-3 text-success" />
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </FadeUp>
          </div>
        </Section>

        {/* Technology */}
        <div className="h-px bg-border" aria-hidden />
        <Section className="bg-background-raised" containerClassName="max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <SectionHeading
                eyebrow={t("technology.eyebrow")}
                title={t("technology.title")}
                className="mb-6"
              />
              <FadeUp delay={0.05}>
                <p className="text-muted-foreground leading-relaxed">
                  {t("technology.body")}
                </p>
              </FadeUp>
              <FadeUp delay={0.1} className="mt-8">
                <Link
                  href="/philosophy"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
                >
                  {t("technology.link")} <ArrowRight className="h-4 w-4" />
                </Link>
              </FadeUp>
            </div>
            <FadeUp delay={0.1}>
              <GradientBorderCard className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <TagBadge>RUST CORE</TagBadge>
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="pulse-dot h-2 w-2 rounded-full bg-success" />
                      {t("technology.streaming")}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {traits.map((trait) => (
                      <li
                        key={trait}
                        className="flex items-center justify-between rounded-lg border border-border bg-background-raised px-3.5 py-2.5"
                      >
                        <span className="font-mono text-xs text-muted-foreground">
                          {trait}
                        </span>
                        <Check className="h-3.5 w-3.5 text-success" />
                      </li>
                    ))}
                  </ul>
                  <div
                    className="cipher-line mt-5 font-mono text-[10px] text-muted-foreground"
                    aria-hidden
                  >
                    <span>
                      {CIPHER_TEXT}
                      {CIPHER_TEXT}
                    </span>
                  </div>
                </div>
              </GradientBorderCard>
            </FadeUp>
          </div>
        </Section>
        <div className="h-px bg-border" aria-hidden />

        {/* Get + contact */}
        <Section containerClassName="max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            <FadeUp className="h-full">
              <SpotlightCard className="h-full p-7">
                <h2 className="text-xl font-semibold tracking-[-0.02em] mb-3">
                  {t("get.title")}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {t("get.body")}
                </p>
                <StoreButtons />
              </SpotlightCard>
            </FadeUp>
            <FadeUp delay={0.07} className="h-full">
              <SpotlightCard className="h-full p-7">
                <h2 className="text-xl font-semibold tracking-[-0.02em] mb-3">
                  {t("contact.title")}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {t("contact.body")}
                </p>
                <a
                  href="mailto:support@billiongroup.net"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border-strong bg-transparent px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:border-foreground/25"
                >
                  <Mail className="h-4 w-4" />
                  support@billiongroup.net
                </a>
              </SpotlightCard>
            </FadeUp>
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
