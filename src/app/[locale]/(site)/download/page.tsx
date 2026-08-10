import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Section, SectionHeading } from "@/components/site/section";
import { FadeUp, RevealBlur } from "@/components/site/motion";
import { GradientBorderCard } from "@/components/site/gradient-border-card";
import { QRDisplay } from "@/components/site/qr-display";
import { GridBackdrop } from "@/components/site/grid-backdrop";
import { StatusPill, TagBadge } from "@/components/site/status-pill";
import { VButton } from "@/components/site/vbutton";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  AppleGlyph,
  PlayGlyph,
} from "@/components/site/store-buttons";
import { sharedOpenGraph } from "@/lib/og";
import { staggerDelay } from "@/lib/motion";
import { DownloadHero } from "./download-hero";
import { ComingSoonPill, notifyHref, SUPPORT_EMAIL } from "./availability";
import {
  BellRing,
  HardDriveDownload,
  Laptop,
  Monitor,
  Smartphone,
  TabletSmartphone,
  Terminal,
} from "lucide-react";

/** Translator bound to the "download" namespace. */
type T = Awaited<ReturnType<typeof getTranslations>>;

/** Current app version, surfaced in the changelog badge. */
const VERSION = "v2.4.0";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "download" });
  const description = t("meta.description");

  return {
    title: t("meta.title"),
    description,
    alternates: buildAlternates(locale, "/download"),
    ...sharedOpenGraph(t("meta.ogTitle"), description, "/download"),
  };
}

/* ── Platform availability (honest states, no dead links) ─────────────── */

interface LivePlatform {
  name: string;
  key: "ios" | "macos";
  icon: LucideIcon;
  href: string;
  apple: boolean;
}

/** Live on the App Store (id6760924092) alongside Android on Google Play. */
const LIVE_PLATFORMS: LivePlatform[] = [
  {
    name: "iOS",
    key: "ios",
    icon: TabletSmartphone,
    href: APP_STORE_URL,
    apple: true,
  },
  {
    name: "macOS",
    key: "macos",
    icon: Laptop,
    href: APP_STORE_URL,
    apple: true,
  },
];

interface ComingPlatform {
  name: string;
  key: "windows" | "linux";
  icon: LucideIcon;
}

const COMING_PLATFORMS: ComingPlatform[] = [
  {
    name: "Windows",
    key: "windows",
    icon: Monitor,
  },
  {
    name: "Linux",
    key: "linux",
    icon: Terminal,
  },
];

/* ── Page-local cards ─────────────────────────────────────────────────── */

/** The one live platform — the flagship card of the grid. */
function AndroidCard({ t }: { t: T }) {
  return (
    <GradientBorderCard animated glow="blue" radius="xl">
      <div className="flex flex-col gap-8 p-7 md:flex-row md:items-center md:justify-between md:p-9">
        <div className="flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
            <Smartphone className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl font-semibold">Android</h3>
              <StatusPill variant="online">{t("android.status")}</StatusPill>
              <TagBadge>{VERSION}</TagBadge>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("android.requirement")}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("android.blurb")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <VButton href={PLAY_STORE_URL} variant="primary" size="lg">
            <PlayGlyph />
            {t("android.cta")}
          </VButton>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("android.free")}
          </p>
        </div>
      </div>
    </GradientBorderCard>
  );
}

/** A shipped platform — real store button, no pill. */
function AvailableCard({ platform, t }: { platform: LivePlatform; t: T }) {
  const Icon = platform.icon;
  return (
    <GradientBorderCard radius="lg" glow="blue" className="h-full">
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{platform.name}</h3>
              <StatusPill variant="online">{t("cards.available")}</StatusPill>
            </div>
            <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t(`platforms.${platform.key}.requirement`)}
            </p>
          </div>
        </div>
        <div className="mt-7 flex flex-1 flex-col justify-end gap-3">
          <VButton
            href={platform.href}
            variant="primary"
            size="md"
            className="w-full"
          >
            {platform.apple ? <AppleGlyph /> : <PlayGlyph />}
            {t("cards.appStore")}
          </VButton>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("cards.free")}
          </p>
        </div>
      </div>
    </GradientBorderCard>
  );
}

function ComingSoonCard({ platform, t }: { platform: ComingPlatform; t: T }) {
  const Icon = platform.icon;
  return (
    <GradientBorderCard radius="lg" className="h-full">
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold">{platform.name}</h3>
            <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t(`platforms.${platform.key}.requirement`)}
            </p>
          </div>
        </div>
        <div className="mt-7 flex flex-1 flex-col justify-end gap-3">
          <ComingSoonPill className="h-10 w-full px-3 text-[12.5px]">
            <HardDriveDownload className="h-3.5 w-3.5" aria-hidden />
            {t("cards.comingSoon")}
          </ComingSoonPill>
          <a
            href={notifyHref(t("notify.emailSubject", { platform: platform.name }))}
            className="inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <BellRing className="h-3.5 w-3.5" aria-hidden />
            {t("cards.getNotified")}
          </a>
        </div>
      </div>
    </GradientBorderCard>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("download");

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <SiteHeader />

      <main>
        {/* Hero — OS-aware CTA on the left, scannable QR on the right */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <GridBackdrop pattern="dots" />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-6 pb-16 pt-16 md:pt-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-24">
            <div>
              <RevealBlur>
                <p className="mb-4 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
                    aria-hidden
                  />
                  {t("hero.eyebrow")}
                </p>
                <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-balance md:text-6xl">
                  {t("hero.title")}
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground text-balance">
                  {t("hero.sub")}
                </p>
              </RevealBlur>
              <FadeUp delay={0.15} className="mt-9">
                <DownloadHero />
                <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("hero.caption")}
                </p>
              </FadeUp>
            </div>

            <FadeUp delay={0.2} className="flex justify-center lg:justify-end lg:pr-4">
              <GradientBorderCard radius="xl" glow="blue" className="p-7">
                <div className="flex flex-col items-center text-center">
                  <QRDisplay
                    value="https://bishare.app/download"
                    size={168}
                  />
                  <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {t("qr.label")}
                  </p>
                  <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                    {t("qr.hint")}
                  </p>
                </div>
              </GradientBorderCard>
            </FadeUp>
          </div>
        </section>

        <div className="h-px w-full bg-border" aria-hidden />

        {/* All five platforms, with honest availability states */}
        <Section
          id="platforms"
          backdrop="lines"
          className="bg-background-raised"
        >
          <SectionHeading
            eyebrow={t("section.eyebrow")}
            title={t("section.title")}
            sub={t("section.sub")}
            centered
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FadeUp className="sm:col-span-2 lg:col-span-4">
              <AndroidCard t={t} />
            </FadeUp>
            {LIVE_PLATFORMS.map((platform, i) => (
              <FadeUp
                key={platform.name}
                delay={staggerDelay(i + 1, 0.07)}
                className="h-full"
              >
                <AvailableCard platform={platform} t={t} />
              </FadeUp>
            ))}
            {COMING_PLATFORMS.map((platform, i) => (
              <FadeUp
                key={platform.name}
                delay={staggerDelay(i + 1 + LIVE_PLATFORMS.length, 0.07)}
                className="h-full"
              >
                <ComingSoonCard platform={platform} t={t} />
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.2}>
            <p className="mt-10 text-center text-sm leading-relaxed text-muted-foreground">
              {t.rich("notify.text", {
                email: SUPPORT_EMAIL,
                link: (chunks) => (
                  <a
                    href={notifyHref(
                      t("notify.emailSubject", {
                        platform: t("notify.myPlatform"),
                      })
                    )}
                    className="rounded font-medium text-accent-blue outline-none transition-opacity hover:opacity-80"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </FadeUp>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
