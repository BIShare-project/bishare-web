"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe, Monitor, Smartphone } from "lucide-react";
import type { DriveObject } from "@/lib/vault/store";
import { KIND_COLORS, Kpi, ObjectThumb } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes, dayTitle, percent, when } from "./format";

const DAY = 86_400_000;

/** Photos & videos: every picture of the Drive by the day it was taken. */
export function PhotosPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const index = useIndex();
  const media = index
    .live()
    .filter((o) => o.kind === "file" && !!o.mime && (o.mime.startsWith("image/") || o.mime.startsWith("video/")))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  const days = new Map<string, DriveObject[]>();
  for (const o of media) {
    const d = new Date(o.mtimeMs);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    days.set(key, [...(days.get(key) ?? []), o]);
  }
  const size = media.reduce((a, o) => a + (o.size ?? 0), 0);
  return (
    <section className="content">
      <div className="phead">
        <div>
          <h1>{t("kind.media")}</h1>
          <p>{t("photos.sub", { n: media.length.toLocaleString(locale), size: bytes(size) })}</p>
        </div>
      </div>
      {media.length === 0 ? (
        <div className="panel empty">
          <b>{t("empty.photos")}</b>
          {t("empty.photosBody")}
        </div>
      ) : (
        [...days.values()].map((list) => (
          <div key={list[0]!.id}>
            <div className="day">
              <b>{dayTitle(list[0]!.mtimeMs, locale)}</b>
              <span>{t("items", { n: list.length })}</span>
            </div>
            <div className="pgrid">
              {list.map((o) => (
                <div className="tile" key={o.id} title={o.name}>
                  <ObjectThumb o={o} className="" />
                  {o.mime?.startsWith("video/") ? <span className="v">▶</span> : null}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

/** Devices: every app and browser that holds the key. */
export function DevicesPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const { session, lock } = useDrive();
  const index = useIndex();
  const words = { today: t("today"), yesterday: t("yesterday") };
  const apps = index.devices.filter((d) => d.kind !== "web");
  const browsers = index.devices.filter((d) => d.kind === "web");
  return (
    <section className="content">
      <div className="phead">
        <div>
          <h1>{t("nav.devices")}</h1>
          <p>{t("devices.sub")}</p>
        </div>
      </div>
      <div className="kpis k3">
        <Kpi label={t("devices.apps")} value={String(apps.length)} />
        <Kpi label={t("devices.browsers")} value={String(browsers.length)} sub={t("devices.browsersSub", { n: browsers.filter((d) => (d.idleLimitMs ?? 0) > DAY).length })} />
        <Kpi label={t("devices.thisOne")} value={session.name} sub={session.stay ? t("staysSignedIn") : t("locksWhenClosed")} />
      </div>
      <div className="panel scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("devices.device")}</th>
              <th>{t("col.kind")}</th>
              <th>{t("devices.lastUsed")}</th>
              <th>{t("devices.added")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {index.devices.map((d) => {
              const Icon = d.kind === "web" ? Globe : /phone|galaxy|pixel|android|ios/i.test(d.name ?? "") ? Smartphone : Monitor;
              const me = d.id === session.deviceId;
              return (
                <tr key={d.id}>
                  <td style={{ height: 52 }}>
                    <div className="nm">
                      <span className="ico">
                        <Icon className="ic" />
                      </span>
                      <span>
                        <span className="t">{d.name ?? t("devices.unnamed")}</span>
                        <div className="mute" style={{ fontWeight: 400, fontSize: 12 }}>
                          {me
                            ? t("devices.thisBrowser")
                            : d.kind !== "web"
                              ? t("devices.app")
                              : (d.idleLimitMs ?? 0) < DAY
                                ? t("devices.browserHours", { n: Math.round((d.idleLimitMs ?? 0) / 3_600_000) })
                                : t("devices.browserDays", { n: Math.round((d.idleLimitMs ?? 0) / DAY) })}
                        </div>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="tag">{d.kind === "web" ? t("devices.web") : t("devices.appTag")}</span>
                  </td>
                  <td>{me ? t("devices.now") : d.lastSeenAt ? when(d.lastSeenAt, locale, words) : "—"}</td>
                  <td className="mute">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(d.addedAt))}</td>
                  <td>
                    {me ? (
                      <button type="button" className="btn" onClick={() => void lock()}>
                        {t("lock")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mute" style={{ fontSize: 12, marginTop: 10 }}>
        {t("devices.note")}
      </p>
    </section>
  );
}

/** Trash: what goes for good 30 days after it was moved there. */
export function TrashPage() {
  const t = useTranslations("drive");
  const index = useIndex();
  const items = index.trash().sort((a, b) => (a.trashedAt ?? 0) - (b.trashedAt ?? 0));
  const size = items.reduce((a, o) => a + index.treeSize(o.id), 0);
  return (
    <section className="content">
      <div className="phead">
        <div>
          <h1>{t("nav.trash")}</h1>
          <p>{t("trash.sub", { n: items.length, size: bytes(size) })}</p>
        </div>
      </div>
      <div className="panel scroll">
        {items.length === 0 ? (
          <div className="empty">
            <b>{t("empty.trash")}</b>
            {t("empty.trashBody")}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>{t("col.name")}</th>
                <th className="r">{t("col.size")}</th>
                <th>{t("trash.wasIn")}</th>
                <th style={{ width: 220 }}>{t("trash.goneIn")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const left = Math.max(0, Math.ceil(((o.trashedAt ?? 0) + 30 * DAY - Date.now()) / DAY));
                const hot = left <= 3;
                return (
                  <tr key={o.id}>
                    <td>
                      <div className="nm">
                        <ObjectThumb o={o} />
                        <span className="t">{o.name}</span>
                      </div>
                    </td>
                    <td className="r num">{bytes(index.treeSize(o.id))}</td>
                    <td className="mute">{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</td>
                    <td>
                      <div className="row">
                        <span className="num" style={{ width: 64, ...(hot ? { color: "var(--red)", fontWeight: 600 } : {}) }}>
                          {t("trash.days", { n: left })}
                        </span>
                        <div className="bar grow" style={{ height: 4 }}>
                          <span style={{ width: `${((30 - left) / 30) * 100}%`, background: hot ? "var(--red)" : "var(--mute)" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="mute" style={{ fontSize: 12, marginTop: 10 }}>
        {t("trash.note")}
      </p>
    </section>
  );
}

const PLANS = [
  { size: "100 GB", month: "$1.99", year: "$19.99" },
  { size: "250 GB", month: "$4.99", year: "$49.99" },
  { size: "500 GB", month: "$9.99", year: "$99.99" },
  { size: "1 TB", month: "$19.99", year: "$199.99" },
];

/** Plan & storage: the quota, what fills it, and the plans (bought in the app). */
export function StoragePage() {
  const t = useTranslations("drive");
  const index = useIndex();
  const info = index.info;
  const used = info?.usedBytes ?? 0;
  const quota = info?.quotaBytes ?? 0;
  const stats = index.stats();
  const all = Object.values(stats.byKind).reduce((a, b) => a + b, 0) || 1;
  return (
    <section className="content">
      <div className="phead">
        <div>
          <h1>{t("nav.storage")}</h1>
          <p>{info ? t("storage.sub", { region: t(`region.${info.region}`) }) : ""}</p>
        </div>
      </div>
      <div className="kpis">
        <Kpi label={t("kpi.used")} value={bytes(used)} sub={t("kpi.usedSub", { pct: percent(used, quota), total: bytes(quota) })} />
        <Kpi label={t("kpi.left")} value={bytes(Math.max(0, quota - used))} />
        <Kpi label={t("storage.uploading")} value={bytes(info?.reservedBytes ?? 0)} sub={t("storage.uploadingSub")} />
        <Kpi label={t("kpi.files")} value={stats.files.toLocaleString()} />
        <Kpi label={t("kpi.trash")} value={bytes(stats.byKind.trash)} sub={t("kpi.trashSub", { n: stats.trashItems })} />
      </div>
      <div className="cols c2">
        <div className="panel">
          <div className="ph">
            <div className="grow">
              <b>{t("home.byKind")}</b>
              <span>{t("home.byKindSub", { size: bytes(used) })}</span>
            </div>
          </div>
          {(["media", "documents", "audio", "other", "trash"] as const).map((k) => (
            <div className="krow" key={k}>
              <span>{t(`kind.${k}`)}</span>
              <div className="bar">
                <span style={{ width: `${(stats.byKind[k] * 100) / all}%`, background: KIND_COLORS[k] }} />
              </div>
              <span className="num">{bytes(stats.byKind[k])}</span>
            </div>
          ))}
          <div className="line">
            <div className="t">
              <span>{t("storage.note")}</span>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="ph">
            <div className="grow">
              <b>{t("storage.plans")}</b>
              <span>{t("storage.plansSub")}</span>
            </div>
          </div>
          <div className="line">
            <div className="t">
              <b>{info?.plan === "free" ? t("plan.free", { size: bytes(quota) }) : bytes(quota)}</b>
              <span>{t("storage.current")}</span>
            </div>
            <span className="badge">{t("storage.currentTag")}</span>
          </div>
          {PLANS.map((p) => (
            <div className="line" key={p.size}>
              <div className="t">
                <b>{p.size}</b>
                <span>{t("storage.perYear", { price: p.year })}</span>
              </div>
              <span className="num" style={{ fontWeight: 600 }}>
                {t("storage.perMonth", { price: p.month })}
              </span>
            </div>
          ))}
          <div className="line">
            <div className="t">
              <span>{t("storage.buyInApp")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Security: what BIShare can and cannot see, and this browser's keys. */
export function SecurityPage() {
  const t = useTranslations("drive");
  const { session, lock } = useDrive();
  return (
    <section className="content">
      <div className="phead">
        <div>
          <h1>{t("nav.security")}</h1>
          <p>{t("security.sub")}</p>
        </div>
      </div>
      <div className="cols c2">
        <div className="panel">
          <div className="ph">
            <div>
              <b>{t("security.encryption")}</b>
              <span>{t("security.encryptionSub")}</span>
            </div>
          </div>
          <div className="line">
            <span className="badge green w">{t("security.on")}</span>
            <div className="t">
              <b>{t("security.e2e")}</b>
              <span>{t("security.e2eBody")}</span>
            </div>
          </div>
          <div className="line">
            <span className="badge w">{t("security.hidden")}</span>
            <div className="t">
              <b>{t("security.hiddenWhat")}</b>
              <span>{t("security.hiddenBody")}</span>
            </div>
          </div>
          <div className="line">
            <span className="badge w">{t("security.visible")}</span>
            <div className="t">
              <b>{t("security.visibleWhat")}</b>
              <span>{t("security.visibleBody")}</span>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="ph">
            <div>
              <b>{t("security.browser")}</b>
              <span>{session.name}</span>
            </div>
          </div>
          <div className="line">
            <div className="t">
              <b>{t("signin.stay")}</b>
              <span>{session.stay ? t("security.stayOn") : t("security.stayOff")}</span>
            </div>
            <span className={`badge ${session.stay ? "amber" : "green"}`}>{session.stay ? t("security.on") : t("security.off")}</span>
          </div>
          <div className="line">
            <div className="t">
              <b>{t("lock")}</b>
              <span>{t("security.lockBody")}</span>
            </div>
            <button type="button" className="btn" onClick={() => void lock()}>
              {t("lock")}
            </button>
          </div>
          <div className="line">
            <div className="t">
              <b>{t("security.phrase")}</b>
              <span>{t("security.phraseBody")}</span>
            </div>
            <span className="badge">{t("security.appOnly")}</span>
          </div>
          <div className="line">
            <div className="t">
              <b>{t("security.delete")}</b>
              <span>{t("security.deleteBody")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
