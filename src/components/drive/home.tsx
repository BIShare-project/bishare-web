"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Globe, Monitor, Smartphone } from "lucide-react";
import type { DriveObject } from "@/lib/vault/store";
import { KIND_COLORS, Kpi, ObjectThumb } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes, isMedia, percent, when } from "./format";

const DAY = 86_400_000;

/** Home: the Drive at a glance (the approved mockup's Overview). */
export function HomePage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const { base, session } = useDrive();
  const index = useIndex();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const live = index.live();
  const files = live.filter((o) => o.kind === "file");
  const stats = index.stats();
  const info = index.info;
  const used = info?.usedBytes ?? 0;
  const quota = info?.quotaBytes ?? 0;
  const since = Date.now() - range * DAY;
  const added = files.filter((o) => o.createdAt >= since);
  const recent = [...files].sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, 7);
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
  ];

  const sizeOf = (id: string): number => live.filter((o) => o.parent === id).reduce((a, o) => a + (o.kind === "file" ? (o.size ?? 0) : sizeOf(o.id)), 0);
  const largestFolders = live
    .filter((o) => o.kind === "dir" && o.parent === null)
    .map((d) => ({ d, size: sizeOf(d.id), n: index.countUnder(d.id) }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  return (
    <section className="content">
      <div className="phead">
        <div>
          <h1>{t("home.title")}</h1>
          <p>{t("home.sub", { days: range })}</p>
        </div>
        <span className="grow" />
        <div className="seg" role="group" aria-label={t("home.range")}>
          {([7, 30, 90] as const).map((d) => (
            <button key={d} type="button" className={range === d ? "on" : ""} onClick={() => setRange(d)}>
              {t("home.days", { days: d })}
            </button>
          ))}
        </div>
      </div>

      <div className="kpis">
        <Kpi label={t("kpi.used")} value={bytes(used)} sub={t("kpi.usedSub", { pct: percent(used, quota), total: bytes(quota) })} />
        <Kpi label={t("kpi.left")} value={bytes(Math.max(0, quota - used))} sub={info?.plan === "free" ? t("plan.free", { size: bytes(quota) }) : bytes(quota)} />
        <Kpi label={t("kpi.files")} value={stats.files.toLocaleString(locale)} sub={t("kpi.added", { n: added.length.toLocaleString(locale), days: range })} />
        <Kpi label={t("kpi.media")} value={stats.media.toLocaleString(locale)} sub={bytes(stats.byKind.media)} />
        <Kpi label={t("kpi.folders")} value={stats.folders.toLocaleString(locale)} />
        <Kpi label={t("kpi.addedBytes")} value={bytes(added.reduce((a, o) => a + (o.size ?? 0), 0))} sub={t("kpi.inDays", { days: range })} />
        <Kpi label={t("kpi.devices")} value={String(index.devices.length)} sub={t("kpi.devicesSub", { apps: index.devices.length - browsers, browsers })} />
        <Kpi label={t("kpi.trash")} value={bytes(stats.byKind.trash)} sub={t("kpi.trashSub", { n: trash.length })} />
        <Kpi label={t("kpi.plan")} value={info?.plan === "free" ? t("plan.freeShort") : bytes(quota)} sub={t("kpi.planSub")} />
        <Kpi label={t("kpi.region")} value={info ? t(`region.${info.region}`) : "…"} sub={t("kpi.regionSub")} />
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="ph">
          <div className="grow">
            <b>{t("home.chart")}</b>
            <span>{t("home.chartSub")}</span>
          </div>
          <div className="legend">
            <span>
              <i style={{ background: "var(--media)" }} />
              {t("kind.media")}
            </span>
            <span>
              <i style={{ background: "var(--docs)" }} />
              {t("kind.documents")}
            </span>
            <span>
              <i style={{ background: "var(--other)" }} />
              {t("kind.rest")}
            </span>
          </div>
        </div>
        <GrowthChart files={files} days={range} locale={locale} />
      </div>

      <div className="cols">
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="ph">
            <div className="grow">
              <b>{t("home.recent")}</b>
              <span>{t("home.recentSub")}</span>
            </div>
            <Link className="btn" href={`${base}/recent`}>
              {t("home.openRecent")}
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty">
              <b>{t("empty.files")}</b>
              {t("empty.filesBody")}
            </div>
          ) : (
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t("col.name")}</th>
                    <th className="r">{t("col.size")}</th>
                    <th>{t("col.modified")}</th>
                    <th>{t("col.where")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div className="nm">
                          <ObjectThumb o={o} />
                          <span className="t">{o.name}</span>
                        </div>
                      </td>
                      <td className="r num">{bytes(o.size)}</td>
                      <td>{when(o.mtimeMs, locale, words)}</td>
                      <td className="mute">{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="panel queue">
          <div className="ph">
            <div>
              <b>{t("needs.title")}</b>
              <span>{t("needs.sub")}</span>
            </div>
          </div>
          {queue.every((q) => q.n === 0) ? (
            <div className="empty">
              <b>{t("needs.clear")}</b>
              {t("needs.clearBody")}
            </div>
          ) : null}
          {queue.filter((q) => q.n > 0).map((q) => (
            <Link key={q.title} href={`${base}${q.href}`}>
              <span className={`c num ${q.hot ? "hot" : ""}`}>{q.n}</span>
              <span>
                <b>{q.title}</b>
                <span>{q.body}</span>
              </span>
              <ChevronRight className="ic" />
            </Link>
          ))}
        </div>
      </div>

      <div className="trio">
        <div className="panel">
          <div className="ph">
            <div className="grow">
              <b>{t("home.byKind")}</b>
              <span>{t("home.byKindSub", { size: bytes(used) })}</span>
            </div>
          </div>
          {(["media", "documents", "audio", "other", "trash"] as const).map((k) => {
            const v = stats.byKind[k];
            const all = Object.values(stats.byKind).reduce((a, b) => a + b, 0) || 1;
            return (
              <div className="krow" key={k}>
                <span>{t(`kind.${k}`)}</span>
                <div className="bar">
                  <span style={{ width: `${(v * 100) / all}%`, background: KIND_COLORS[k] }} />
                </div>
                <span className="num">{bytes(v)}</span>
              </div>
            );
          })}
        </div>
        <div className="panel">
          <div className="ph">
            <div className="grow">
              <b>{t("nav.devices")}</b>
              <span>{t("home.lastSeen")}</span>
            </div>
          </div>
          {index.devices.slice(0, 6).map((d) => {
            const Icon = d.kind === "web" ? Globe : /phone|galaxy|pixel|android|ios/i.test(d.name ?? "") ? Smartphone : Monitor;
            return (
              <div className="line" key={d.id}>
                <span className="ico">
                  <Icon className="ic" />
                </span>
                <div className="t">
                  <b>{d.name ?? t("devices.unnamed")}</b>
                  <span>{d.id === session.deviceId ? t("devices.thisBrowser") : d.kind === "web" ? t("devices.browser") : t("devices.app")}</span>
                </div>
                <span className="mute" style={{ fontSize: 12 }}>
                  {d.lastSeenAt ? when(d.lastSeenAt, locale, words) : "—"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="panel">
          <div className="ph">
            <div className="grow">
              <b>{t("home.folders")}</b>
              <span>{t("home.foldersSub")}</span>
            </div>
          </div>
          {largestFolders.length === 0 ? (
            <div className="empty">{t("empty.folders")}</div>
          ) : (
            largestFolders.map(({ d, size, n }) => (
              <Link className="line" key={d.id} href={`${base}/files?f=${d.id}`}>
                <ObjectThumb o={d} />
                <div className="t">
                  <b>{d.name}</b>
                  <span>{t("items", { n })}</span>
                </div>
                <span className="num" style={{ fontWeight: 600 }}>
                  {bytes(size)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * What the Drive holds by the day files were added, stacked by kind. The
 * server keeps no history, so this is built from the files that are there
 * now (a file deleted since does not show).
 */
function GrowthChart({ files, days, locale }: { files: DriveObject[]; days: number; locale: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(1100);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(600, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 280, L = 60, R = 20, T = 18, B = 32;
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
  const step = Math.max(1, Math.round(days / 10));
  const fmtSize = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)} GB` : v >= 1e6 ? `${Math.round(v / 1e6)} MB` : `${Math.round(v / 1e3)} KB`);
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${H}`} style={{ display: "block", width: "100%", height: H }} role="img" aria-label="">
      {[0, 1, 2, 3, 4].map((g) => {
        const v = (max * g) / 4;
        return (
          <g key={g}>
            <line x1={L} x2={w - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--mute)">
              {fmtSize(v)}
            </text>
          </g>
        );
      })}
      {layers.map((l) => (
        <g key={l.color}>
          <polygon points={`${l.up} ${l.down}`} fill={l.color} fillOpacity={0.18} />
          <polyline points={l.up} fill="none" stroke={l.color} strokeWidth={1.6} />
        </g>
      ))}
      {points.map((at, i) =>
        i % step === 0 ? (
          <text key={at} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--mute)">
            {fmt.format(new Date(at))}
          </text>
        ) : null
      )}
    </svg>
  );
}
