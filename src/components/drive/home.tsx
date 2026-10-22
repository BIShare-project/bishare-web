"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarPlus,
  ChevronRight,
  Cloud,
  CreditCard,
  FileStack,
  FolderTree,
  Globe,
  HardDrive,
  Image as ImageIcon,
  MapPin,
  Monitor,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import type { DriveObject } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { useActions } from "./actions";
import { EmptyState, KIND_COLORS, Kpi, KpiGrid, ObjectThumb, PageHead, Panel } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes, isMedia, percent, when } from "./format";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const DAY = 86_400_000;

/** Overview: the Drive at a glance (the approved mockup's home). */
export function HomePage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const { base, session } = useDrive();
  const index = useIndex();
  const actions = useActions();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const live = index.live();
  const files = live.filter((o) => o.kind === "file");
  const stats = index.stats();
  const info = index.info;
  const used = info?.usedBytes ?? 0;
  const quota = info?.quotaBytes ?? 0;
  const since = Date.now() - range * DAY;
  const added = files.filter((o) => o.createdAt >= since);
  const recent = [...files].sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, 8);
  const words = { today: t("today"), yesterday: t("yesterday") };
  const browsers = index.devices.filter((d) => d.kind === "web").length;
  const trash = index.trash();
  const soon = trash.filter((o) => (o.trashedAt ?? 0) + 30 * DAY - Date.now() < 3 * DAY).length;
  const expiring = index.devices.filter(
    (d) => d.kind === "web" && d.idleLimitMs && d.id !== session.deviceId && (d.lastSeenAt ?? d.addedAt) + d.idleLimitMs - Date.now() < DAY
  ).length;
  const nearlyFull = quota > 0 && used / quota >= 0.9;

  const queue = [
    { n: nearlyFull ? 1 : 0, hot: nearlyFull, title: t("needs.full"), body: t("needs.fullBody", { left: bytes(Math.max(0, quota - used)) }), href: "/storage" },
    { n: soon, hot: false, title: t("needs.trashSoon"), body: t("needs.trashSoonBody"), href: "/trash" },
    { n: expiring, hot: false, title: t("needs.browserExpiring"), body: t("needs.browserExpiringBody"), href: "/devices" },
    { n: index.unreadable, hot: index.unreadable > 0, title: t("needs.unreadable"), body: t("needs.unreadableBody"), href: "/security" },
  ].filter((q) => q.n > 0);

  const sizeOf = (id: string): number => live.filter((o) => o.parent === id).reduce((a, o) => a + (o.kind === "file" ? (o.size ?? 0) : sizeOf(o.id)), 0);
  const largestFolders = live
    .filter((o) => o.kind === "dir" && o.parent === null)
    .map((d) => ({ d, size: sizeOf(d.id), n: index.countUnder(d.id) }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);
  const all = Object.values(stats.byKind).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title={t("home.title")}
        sub={t("home.sub", { days: range })}
        actions={
          <>
            <Button variant="outline" onClick={() => actions.upload(null)}>
              <Upload /> {t("act.upload")}
            </Button>
            <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v) as 7 | 30 | 90)}>
              <TabsList aria-label={t("home.range")}>
                {([7, 30, 90] as const).map((d) => (
                  <TabsTrigger key={d} value={String(d)}>
                    {t("home.days", { days: d })}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </>
        }
      />

      <KpiGrid>
        <Kpi icon={HardDrive} label={t("kpi.used")} value={bytes(used)} sub={t("kpi.usedSub", { pct: percent(used, quota), total: bytes(quota) })} tone={nearlyFull ? "warn" : undefined} help={t("kpiHelp.used")} />
        <Kpi icon={Cloud} label={t("kpi.left")} value={bytes(Math.max(0, quota - used))} sub={info?.plan === "free" ? t("plan.free", { size: bytes(quota) }) : bytes(quota)} help={t("glossary.quota.definition")} />
        <Kpi icon={FileStack} label={t("kpi.files")} value={stats.files.toLocaleString(locale)} sub={t("kpi.added", { n: added.length.toLocaleString(locale), days: range })} help={t("kpiHelp.files")} />
        <Kpi icon={ImageIcon} label={t("kpi.media")} value={stats.media.toLocaleString(locale)} sub={bytes(stats.byKind.media)} help={t("kpiHelp.media")} />
        <Kpi icon={FolderTree} label={t("kpi.folders")} value={stats.folders.toLocaleString(locale)} />
        <Kpi icon={CalendarPlus} label={t("kpi.addedBytes")} value={bytes(added.reduce((a, o) => a + (o.size ?? 0), 0))} sub={t("kpi.inDays", { days: range })} />
        <Kpi icon={Monitor} label={t("kpi.devices")} value={String(index.devices.length)} sub={t("kpi.devicesSub", { apps: index.devices.length - browsers, browsers })} help={t("glossary.device.definition")} />
        <Kpi icon={Trash2} label={t("kpi.trash")} value={bytes(stats.byKind.trash)} sub={t("kpi.trashSub", { n: trash.length })} help={t("kpiHelp.trash")} />
        <Kpi icon={CreditCard} label={t("kpi.plan")} value={info?.plan === "free" ? t("plan.freeShort") : bytes(quota)} sub={t("kpi.planSub")} help={t("glossary.plan.definition")} />
        <Kpi icon={MapPin} label={t("kpi.region")} value={info ? t(`region.${info.region}`) : "…"} sub={t("kpi.regionSub")} help={t("glossary.region.definition")} />
      </KpiGrid>

      <Panel
        title={t("home.chart")}
        description={t("home.chartSub")}
        help={t("home.chartHelp")}
        actions={
          <div className="hidden flex-wrap items-center gap-3 text-2xs text-muted-foreground sm:flex">
            {[
              ["var(--media)", t("kind.media")],
              ["var(--docs)", t("kind.documents")],
              ["var(--other)", t("kind.rest")],
            ].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <i className="inline-block size-2.5" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        }
      >
        <GrowthChart files={files} days={range} locale={locale} labels={{ media: t("kind.media"), docs: t("kind.documents"), rest: t("kind.rest"), total: t("home.total") }} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title={t("home.recent")}
          description={t("home.recentSub")}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href={`${base}/recent`}>{t("home.openRecent")}</Link>
            </Button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={Upload}
              title={t("empty.files")}
              description={t("empty.filesBodyWeb")}
              action={
                <Button className="mt-2" onClick={() => actions.upload(null)}>
                  <Upload /> {t("act.upload")}
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col.name")}</TableHead>
                  <TableHead className="text-end">{t("col.size")}</TableHead>
                  <TableHead>{t("col.modified")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("col.where")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => actions.open(o, recent)}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ObjectThumb o={o} />
                        <span className="max-w-[280px] truncate font-medium">{o.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{bytes(o.size)}</TableCell>
                    <TableCell className="text-muted-foreground">{when(o.mtimeMs, locale, words)}</TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-muted-foreground md:table-cell">{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
        <Panel title={t("needs.title")} description={t("needs.sub")} help={t("needs.help")}>
          {queue.length === 0 ? (
            <EmptyState icon={ShieldCheck} title={t("needs.clear")} description={t("needs.clearBody")} />
          ) : (
            queue.map((q) => (
              <Link key={q.title} href={`${base}${q.href}`} className="flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/60">
                <span className={cn("grid h-7 min-w-8 place-items-center border px-1.5 text-2xs font-semibold tabular-nums", q.hot && "border-foreground bg-foreground text-background")}>{q.n}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{q.title}</span>
                  <span className="block truncate text-3xs text-muted-foreground">{q.body}</span>
                </span>
                <ChevronRight className="flip-rtl size-4 text-muted-foreground" />
              </Link>
            ))
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("home.byKind")} description={t("home.byKindSub", { size: bytes(used) })}>
          {(["media", "documents", "audio", "other", "trash"] as const).map((k) => (
            <div key={k} className="grid grid-cols-[110px_1fr_72px] items-center gap-3 border-b px-4 py-2.5 text-2xs last:border-b-0">
              <span className="truncate">{t(`kind.${k}`)}</span>
              <div className="h-2 overflow-hidden bg-muted">
                <span className="block h-full transition-all" style={{ width: `${(stats.byKind[k] * 100) / all}%`, background: KIND_COLORS[k] }} />
              </div>
              <span className="text-end tabular-nums">{bytes(stats.byKind[k])}</span>
            </div>
          ))}
        </Panel>
        <Panel
          title={t("nav.devices")}
          description={t("home.lastSeen")}
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${base}/devices`}>
                <ChevronRight className="flip-rtl" />
              </Link>
            </Button>
          }
        >
          {index.devices.slice(0, 5).map((d) => {
            const Icon = d.kind === "web" && d.client !== "desktop" ? Globe : d.kind === "app" && /phone|galaxy|pixel|android|ios|iphone/i.test(d.name ?? "") ? Smartphone : Monitor;
            return (
              <div key={d.id} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
                <span className="grid size-7 shrink-0 place-items-center border bg-muted/60">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{d.name ?? t("devices.unnamed")}</span>
                  <span className="block text-3xs text-muted-foreground">
                    {d.id === session.deviceId ? t("devices.thisBrowser") : d.kind === "web" ? t("devices.browser") : t("devices.app")}
                  </span>
                </span>
                <span className="text-3xs text-muted-foreground">{d.id === session.deviceId ? t("devices.now") : d.lastSeenAt ? when(d.lastSeenAt, locale, words) : "—"}</span>
              </div>
            );
          })}
        </Panel>
        <Panel title={t("home.folders")} description={t("home.foldersSub")}>
          {largestFolders.length === 0 ? (
            <EmptyState icon={FolderTree} title={t("empty.folders")} />
          ) : (
            largestFolders.map(({ d, size, n }) => (
              <Link key={d.id} href={`${base}/files?f=${d.id}`} className="flex items-center gap-3 border-b px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/60">
                <ObjectThumb o={d} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{d.name}</span>
                  <span className="block text-3xs text-muted-foreground">{t("items", { n })}</span>
                </span>
                <span className="text-2xs font-semibold tabular-nums">{bytes(size)}</span>
              </Link>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

/**
 * What the Drive holds by the day files were added, stacked by kind. The
 * server keeps no history, so this is built from the files that are there
 * now (a file deleted since does not show).
 */
function GrowthChart({ files, days, locale, labels }: { files: DriveObject[]; days: number; locale: string; labels: { media: string; docs: string; rest: string; total: string } }) {
  const ref = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(1100);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(320, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 260, L = 60, R = 20, T = 18, B = 32;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const end = today.getTime();
  const points = Array.from({ length: days }, (_, i) => end - (days - 1 - i) * DAY);
  const isDoc = (o: DriveObject) => !!o.mime && !isMedia(o.mime) && (o.mime.startsWith("text/") || /pdf|word|excel|sheet|presentation|opendocument/.test(o.mime));
  const series = points.map((at) => {
    const upTo = files.filter((o) => o.createdAt <= at);
    const sum = (p: (o: DriveObject) => boolean) => upTo.filter(p).reduce((a, o) => a + (o.size ?? 0), 0);
    const media = sum((o) => isMedia(o.mime));
    const docs = sum(isDoc);
    const rest = sum((o) => !isMedia(o.mime) && !isDoc(o));
    return { rest, docs, media };
  });
  const max = Math.max(1, ...series.map((s) => s.rest + s.docs + s.media)) * 1.1;
  const x = (i: number) => L + ((w - L - R) * i) / Math.max(1, days - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  let base = series.map(() => 0);
  const layers: { color: string; up: string; down: string }[] = [];
  for (const [key, color] of [
    ["rest", "var(--other)"],
    ["docs", "var(--docs)"],
    ["media", "var(--media)"],
  ] as const) {
    const top = series.map((s, i) => base[i]! + s[key]);
    layers.push({
      color,
      up: top.map((v, i) => `${x(i)},${y(v)}`).join(" "),
      down: base
        .map((v, i) => `${x(i)},${y(v)}`)
        .reverse()
        .join(" "),
    });
    base = top;
  }
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const step = Math.max(1, Math.round(days / (w < 640 ? 4 : 10)));
  const fmtSize = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)} GB` : v >= 1e6 ? `${Math.round(v / 1e6)} MB` : `${Math.round(v / 1e3)} KB`);
  const h = hover === null ? null : series[hover]!;
  return (
    <div className="relative px-1 py-2" dir="ltr">
      <svg
        ref={ref}
        viewBox={`0 0 ${w} ${H}`}
        className="block h-[260px] w-full"
        role="img"
        aria-label={labels.total}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * w;
          setHover(Math.max(0, Math.min(days - 1, Math.round(((px - L) / (w - L - R)) * (days - 1)))));
        }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 1, 2, 3, 4].map((g) => {
          const v = (max * g) / 4;
          return (
            <g key={g}>
              <line x1={L} x2={w - R} y1={y(v)} y2={y(v)} stroke="var(--border)" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
                {fmtSize(v)}
              </text>
            </g>
          );
        })}
        {layers.map((l) => (
          <g key={l.color}>
            <polygon points={`${l.up} ${l.down}`} fill={l.color} fillOpacity={0.16} />
            <polyline points={l.up} fill="none" stroke={l.color} strokeWidth={1.6} />
          </g>
        ))}
        {points.map((at, i) =>
          i % step === 0 ? (
            <text key={at} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
              {fmt.format(new Date(at))}
            </text>
          ) : null
        )}
        {hover !== null ? <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--foreground)" strokeOpacity={0.35} strokeDasharray="3 3" /> : null}
      </svg>
      {hover !== null && h ? (
        <div
          className="pointer-events-none absolute top-3 z-10 w-48 border bg-popover p-2.5 text-2xs shadow-md"
          style={{ left: `min(calc(${(x(hover) / w) * 100}% + 12px), calc(100% - 200px))` }}
        >
          <div className="mb-1.5 font-medium">{fmt.format(new Date(points[hover]!))}</div>
          {[
            ["var(--media)", labels.media, h.media],
            ["var(--docs)", labels.docs, h.docs],
            ["var(--other)", labels.rest, h.rest],
          ].map(([c, l, v]) => (
            <div key={l as string} className="flex items-center gap-1.5 text-muted-foreground">
              <i className="inline-block size-2" style={{ background: c as string }} />
              <span className="flex-1">{l as string}</span>
              <span className="text-foreground tabular-nums">{bytes(v as number)}</span>
            </div>
          ))}
          <div className="mt-1.5 flex border-t pt-1.5 font-medium">
            <span className="flex-1">{labels.total}</span>
            <span className="tabular-nums">{bytes(h.media + h.docs + h.rest)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
