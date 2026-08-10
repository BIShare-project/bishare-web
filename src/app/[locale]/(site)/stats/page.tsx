import type { Metadata } from "next";
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
    robots: { index: false, follow: true },
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

// Cumulative-uploads area chart (server-rendered SVG, no client JS).
function AreaChart({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="h-40" />;
  const w = 640;
  const h = 160;
  const max = Math.max(1, ...points);
  const step = w / (points.length - 1);
  const xy = points.map((v, i) => [i * step, h - 8 - (v / max) * (h - 22)] as const);
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#ag)" />
      <path d={line} fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--accent-blue)" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Donut breakdown.
function Donut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-strong)" strokeWidth="13" opacity="0.4" />
        {slices.map((s) => {
          const len = (s.value / total) * C;
          const seg = (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="13"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-acc}
              strokeLinecap="butt"
            />
          );
          acc += len;
          return seg;
        })}
      </svg>
      <ul className="space-y-2.5">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-mono font-semibold tabular-nums text-foreground">{nf(s.value)}</span>
          </li>
        ))}
      </ul>
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
  const cumulative = r.dailyUploads.map((d) => (acc += d.value));

  const slices = [
    { label: t("breakdown.files"), value: r.uploadsFiles, color: "var(--accent-blue)" },
    { label: t("breakdown.transfers"), value: r.uploadsTransfers, color: "color-mix(in srgb, var(--foreground) 45%, transparent)" },
    { label: t("breakdown.rooms"), value: r.totalRooms, color: "color-mix(in srgb, var(--foreground) 22%, transparent)" },
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
                <span className="font-mono text-xs text-muted-foreground">{nf(r.totalUploads)}</span>
              </div>
              <AreaChart points={cumulative} />
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{t("charts.composition")}</h2>
              <Donut slices={slices} />
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
