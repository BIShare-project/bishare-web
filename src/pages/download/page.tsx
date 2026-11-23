import { Card } from "@/ui/card";
import type { Metadata } from "@/site/metadata";
import { getTranslations } from "@/i18n/translate";
import { buildAlternates } from "@/i18n/metadata";
import type { IconComponent } from "@/ui/icons";
import { SiteHeader } from "@/ui/header";
import { SiteFooter } from "@/ui/footer";
import { Section, SectionHeading } from "@/ui/section";
import { QRDisplay } from "@/ui/qr-display";
import { GridBackdrop } from "@/ui/section";
import { StatusPill, TagBadge } from "@/ui/status-pill";
import { Button } from "@/ui/button";
import {
  appStoreUrl,
  playStoreUrl,
  MICROSOFT_STORE_URL,
  AppleGlyph,
  PlayGlyph,
  MicrosoftGlyph,
} from "@/ui/store-buttons";
import { WebQuickCta } from "@/ui/web-quick-cta";
import { InstallApp } from "@/ui/install-app";
import { sharedOpenGraph } from "@/lib/og";
import { DownloadHero } from "./download-hero";
import { RELEASES_URL } from "./availability";
import { AppJsonLd } from "@/lib/app-ld";
import {
  HardDriveDownload,
  Laptop,
  Monitor,
  Smartphone,
  TabletSmartphone,
  Terminal,
} from "@/ui/icons";

/** Translator bound to the "download" namespace. */
type T = Awaited<ReturnType<typeof getTranslations>>;

/** Current app version, surfaced in the changelog badge. */
const VERSION = "v2.5.0";

export async function generateMetadata({ locale }: { locale: string }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "download" });
  const description = t("meta.description");

  return {
    title: t("meta.title"),
    description,
    alternates: buildAlternates(locale, "/download"),
    ...sharedOpenGraph(t("meta.ogTitle"), description, "/download", undefined, locale),
  };
}

/* ── Platform availability (honest states, no dead links) ─────────────── */

interface LivePlatform {
  name: string;
  key: "ios" | "macos" | "windows" | "linux";
  icon: IconComponent;
  href: string;
  /** Where the button sends people: a storefront, or the release assets. */
  store: "apple" | "microsoft" | "direct";
}

/** Live on the App Store (id6760924092), the Microsoft Store (9pgx5fsbqzmx),
 *  and Google Play. */
const LIVE_PLATFORMS: LivePlatform[] = [
  {
    name: "iOS",
    key: "ios",
    icon: TabletSmartphone,
    href: appStoreUrl("download"),
    store: "apple",
  },
  {
    name: "macOS",
    key: "macos",
    icon: Laptop,
    href: appStoreUrl("download"),
    store: "apple",
  },
  {
    name: "Windows",
    key: "windows",
    icon: Monitor,
    href: MICROSOFT_STORE_URL,
    store: "microsoft",
  },
  // No Linux store: every release carries a .deb, an AppImage and a tarball.
  {
    name: "Linux",
    key: "linux",
    icon: Terminal,
    href: RELEASES_URL,
    store: "direct",
  },
];

/* ── Page-local cards ─────────────────────────────────────────────────── */

/** The one live platform — the flagship card of the grid. */
function AndroidCard({ t }: { t: T }) {
  return (
    <Card hover>
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
          <Button href={playStoreUrl("download")} variant="primary" size="lg">
            <PlayGlyph />
            {t("android.cta")}
          </Button>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("android.free")}
          </p>
        </div>
      </div>
    </Card>
  );
}

/** A shipped platform — real store button, no pill. */
function AvailableCard({ platform, t }: { platform: LivePlatform; t: T }) {
  const Icon = platform.icon;
  return (
    <Card hover className="h-full">
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
          <Button
            href={platform.href}
            variant="primary"
            size="md"
            class="w-full"
          >
            {platform.store === "apple" ? (
              <AppleGlyph />
            ) : platform.store === "microsoft" ? (
              <MicrosoftGlyph />
            ) : (
              <HardDriveDownload className="h-4 w-4" />
            )}
            {platform.store === "apple"
              ? t("cards.appStore")
              : platform.store === "microsoft"
                ? t("cards.microsoftStore")
                : t("cards.directDownload")}
          </Button>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("cards.free")}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function DownloadPage() {
  const t = await getTranslations("download");

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <AppJsonLd />
      <SiteHeader />

      <main>
        {/* Hero — OS-aware CTA on the left, scannable QR on the right */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <GridBackdrop pattern="dots" />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-6 pb-16 pt-16 md:pt-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-24">
            <div>
              <div>
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
              </div>
              <div className="mt-9">
                <DownloadHero />
                <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("hero.caption")}
                </p>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end lg:pr-4">
              <Card hover className="p-7">
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
              </Card>
            </div>
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
            <div className="sm:col-span-2 lg:col-span-4">
              <AndroidCard t={t} />
            </div>
            {LIVE_PLATFORMS.map((platform) => (
              <div key={platform.name} className="h-full">
                <AvailableCard platform={platform} t={t} />
              </div>
            ))}
          </div>

          {/* Installable web app — only renders when the browser says so, so
              Safari/Firefox (and the installed app itself) see no gap here. */}
          <InstallApp variant="card" className="mt-5" />

        </Section>
      </main>

      <WebQuickCta />
      <SiteFooter />
    </div>
  );
}
