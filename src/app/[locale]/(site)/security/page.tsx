import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Section, SectionHeading } from "@/components/site/section";
import { FadeUp } from "@/components/site/motion";
import { GradientBorderCard } from "@/components/site/gradient-border-card";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { GlassCard } from "@/components/site/glass-card";
import { GridBackdrop } from "@/components/site/grid-backdrop";
import { IconTile, MetricBar, MockSurface } from "@/components/site/mock-surface";
import { StatusPill, TagBadge } from "@/components/site/status-pill";
import { Beam } from "@/components/site/beam";
import { VButton } from "@/components/site/vbutton";
import { WebQuickCta } from "@/components/site/web-quick-cta";
import { sharedOpenGraph } from "@/lib/og";
import { staggerDelay } from "@/lib/motion";
import { E2EFlowDiagram } from "./e2e-flow";
import {
  ArrowRight,
  Check,
  Clock,
  CloudOff,
  EyeOff,
  FileKey,
  FileSearch,
  FileText,
  HandCoins,
  KeyRound,
  Laptop,
  Lock,
  Mail,
  MegaphoneOff,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const SUPPORT_EMAIL = "support@billiongroup.net";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "security" });
  const title = t("meta.title");
  const description = t("meta.description");

  return {
    title,
    description,
    alternates: buildAlternates(locale, "/security"),
    ...sharedOpenGraph(`BIShare ${title}`, description, "/security"),
  };
}

/* ── Page-local building blocks ──────────────────────────────────────── */

function MiniDevice({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-2">
      <IconTile icon={Icon} accent />
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function AssuranceRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <IconTile icon={Icon} size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

/** Circular countdown: the 24-hour window, drawn as a ring (70% remaining). */
function ExpiryRing() {
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          strokeWidth="3"
          className="stroke-border"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="176"
          strokeDashoffset="53"
          className="stroke-accent-blue"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm font-semibold leading-none">17</span>
        <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
          h
        </span>
      </span>
    </div>
  );
}

/* ── Visuals (monochrome mocks in the bordered-card language) ────────── */

async function LocalFirstVisual() {
  const t = await getTranslations("security");
  return (
    <MockSurface accent ticks className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagBadge>LAN</TagBadge>
          <TagBadge>{t("local.visual.tagDirect")}</TagBadge>
        </div>
        <StatusPill variant="online">{t("local.visual.sameNetwork")}</StatusPill>
      </div>

      <div className="flex items-center gap-1" aria-hidden>
        <MiniDevice icon={Smartphone} label={t("local.visual.phone")} />

        {/* Direct hop: one straight lane, one payload chip crossing it */}
        <div className="relative min-w-0 flex-1 self-start pt-[6px]">
          <Beam
            path="M 0 20 L 200 20"
            width={200}
            height={40}
            duration={2.6}
            preserveAspectRatio="none"
            className="h-10 w-full"
          />
          <div
            className="hud-runner absolute inset-x-0 top-0 h-10"
            style={{ "--run-dur": "2.6s" } as React.CSSProperties}
          >
            <span className="absolute left-0 top-1/2 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-[var(--glow-card-hover)]">
              <FileText className="h-3 w-3" />
            </span>
          </div>
        </div>

        <MiniDevice icon={Laptop} label={t("local.visual.laptop")} />
      </div>
      <p className="sr-only">{t("local.visual.srBeam")}</p>

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-background-raised px-4 py-3">
        <IconTile icon={CloudOff} size="sm" className="text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("local.visual.noServer")}
        </p>
      </div>
    </MockSurface>
  );
}

async function RemoteShareVisual() {
  const t = await getTranslations("security");
  return (
    <MockSurface accent ticks className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagBadge>{t("remote.visual.tagRemote")}</TagBadge>
          <TagBadge>{t("remote.visual.tagEncrypted")}</TagBadge>
        </div>
        <StatusPill variant="primary">{t("remote.visual.linkActive")}</StatusPill>
      </div>

      {/* The share itself, with the 24-hour window drawn as a ring */}
      <div className="flex items-center gap-4">
        <ExpiryRing />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">holiday-album.zip</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            0.9 GB · <span className="font-mono text-foreground">X4K-9PM</span>
          </p>
          <div className="mt-2.5">
            {/* The hours live in the ring; this row carries the label only. */}
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              {t("remote.visual.timeRemaining")}
            </p>
            <MetricBar percent={70} />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-1 border-t border-border pt-4">
        <AssuranceRow
          icon={ShieldCheck}
          title={t("remote.visual.assurance.transit.title")}
          desc={t("remote.visual.assurance.transit.desc")}
        />
        <AssuranceRow
          icon={Lock}
          title={t("remote.visual.assurance.rest.title")}
          desc={t("remote.visual.assurance.rest.desc")}
        />
        <AssuranceRow
          icon={Clock}
          title={t("remote.visual.assurance.deleted.title")}
          desc={t("remote.visual.assurance.deleted.desc")}
        />
      </div>
    </MockSurface>
  );
}

/* ── Content data (icon + i18n key; text resolved at render) ──────────── */

const ENCRYPTION_CARDS: { icon: LucideIcon; key: string }[] = [
  { icon: KeyRound, key: "handshake" },
  { icon: FileKey, key: "perFile" },
  { icon: ShieldCheck, key: "cipher" },
];

const DONT_ITEMS: { icon: LucideIcon; key: string }[] = [
  { icon: EyeOff, key: "tracking" },
  { icon: MegaphoneOff, key: "ads" },
  { icon: HandCoins, key: "selling" },
  { icon: FileSearch, key: "scanning" },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("security");

  const localPoints = t.raw("local.points") as string[];
  const remotePoints = t.raw("remote.points") as string[];

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <GridBackdrop pattern="dots" />
          <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 text-center md:pt-24">
            {/* CSS `.hero-rise` (SSR-visible) instead of a JS reveal so the LCP
                <h1> paints without waiting for hydration. */}
            <div className="hero-rise">
              <p className="mb-4 flex items-center justify-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
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
              <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-background-raised px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t("hero.badge")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* E2E flow diagram — the centerpiece */}
        <section className="relative">
          <div className="mx-auto max-w-5xl px-6 pb-4 pt-10 md:pb-8">
            <h2 className="sr-only">{t("flowHeading")}</h2>
            <FadeUp>
              <E2EFlowDiagram />
            </FadeUp>
          </div>
        </section>

        {/* End-to-end encryption, in plain words */}
        <Section backdrop="dots">
          <SectionHeading
            eyebrow={t("encryption.eyebrow")}
            title={t("encryption.title")}
            sub={t("encryption.sub")}
            centered
          />
          <div className="grid gap-5 md:grid-cols-3">
            {ENCRYPTION_CARDS.map((card, i) => (
              <FadeUp key={card.key} delay={staggerDelay(i)} className="flex">
                <SpotlightCard className="flex w-full flex-col p-7">
                  <div className="flex items-start justify-between">
                    <IconTile icon={card.icon} accent />
                    <TagBadge>{t(`encryption.cards.${card.key}.tag`)}</TagBadge>
                  </div>
                  <h3 className="mt-5 font-semibold text-foreground">
                    {t(`encryption.cards.${card.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`encryption.cards.${card.key}.desc`)}
                  </p>
                </SpotlightCard>
              </FadeUp>
            ))}
          </div>
        </Section>

        {/* Local-first */}
        <Section className="bg-background-raised">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <FadeUp>
              <div className="max-w-lg">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                    <CloudOff className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {t("local.label")}
                  </p>
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
                  {t("local.title")}
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {t("local.body")}
                </p>
                <ul className="mt-6 space-y-3">
                  {localPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background-raised text-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <LocalFirstVisual />
            </FadeUp>
          </div>
        </Section>

        {/* Remote shares */}
        <Section>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <FadeUp className="lg:order-2">
              <div className="max-w-lg">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                    <Clock className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {t("remote.label")}
                  </p>
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
                  {t("remote.title")}
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {t("remote.body")}
                </p>
                <ul className="mt-6 space-y-3">
                  {remotePoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background-raised text-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
            <FadeUp delay={0.1} className="lg:order-1">
              <RemoteShareVisual />
            </FadeUp>
          </div>
        </Section>

        {/* What we DON'T do */}
        <Section className="bg-background-raised" backdrop="lines">
          <SectionHeading
            eyebrow={t("dont.eyebrow")}
            title={t("dont.title")}
            sub={t("dont.sub")}
            centered
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DONT_ITEMS.map((item, i) => (
              <FadeUp key={item.key} delay={staggerDelay(i)} className="flex">
                <GlassCard className="flex w-full flex-col p-6">
                  <div className="flex items-start justify-between">
                    <IconTile
                      icon={item.icon}
                      className="text-muted-foreground"
                    />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("dont.never")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {t(`dont.items.${item.key}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`dont.items.${item.key}.desc`)}
                  </p>
                </GlassCard>
              </FadeUp>
            ))}
          </div>
        </Section>

        {/* Responsible disclosure */}
        <Section backdrop="dots">
          <FadeUp>
            <GradientBorderCard
              glow="blue"
              radius="xl"
              className="mx-auto max-w-3xl p-8 text-center md:p-12"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-5 flex items-center justify-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
                  aria-hidden
                />
                {t("disclosure.eyebrow")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
                {t("disclosure.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted-foreground">
                {t("disclosure.body")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <VButton href={`mailto:${SUPPORT_EMAIL}`} size="lg">
                  <Mail className="h-4 w-4" />
                  {SUPPORT_EMAIL}
                </VButton>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
                >
                  {t("disclosure.privacyLink")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </GradientBorderCard>
          </FadeUp>
        </Section>
      </main>

      <WebQuickCta />
      <SiteFooter />
    </div>
  );
}
