import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Section, SectionHeading } from "@/components/site/section";
import { FadeUp, RevealBlur } from "@/components/site/motion";
import { Beam } from "@/components/site/beam";
import {
  IconTile,
  MetricBar,
  MockSurface,
} from "@/components/site/mock-surface";
import { StatusPill, TagBadge } from "@/components/site/status-pill";
import { MoreFeaturesGrid } from "./more-features";
import { QRDisplay } from "@/components/site/qr-display";
import { StoreButtons } from "@/components/site/store-buttons";
import { GridBackdrop } from "@/components/site/grid-backdrop";
import { sharedOpenGraph } from "@/lib/og";
import {
  Wifi,
  PlayCircle,
  Play,
  Lock,
  LayoutGrid,
  ClipboardCopy,
  Users,
  Link2,
  Globe,
  Check,
  ArrowRight,
  ArrowDown,
  Laptop,
  Smartphone,
  Monitor,
  TabletSmartphone,
  FolderArchive,
  FileText,
  Image as ImageIcon,
  Clock,
  Download,
  FileUp,
  KeyRound,
  FolderSync,
  CloudUpload,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "features" });
  const description = t("metadata.description");
  return {
    title: t("metadata.title"),
    description,
    alternates: buildAlternates(locale, "/features"),
    ...sharedOpenGraph(t("metadata.ogTitle"), description, "/features"),
  };
}

/* ── Small building blocks (page-local) ─────────────────────────────── */

function DeviceRow({
  icon: Icon,
  name,
  note,
  right,
}: {
  icon: LucideIcon;
  name: string;
  note: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <IconTile icon={Icon} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{note}</p>
      </div>
      {right}
    </div>
  );
}

/** Live-presence dot: the one animated beat in the device list. */
function OnlineDot() {
  return (
    <span
      className="pulse-dot relative h-2 w-2 shrink-0 rounded-full bg-success"
      aria-hidden
    />
  );
}

/* ── Flagship visuals (pure CSS mocks, no invented screenshots) ─────── */

async function LanVisual() {
  const t = await getTranslations("features");
  return (
    <MockSurface accent ticks className="mx-auto w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TagBadge>LAN</TagBadge>
          <TagBadge>E2E</TagBadge>
        </div>
        <StatusPill variant="online">{t("visuals.lan.connected")}</StatusPill>
      </div>
      <div className="flex items-center gap-3.5">
        <IconTile icon={FolderArchive} accent />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">studio-masters.zip</p>
          <p className="text-xs text-muted-foreground">
            {t("visuals.lan.note")}
          </p>
        </div>
        <span className="font-mono text-sm font-semibold text-foreground shrink-0">
          62%
        </span>
      </div>
      <MetricBar percent={62} className="mt-4" />
      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Wifi className="h-3.5 w-3.5" /> {t("visuals.lan.direct")}
        </span>
        <span className="font-mono">96 MB/s</span>
      </div>
    </MockSurface>
  );
}

async function DashboardVisual() {
  const t = await getTranslations("features");
  return (
    <MockSurface className="mx-auto w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold">{t("visuals.dashboard.devices")}</p>
        <StatusPill variant="online">
          {t("visuals.dashboard.online")}
        </StatusPill>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {t("visuals.dashboard.onlineNow")}
      </p>
      <DeviceRow
        icon={Laptop}
        name="Nadia’s MacBook"
        note={t("visuals.dashboard.sentToday")}
        right={<OnlineDot />}
      />
      <DeviceRow
        icon={Smartphone}
        name="Pixel 9 Pro"
        note={t("visuals.dashboard.autoAccept")}
        right={<OnlineDot />}
      />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-1">
        {t("visuals.dashboard.knownDevices")}
      </p>
      <DeviceRow
        icon={Monitor}
        name="Studio PC"
        note={t("visuals.dashboard.favorite")}
        right={
          <span className="text-xs text-muted-foreground shrink-0">
            {t("visuals.dashboard.hoursAgo")}
          </span>
        }
      />
      <DeviceRow
        icon={TabletSmartphone}
        name="iPad Air"
        note={t("visuals.dashboard.transfers")}
        right={
          <span className="text-xs text-muted-foreground shrink-0">
            {t("visuals.dashboard.yesterday")}
          </span>
        }
      />
    </MockSurface>
  );
}

async function ClipboardVisual() {
  const t = await getTranslations("features");
  return (
    <div className="mx-auto max-w-md w-full">
      <MockSurface className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IconTile icon={Laptop} size="sm" />
            <div>
              <p className="text-sm font-semibold">
                {t("visuals.clipboard.copiedOn")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("visuals.clipboard.justNow")}
              </p>
            </div>
          </div>
          <TagBadge>{t("visuals.clipboard.image")}</TagBadge>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3.5 py-2.5">
          <ImageIcon className="h-4 w-4 text-foreground shrink-0" />
          <span className="text-xs font-medium truncate">
            dashboard-mock.png
          </span>
          <span className="font-mono text-xs text-muted-foreground ml-auto shrink-0">
            1.2 MB
          </span>
        </div>
      </MockSurface>

      {/* The hop between devices — a light packet falling into the phone */}
      <div className="relative flex h-14 justify-center" aria-hidden>
        <Beam
          path="M 1 0 L 1 100"
          width={2}
          height={100}
          preserveAspectRatio="none"
          duration={2.8}
          className="h-full w-[2px]"
        />
        <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[var(--glow-card)]">
          <ArrowDown className="h-4 w-4" />
        </div>
      </div>

      <MockSurface accent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconTile icon={Smartphone} size="sm" accent />
            <div>
              <p className="text-sm font-semibold">Pixel 9 Pro</p>
              <p className="text-xs text-muted-foreground">
                {t("visuals.clipboard.readyToPaste")}
              </p>
            </div>
          </div>
          <StatusPill variant="online">
            {t("visuals.clipboard.synced")}
          </StatusPill>
        </div>
      </MockSurface>
    </div>
  );
}

async function RoomsVisual() {
  const t = await getTranslations("features");
  return (
    <MockSurface className="mx-auto w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <p className="text-sm font-semibold">{t("visuals.rooms.name")}</p>
          <TagBadge>{t("visuals.rooms.badge")}</TagBadge>
        </div>
        <span className="font-mono text-sm font-semibold tracking-[0.18em] text-foreground">
          Q4KM
        </span>
      </div>
      <div className="flex items-center mb-5">
        {["MA", "JO", "RI", "SF"].map((initials, i) => (
          <span
            key={initials}
            className={`w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-foreground ${
              i > 0 ? "-ml-2" : ""
            }`}
          >
            {initials}
          </span>
        ))}
        <span className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground -ml-2">
          +10
        </span>
      </div>
      <DeviceRow
        icon={FileText}
        name="brief-v3.pdf"
        note={t("visuals.rooms.pdfNote")}
        right={<Download className="h-4 w-4 text-muted-foreground shrink-0" />}
      />
      <DeviceRow
        icon={FolderArchive}
        name="b-roll.zip"
        note={t("visuals.rooms.zipNote")}
        right={<Download className="h-4 w-4 text-muted-foreground shrink-0" />}
      />
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> {t("visuals.rooms.members")}
      </div>
    </MockSurface>
  );
}

async function RemoteVisual() {
  const t = await getTranslations("features");
  return (
    <MockSurface accent ticks className="mx-auto w-full max-w-md p-6">
      <div className="flex flex-col items-center gap-5 py-3">
        {/* The QR under a slow scan line — the "point your camera" cue */}
        <div className="relative overflow-hidden rounded-lg">
          <QRDisplay value="https://bishare.app" size={168} />
          <span className="qr-scan" aria-hidden />
        </div>
        <span className="font-mono text-xl font-semibold tracking-[0.25em] pl-[0.25em]">
          X4K-9PM
        </span>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {t("visuals.remote.expires")}
        </p>
      </div>
    </MockSurface>
  );
}

/** The preview flagship: a video scrubbing from an encrypted link, with the
 *  point made explicit — the relay holds ciphertext while this plays. */
async function PreviewVisual() {
  const t = await getTranslations("features");
  return (
    <MockSurface accent className="mx-auto w-full max-w-md p-5">
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
            <span className="block h-full w-2/3 bg-accent-blue" />
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-medium">{t("visuals.preview.playing")}</span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> {t("visuals.preview.encrypted")}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {t("visuals.preview.note")}
      </p>
    </MockSurface>
  );
}

async function BrowserVisual() {
  const t = await getTranslations("features");
  return (
    <MockSurface bare className="mx-auto w-full max-w-md">
      <div className="flex items-center gap-3 border-b border-border bg-secondary px-4 py-2.5">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-background border border-border px-3 py-1 text-xs text-muted-foreground">
          <KeyRound className="h-3 w-3" /> macbook-pro.local
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="drop-zone rounded-lg border border-dashed border-border-strong bg-secondary p-5 text-center">
          <FileUp className="h-5 w-5 text-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold">
            {t("visuals.browser.dropTitle")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("visuals.browser.dropHint")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <IconTile icon={FolderArchive} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">
              {t("visuals.browser.folderName")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("visuals.browser.fileCount")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground shrink-0">
            <Download className="h-3.5 w-3.5" /> .zip
          </span>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium truncate">IMG_2041.heic</span>
            <span className="font-mono text-muted-foreground shrink-0">78%</span>
          </div>
          <MetricBar percent={78} />
        </div>
      </div>
    </MockSurface>
  );
}

async function FolderSyncVisual() {
  const t = await getTranslations("features");
  return (
    <MockSurface className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagBadge>SYNC</TagBadge>
          <TagBadge>LAN-FIRST</TagBadge>
        </div>
        <StatusPill variant="muted">
          {t("visuals.folderSync.comingSoon")}
        </StatusPill>
      </div>
      <div className="flex items-center gap-3.5">
        <IconTile icon={FolderSync} accent />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Design/</p>
          <p className="text-xs text-muted-foreground">
            {t("visuals.folderSync.identical")}
          </p>
        </div>
        <CloudUpload className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-4 space-y-1">
        <DeviceRow
          icon={Laptop}
          name="Editing iMac"
          note={t("visuals.folderSync.iMacNote")}
          right={<Check className="h-4 w-4 shrink-0 text-success" />}
        />
        <DeviceRow
          icon={Smartphone}
          name="Pixel 9 Pro"
          note={t("visuals.folderSync.pixelNote")}
          right={<Check className="h-4 w-4 shrink-0 text-success" />}
        />
      </div>
    </MockSurface>
  );
}

/* ── Overview grid data ──────────────────────────────────────────────── */

/** Icons stay in code; titles/descriptions come from the "features" namespace. */
const OVERVIEW_ICONS: LucideIcon[] = [
  Wifi,
  LayoutGrid,
  ClipboardCopy,
  Users,
  Globe,
  Clock,
];

interface OverviewText {
  title: string;
  description: string;
}

/* ── Flagship showcase data ──────────────────────────────────────────── */

/** Icon + visual + shipped-flag stay in code; copy comes from translations. */
const FLAGSHIP_META: {
  icon: LucideIcon;
  visual: ReactNode;
  comingSoon?: boolean;
}[] = [
  { icon: Wifi, visual: <LanVisual /> },
  { icon: LayoutGrid, visual: <DashboardVisual /> },
  { icon: ClipboardCopy, visual: <ClipboardVisual /> },
  { icon: Users, visual: <RoomsVisual /> },
  { icon: Link2, visual: <RemoteVisual /> },
  { icon: PlayCircle, visual: <PreviewVisual /> },
  { icon: Globe, visual: <BrowserVisual /> },
  { icon: FolderSync, visual: <FolderSyncVisual />, comingSoon: true },
];

interface FlagshipText {
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("features");

  const overview = t.raw("overview.items") as OverviewText[];
  const flagships = t.raw("flagships.items") as FlagshipText[];

  // overflow-x-CLIP, not hidden — hidden creates a scroll box that kills
  // the sticky header (same bug documented on the homepage wrapper).
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
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-5 leading-relaxed">
                {t("hero.subtitle")}
              </p>
            </RevealBlur>
          </div>
        </section>

        {/* Overview — the toolkit at a glance */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <h2 className="sr-only">{t("overview.srHeading")}</h2>
            <FadeUp>
              <div className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
                {overview.map((o, i) => {
                  const Icon = OVERVIEW_ICONS[i];
                  return (
                    <div
                      key={i}
                      className="border-b border-r border-border p-8"
                    >
                      <Icon className="h-5 w-5 text-foreground" />
                      <h3 className="mt-5 text-base font-semibold tracking-[-0.01em]">
                        {o.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                        {o.description}
                      </p>
                    </div>
                  );
                })}
                <div className="flex items-center gap-5 border-b border-r border-border p-8">
                  <QRDisplay value="https://bishare.app" size={92} />
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-[-0.01em]">
                      {t("overview.remoteShare.title")}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                      {t.rich("overview.remoteShare.desc", {
                        code: (chunks) => (
                          <span className="font-mono text-foreground">
                            {chunks}
                          </span>
                        ),
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Flagship showcases */}
        {FLAGSHIP_META.map((meta, i) => {
          const feature = flagships[i];
          const Icon = meta.icon;
          const flip = i % 2 === 1;
          return (
            <Section
              key={i}
              className={flip ? "bg-background-raised" : undefined}
            >
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <FadeUp className={flip ? "lg:order-2" : undefined}>
                  <div className="max-w-lg">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {feature.eyebrow}
                      </span>
                      {meta.comingSoon && (
                        <TagBadge>{t("flagships.comingSoonBadge")}</TagBadge>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-balance">
                      {feature.title}
                    </h2>
                    <p className="text-muted-foreground mt-4 leading-relaxed">
                      {feature.desc}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {feature.points.map((point, pi) => (
                        <li key={pi} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background-raised text-foreground shrink-0">
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>
                <FadeUp delay={0.1} className={flip ? "lg:order-1" : undefined}>
                  {meta.visual}
                </FadeUp>
              </div>
            </Section>
          );
        })}

        {/* More features */}
        <Section backdrop="dots">
          <SectionHeading
            eyebrow={t("more.eyebrow")}
            title={t("more.title")}
            sub={t("more.sub")}
            centered
          />
          <MoreFeaturesGrid />
        </Section>

        {/* CTA */}
        <Section className="bg-background-raised">
          <FadeUp className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-balance">
              {t("cta.title")}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              {t("cta.description")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-5">
              <StoreButtons className="justify-center" />
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
              >
                {t("cta.link")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
