import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { GridBackdrop } from "@/components/site/grid-backdrop";
import { Section, SectionHeading } from "@/components/site/section";
import { FadeUp, RevealBlur } from "@/components/site/motion";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { TagBadge } from "@/components/site/status-pill";
import { Beam } from "@/components/site/beam";
import { VButton } from "@/components/site/vbutton";
import { WebQuickCta } from "@/components/site/web-quick-cta";
import { sharedOpenGraph } from "@/lib/og";
import { staggerDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  FileUp,
  Radar,
  Lock,
  Check,
  Wifi,
  Link2,
  Globe,
  Users,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "how-it-works" });
  const description = t("meta.description");
  return {
    title: t("meta.title"),
    description,
    alternates: buildAlternates(locale, "/how-it-works"),
    ...sharedOpenGraph(t("meta.ogTitle"), description, "/how-it-works"),
  };
}

/* Icon + step number stay in code; text comes from the "how-it-works" namespace. */
const STEP_META: { step: string; icon: LucideIcon }[] = [
  { step: "01", icon: FileUp },
  { step: "02", icon: Radar },
  { step: "03", icon: Lock },
  { step: "04", icon: Check },
];

const METHOD_ICONS: LucideIcon[] = [Wifi, Link2, Globe, Users];

type StepContent = { title: string; desc: string; tag: string };
type MethodContent = { title: string; bestFor: string; points: string[] };
type FaqContent = { q: string; a: string };

/* ── Vertical beam rail segment between two step nodes ─────────────────── */

function RailSegment({ delay }: { delay: number }) {
  return (
    <div
      aria-hidden
      className="absolute left-[27px] top-16 -bottom-12 w-[2px] md:left-1/2 md:-bottom-20 md:-translate-x-1/2"
    >
      <Beam
        path="M 1 0 L 1 100"
        width={2}
        height={100}
        preserveAspectRatio="none"
        duration={2.6}
        delay={delay}
        className="h-full w-full"
      />
    </div>
  );
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("how-it-works");

  const steps = t.raw("flow.steps") as StepContent[];
  const methods = t.raw("routes.methods") as MethodContent[];
  const faqs = t.raw("faq.items") as FaqContent[];

  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <GridBackdrop pattern="dots" />
          <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-8 text-center">
            <RevealBlur>
              <p className="mb-5 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
                  aria-hidden
                />
                {t("hero.eyebrow")}
              </p>
              <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
                {t("hero.title")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-5 leading-relaxed text-balance">
                {t("hero.sub")}
              </p>
            </RevealBlur>
          </div>
        </section>

        {/* The flow — beam-connected vertical steps */}
        <Section backdrop="dots">
          <SectionHeading
            eyebrow={t("flow.eyebrow")}
            title={t("flow.title")}
            sub={t("flow.sub")}
            centered
          />
          <ol className="relative max-w-4xl mx-auto space-y-12 md:space-y-20 list-none">
            {STEP_META.map((meta, i) => {
              const item = steps[i];
              const Icon = meta.icon;
              const cardLeft = i % 2 === 0;
              return (
                <li key={meta.step} className="relative pl-20 md:pl-0">
                  {/* Node pinned to the rail */}
                  <div className="absolute left-0 top-0 z-10 md:left-1/2 md:-translate-x-1/2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                  </div>

                  {/* Ghost step number on the opposite side */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute top-1 hidden select-none text-[5.5rem] font-semibold leading-none tracking-[-0.03em] text-foreground/[0.05] md:block",
                      cardLeft
                        ? "left-[calc(50%+72px)]"
                        : "right-[calc(50%+72px)]"
                    )}
                  >
                    {meta.step}
                  </span>

                  {/* Step card */}
                  <FadeUp
                    delay={0.08}
                    className={cn(
                      "md:w-[calc(50%-64px)]",
                      cardLeft ? "md:mr-auto" : "md:ml-auto"
                    )}
                  >
                    <SpotlightCard className="p-6 md:p-7">
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-blue">
                        {t("flow.stepLabel", { step: meta.step })}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                      <TagBadge className="mt-4">{item.tag}</TagBadge>
                    </SpotlightCard>
                  </FadeUp>

                  {i < STEP_META.length - 1 && <RailSegment delay={i * 0.6} />}
                </li>
              );
            })}
          </ol>
        </Section>

        {/* Routes */}
        <div className="h-px bg-border" aria-hidden />
        <Section className="bg-background-raised" backdrop="lines">
          <SectionHeading
            eyebrow={t("routes.eyebrow")}
            title={t("routes.title")}
            sub={t("routes.sub")}
          />
          <div className="grid sm:grid-cols-2 gap-5">
            {methods.map((method, i) => {
              const Icon = METHOD_ICONS[i];
              return (
                <FadeUp
                  key={method.title}
                  delay={staggerDelay(i, 0.07)}
                  className="h-full"
                >
                  <SpotlightCard className="h-full p-6 md:p-7">
                    <div className="flex items-center gap-3.5 mb-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold tracking-[-0.01em]">
                          {method.title}
                        </h3>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          {t("routes.bestForLabel")} · {method.bestFor}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {method.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </SpotlightCard>
                </FadeUp>
              );
            })}
          </div>
        </Section>
        <div className="h-px bg-border" aria-hidden />

        {/* FAQ */}
        <Section>
          <SectionHeading
            eyebrow={t("faq.eyebrow")}
            title={t("faq.title")}
            sub={t("faq.sub")}
            centered
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <FadeUp key={faq.q} delay={Math.min(i, 4) * 0.05}>
                <details className="group rounded-xl border border-border bg-card overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-sm md:text-base font-semibold [&::-webkit-details-marker]:hidden">
                    <span>{faq.q}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-[transform,color] duration-300 group-open:rotate-180 group-open:text-foreground">
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </summary>
                  <div className="px-6 pb-5">
                    <div className="h-px bg-border mb-4" aria-hidden />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </details>
              </FadeUp>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Section backdrop="dots">
          <FadeUp className="text-center">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-balance">
              {t("cta.title")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md mx-auto text-lg leading-relaxed">
              {t("cta.sub")}
            </p>
            <div className="mt-10 flex flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <VButton size="lg" href="/#send-live">
                  {t("cta.sendNow")}
                  <ArrowRight className="h-4 w-4" />
                </VButton>
                <VButton size="lg" variant="secondary" href="/#get">
                  {t("cta.getApp")}
                </VButton>
              </div>
              <Link
                href="/features"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
              >
                {t("cta.exploreAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>
        </Section>
      </main>

      <WebQuickCta />
      <SiteFooter />
    </div>
  );
}
