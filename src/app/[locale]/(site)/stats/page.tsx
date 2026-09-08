import type { Metadata } from "next";
import { buildAlternates } from "@/i18n/metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowLeftRight,
  CalendarDays,
  DoorOpen,
  DownloadCloud,
  HardDrive,
  Layers,
  UploadCloud,
  Users,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { reportBundle } from "@/lib/admin/report";
import { formatBytes } from "@/lib/admin/format";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { StatsLiveSocket } from "@/components/site/stats-live-socket";
import { AreaChart, Donut } from "@/components/site/stats-charts";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stats" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    // Indexable: the live numbers are a real page, and a public stats page is
    // exactly the kind of thing an open-source project is asked to show.
    alternates: buildAlternates(locale, "/stats"),
  };
}

const nf = (n: number) => n.toLocaleString("en-US");

// Compact stat tile.
function Stat({
  value,
  label,
  sub,
  icon: Icon,
  accent = false,
}: {
  value: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3.5 transition-colors hover:border-border-strong">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${accent ? "text-accent-blue" : "text-muted-foreground"}`}
          strokeWidth={2.25}
        />
        <span className="truncate text-[12px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("stats");
  const r = await reportBundle();

  const model = [
    t("model.noAccount"),
    t("model.expiry"),
    t("model.encrypted"),
    t("model.platforms"),
    t("model.openSource"),
    t("model.local"),
  ];

  // Cumulative upload curve.
  let acc = 0;
  const cumulative = r.dailyUploads.map((d) => ({ date: d.date, value: (acc += d.value) }));

  const slices = [
    { label: t("breakdown.transfers"), value: r.uploadsTransfers, color: "var(--accent-blue)" },
    // Room FILES, not room count — the segments have to add up to the total
    // shown beside them, and totalRooms counted rooms opened, not files in them.
    { label: t("breakdown.rooms"), value: r.uploadsRoomFiles, color: "color-mix(in srgb, var(--foreground) 22%, transparent)" },
    { label: t("breakdown.nearby"), value: r.nearbyTransfers, color: "color-mix(in srgb, var(--accent-blue) 55%, transparent)" },
  ];

  return (
    <>
      <StatsLiveSocket />
      <SiteHeader />
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] isolate"
          aria-hidden
          style={{
            background:
              "radial-gradient(58% 100% at 50% 0%, color-mix(in srgb, var(--accent-blue) 20%, transparent), transparent 70%)",
          }}
        />

        <div className="mx-auto max-w-5xl px-6 py-16">
          <header className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-blue backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-blue opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-blue" />
              </span>
              {t("hero.eyebrow")}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] text-muted-foreground">
              {t("hero.body")}{" "}
              {r.launchDate && (
                <span className="text-foreground">
                  {t("hero.since", { days: nf(r.daysLive), date: r.launchDate })}
                </span>
              )}
            </p>
          </header>

          {/* Compact KPI grid */}
          <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat value={nf(r.uniqueUsers)} label={t("cards.uniqueUsers")} sub={t("cards.uniqueUsersSub")} icon={Users} accent />
            <Stat value={nf(r.totalUploads)} label={t("cards.filesShared")} sub={t("cards.sinceLaunch")} icon={UploadCloud} />
            <Stat value={nf(r.totalDownloads)} label={t("cards.downloads")} sub={t("cards.downloadsSub")} icon={DownloadCloud} accent />
            <Stat value={formatBytes(r.downloadBytes)} label={t("cards.dataDownloaded")} sub={t("cards.dataDownloadedSub")} icon={HardDrive} />
            <Stat value={nf(r.liveTransfers)} label={t("cards.liveTransfers")} sub={t("cards.liveTransfersSub")} icon={ArrowLeftRight} />
            <Stat value={nf(r.totalRooms)} label={t("cards.rooms")} sub={t("cards.sinceLaunch")} icon={DoorOpen} />
            <Stat value="5" label={t("cards.platforms")} sub={t("cards.platformsSub")} icon={Layers} accent />
            <Stat value={nf(r.nearbyTransfers)} label={t("cards.nearby")} sub={t("cards.nearbySub")} icon={Wifi} accent />
            <Stat value={formatBytes(r.nearbyBytes)} label={t("cards.nearbyData")} sub={t("cards.nearbyDataSub")} icon={HardDrive} />
            <Stat value={nf(r.daysLive)} label={t("cards.daysLive")} sub={r.launchDate ?? ""} icon={CalendarDays} />
          </section>

          {/* Charts */}
          <section className="mt-3 grid gap-2.5 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-card/60 p-5 lg:col-span-3">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-foreground">{t("charts.growth")}</h2>
                {/* The curve's own end value, not the all-time total: room
                    files have no per-day counter, so they cannot be plotted.
                    Showing the total here would label a curve with a number it
                    never reaches. */}
                <span className="font-mono text-xs text-muted-foreground">
                  {nf(cumulative.at(-1)?.value ?? 0)}
                </span>
              </div>
              <AreaChart points={cumulative} />
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{t("charts.composition")}</h2>
              <Donut slices={slices} totalLabel={t("cards.filesShared")} />
            </div>
          </section>

          {/* Model */}
          <section className="mt-14">
            <h2 className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("model.title")}
            </h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {model.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                  {m}
                </span>
              ))}
            </div>
          </section>

          <div className="mt-12 flex justify-center">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              {t("cta")}
            </Link>
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
            {t("footnote")}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
