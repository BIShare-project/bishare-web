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
import { GlassCard } from "@/components/site/glass-card";
import { GradientBorderCard } from "@/components/site/gradient-border-card";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { FeaturePill, TagBadge } from "@/components/site/status-pill";
import { sharedOpenGraph } from "@/lib/og";
import { staggerDelay } from "@/lib/motion";
import {
  ArrowLeftRight,
  Waypoints,
  Zap,
  ShieldCheck,
  Lock,
  Wifi,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "philosophy" });
  const description = t("metadata.description");
  return {
    title: t("metadata.title"),
    description,
    alternates: buildAlternates(locale, "/philosophy"),
    ...sharedOpenGraph(t("metadata.ogTitle"), description, "/philosophy"),
  };
}

/** Geist button classes for plain anchors (file downloads keep native <a>). */
const DL_BASE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap outline-none transition-[opacity,background-color,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]";
const DL_PRIMARY =
  "bg-primary text-primary-foreground border border-primary hover:opacity-90";
const DL_SECONDARY =
  "bg-transparent text-foreground border border-border-strong hover:bg-secondary hover:border-foreground/25";

/** The BIShare app icon, rendered as inline SVG so it stays crisp at any size. */
function AppIcon({
  id,
  className,
  label,
}: {
  id: string;
  className?: string;
  label: string;
}) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3AA0FF" />
          <stop offset=".5" stopColor="#0A84FF" />
          <stop offset="1" stopColor="#0B3AD1" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx=".5" cy=".36" r=".72">
          <stop offset="0" stopColor="#8FD0FF" stopOpacity=".5" />
          <stop offset="1" stopColor="#8FD0FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-mk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D6E9FF" />
        </linearGradient>
        <radialGradient id={`${id}-nd`} cx=".42" cy=".38" r=".7">
          <stop offset="0" stopColor="#F0FCFF" />
          <stop offset=".45" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#0AACD0" />
        </radialGradient>
        <filter id={`${id}-sb`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
      <rect x="16" y="16" width="480" height="480" rx="112" fill={`url(#${id}-bg)`} />
      <rect x="16" y="16" width="480" height="480" rx="112" fill={`url(#${id}-glow)`} />
      <rect x="16" y="16" width="480" height="220" rx="112" fill="#FFFFFF" opacity=".07" />
      <g filter={`url(#${id}-sb)`} opacity=".55" fill="none" stroke="#22D3EE" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
        <path d="M217.1 351.5 L351.5 217.1" />
        <path d="M294.9 160.5 L160.5 294.9" />
      </g>
      <g fill="none" stroke={`url(#${id}-mk)`} strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
        <path d="M217.1 351.5 L351.5 217.1" />
        <path d="M316.1 223.3 L351.5 217.1 L345.3 252.6" />
        <path d="M294.9 160.5 L160.5 294.9" />
        <path d="M195.9 288.7 L160.5 294.9 L166.7 259.5" />
      </g>
      <circle cx="256" cy="256" r="18" fill={`url(#${id}-nd)`} />
      <circle cx="256" cy="256" r="18" fill="none" stroke="#EAFCFF" strokeOpacity=".5" strokeWidth="1.5" />
      <rect x="16.75" y="16.75" width="478.5" height="478.5" rx="111.25" fill="none" stroke="#FFFFFF" strokeOpacity=".18" strokeWidth="1.5" />
    </svg>
  );
}

/** Icons stay in code; copy comes from the "philosophy" namespace. */
const PILLAR_ICONS: LucideIcon[] = [ArrowLeftRight, Waypoints, Zap, ShieldCheck];

interface PillarText {
  tag: string;
  title: string;
  desc: string;
}

interface GeometryNote {
  bold: string;
  text: string;
}

/** Hex + interface-usage stay in code; name/use come from translations. */
const PALETTE_HEX = ["#0A84FF", "#0B3AD1", "#1B2A8A", "#22D3EE"];

interface PaletteText {
  name: string;
  use: string;
}

const PRINCIPLE_ICONS: LucideIcon[] = [Wifi, Lock, EyeOff];

interface PrincipleText {
  title: string;
  desc: string;
}

export default async function PhilosophyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("philosophy");

  const pillars = t.raw("mark.pillars") as PillarText[];
  const notes = t.raw("geometry.notes") as GeometryNote[];
  const colors = t.raw("palette.colors") as PaletteText[];
  const principles = t.raw("principles.items") as PrincipleText[];

  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <GridBackdrop pattern="dots" />
          <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-8 text-center">
            <RevealBlur>
              <div className="mb-8 inline-block">
                <AppIcon
                  id="hero"
                  className="w-28 h-28 md:w-32 md:h-32"
                  label={t("logoAlt")}
                />
              </div>
              <p className="mb-5 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue" aria-hidden />
                {t("hero.eyebrow")}
              </p>
              <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
                {t("hero.title")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-5 leading-relaxed text-balance">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center mt-8">
                <FeaturePill icon={ArrowLeftRight}>
                  {t("hero.pills.twoWay")}
                </FeaturePill>
                <FeaturePill icon={Waypoints}>
                  {t("hero.pills.peer")}
                </FeaturePill>
                <FeaturePill icon={Lock}>{t("hero.pills.private")}</FeaturePill>
                <FeaturePill icon={Zap}>{t("hero.pills.instant")}</FeaturePill>
              </div>
            </RevealBlur>
          </div>
        </section>

        {/* Core idea */}
        <Section containerClassName="max-w-3xl">
          <FadeUp>
            <GlassCard accent className="p-7 sm:p-10">
              <p className="text-xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] leading-snug text-balance">
                {t("core.quote")}
              </p>
            </GlassCard>
          </FadeUp>
        </Section>

        {/* Pillars */}
        <div className="h-px bg-border" aria-hidden />
        <Section className="bg-background-raised" backdrop="lines">
          <SectionHeading
            eyebrow={t("mark.eyebrow")}
            title={t("mark.title")}
            sub={t("mark.sub")}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[i];
              return (
                <FadeUp
                  key={pillar.title}
                  delay={staggerDelay(i, 0.07)}
                  className="h-full"
                >
                  <SpotlightCard className="h-full p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <TagBadge className="mb-2">{pillar.tag}</TagBadge>
                    <h3 className="font-semibold mb-1.5 tracking-[-0.01em]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pillar.desc}
                    </p>
                  </SpotlightCard>
                </FadeUp>
              );
            })}
          </div>
        </Section>
        <div className="h-px bg-border" aria-hidden />

        {/* Geometry */}
        <Section containerClassName="max-w-5xl" backdrop="dots">
          <SectionHeading
            eyebrow={t("geometry.eyebrow")}
            title={t("geometry.title")}
          />
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <FadeUp>
              <GradientBorderCard
                radius="xl"
                className="grid place-items-center p-8"
              >
                <svg
                  viewBox="0 0 512 512"
                  className="w-56 h-56 md:w-64 md:h-64"
                  aria-label={t("geometry.gridLabel")}
                >
                  <defs>
                    <linearGradient id="cons-bg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#3AA0FF" />
                      <stop offset=".5" stopColor="#0A84FF" />
                      <stop offset="1" stopColor="#0B3AD1" />
                    </linearGradient>
                  </defs>
                  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#cons-bg)" />
                  <g stroke="#EAF6FF" strokeOpacity=".28" strokeWidth="1.5">
                    <line x1="256" y1="40" x2="256" y2="472" />
                    <line x1="40" y1="256" x2="472" y2="256" />
                    <line x1="90" y1="90" x2="422" y2="422" />
                    <line x1="422" y1="90" x2="90" y2="422" />
                    <circle cx="256" cy="256" r="150" fill="none" strokeDasharray="4 8" />
                  </g>
                  <g fill="none" stroke="#fff" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M217.1 351.5 L351.5 217.1" />
                    <path d="M316.1 223.3 L351.5 217.1 L345.3 252.6" />
                    <path d="M294.9 160.5 L160.5 294.9" />
                    <path d="M195.9 288.7 L160.5 294.9 L166.7 259.5" />
                  </g>
                  <circle cx="256" cy="256" r="18" fill="#22D3EE" />
                </svg>
              </GradientBorderCard>
            </FadeUp>
            <FadeUp delay={0.1}>
              <ul className="space-y-4">
                {notes.map((note) => (
                  <li key={note.bold} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" />
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      <b className="text-foreground font-semibold">
                        {note.bold}
                      </b>{" "}
                      {note.text}
                    </span>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>
        </Section>

        {/* Icon palette (distinct from the interface theme tokens) */}
        <div className="h-px bg-border" aria-hidden />
        <Section className="bg-background-raised" containerClassName="max-w-5xl">
          <SectionHeading
            eyebrow={t("palette.eyebrow")}
            title={t("palette.title")}
            sub={t("palette.sub")}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {colors.map((color, i) => {
              const hex = PALETTE_HEX[i];
              return (
                <FadeUp key={hex} delay={staggerDelay(i, 0.07)}>
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="h-20" style={{ background: hex }} />
                    <div className="p-4">
                      <p className="font-semibold text-sm">{color.name}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {hex}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {color.use}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
          <FadeUp delay={0.2} className="mt-6">
            <div className="rounded-xl border border-border bg-card px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <TagBadge>INTERFACE TOKENS</TagBadge>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.rich("palette.tokens.body", {
                  mono: (chunks) => (
                    <span className="font-mono text-xs text-foreground">
                      {chunks}
                    </span>
                  ),
                })}
              </p>
            </div>
          </FadeUp>
        </Section>
        <div className="h-px bg-border" aria-hidden />

        {/* Product principles */}
        <Section containerClassName="max-w-5xl">
          <SectionHeading
            eyebrow={t("principles.eyebrow")}
            title={t("principles.title")}
            sub={t("principles.sub")}
          />
          <div className="grid sm:grid-cols-3 gap-5">
            {principles.map((principle, i) => {
              const Icon = PRINCIPLE_ICONS[i];
              return (
                <FadeUp
                  key={principle.title}
                  delay={staggerDelay(i, 0.07)}
                  className="h-full"
                >
                  <SpotlightCard className="h-full p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold mb-1.5 tracking-[-0.01em]">
                      {principle.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {principle.desc}
                    </p>
                  </SpotlightCard>
                </FadeUp>
              );
            })}
          </div>
        </Section>

        {/* Downloads */}
        <Section backdrop="dots" containerClassName="max-w-3xl">
          <FadeUp className="text-center">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-balance">
              {t("downloads.title")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md mx-auto text-lg leading-relaxed">
              {t("downloads.body")}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <a
                href="/logo.svg"
                target="_blank"
                rel="noopener noreferrer"
                className={`${DL_BASE} ${DL_PRIMARY}`}
              >
                {t("downloads.svg")}
              </a>
              <a
                href="/logo.png"
                target="_blank"
                rel="noopener noreferrer"
                className={`${DL_BASE} ${DL_SECONDARY}`}
              >
                {t("downloads.png")}
              </a>
            </div>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
            >
              {t("downloads.back")} <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeUp>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
