"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { DriveObject } from "@/lib/vault/store";
import { ObjectThumb } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes, isMedia, kindOf, when } from "./format";

type KindFilter = "all" | "dir" | "media" | "documents" | "audio" | "other";

function matchesKind(o: DriveObject, k: KindFilter): boolean {
  if (k === "all") return true;
  if (k === "dir") return o.kind === "dir";
  if (o.kind === "dir") return false;
  const kind = kindOf(o.mime);
  if (k === "media") return isMedia(o.mime);
  if (k === "audio") return kind === "audio";
  if (k === "documents") return ["pdf", "doc", "sheet", "slides", "text"].includes(kind);
  return !isMedia(o.mime) && !["pdf", "doc", "sheet", "slides", "text", "audio"].includes(kind);
}

/** Files: a folder of the Drive (?f=), or the search results (?q=). */
export function FilesPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const { base } = useDrive();
  const index = useIndex();
  const params = useSearchParams();
  const router = useRouter();
  const folder = params.get("f") || null;
  const q = params.get("q") ?? "";
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<"name" | "modified" | "size">("name");
  const [selected, setSelected] = useState<string | null>(null);
  const words = { today: t("today"), yesterday: t("yesterday") };

  const here = folder ? index.get(folder) : undefined;
  const path = index.pathTo(folder);
  // Rebuilt on every render: the index object stays the same while its
  // contents change, so a memo keyed on it would keep the first (empty) list.
  const rows = (q ? index.search(q, 500) : index.children(folder))
    .filter((o) => matchesKind(o, kind))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      if (sort === "modified") return b.mtimeMs - a.mtimeMs;
      if (sort === "size") return (b.size ?? 0) - (a.size ?? 0);
      return a.name.localeCompare(b.name, locale, { numeric: true, sensitivity: "base" });
    });
  const quick = folder || q ? [] : index.children(null).filter((o) => o.kind === "dir").sort((a, b) => index.countUnder(b.id) - index.countUnder(a.id)).slice(0, 5);
  const pick = selected ? index.get(selected) : rows.find((o) => o.kind === "file");
  const total = rows.reduce((a, o) => a + (o.size ?? 0), 0);
  const open = (o: DriveObject) => (o.kind === "dir" ? router.push(`${base}/files?f=${o.id}`) : setSelected(o.id));

  return (
    <section className="content">
      <div className="phead">
        <div>
          <div className="crumbs">
            <Link href={`${base}/files`}>Drive</Link>
            {path.map((p) => (
              <span key={p.id} className="row" style={{ gap: 6 }}>
                /<Link href={`${base}/files?f=${p.id}`}>{p.name}</Link>
              </span>
            ))}
          </div>
          <h1 style={{ marginTop: 4 }}>{q ? t("files.results", { q }) : (here?.name ?? t("files.title"))}</h1>
        </div>
      </div>

      {quick.length ? (
        <div className="qa">
          {quick.map((d) => (
            <Link key={d.id} href={`${base}/files?f=${d.id}`}>
              <ObjectThumb o={d} />
              <span style={{ minWidth: 0 }}>
                <b>{d.name}</b>
                <span>{t("items", { n: index.countUnder(d.id) })}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="fwrap">
        <div>
          <div className="filters">
            <select className="btn" value={kind} onChange={(e) => setKind(e.target.value as KindFilter)} aria-label={t("files.kind")}>
              {(["all", "dir", "media", "documents", "audio", "other"] as const).map((k) => (
                <option key={k} value={k}>
                  {t(`files.kinds.${k}`)}
                </option>
              ))}
            </select>
            <select className="btn" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={t("files.sort")}>
              {(["name", "modified", "size"] as const).map((k) => (
                <option key={k} value={k}>
                  {t(`files.sorts.${k}`)}
                </option>
              ))}
            </select>
            <span className="grow" />
            <span className="mute" style={{ fontSize: 12.5 }}>
              {t("files.summary", { n: rows.length, size: bytes(total) })}
            </span>
          </div>
          <div className="panel scroll">
            {rows.length === 0 ? (
              <div className="empty">
                <b>{q ? t("empty.search") : t("empty.folder")}</b>
                {q ? t("empty.searchBody") : t("empty.folderBody")}
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t("col.name")}</th>
                    <th className="r">{t("col.size")}</th>
                    <th>{t("col.modified")}</th>
                    <th>{t("col.kind")}</th>
                    {q ? <th>{t("col.where")}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className={pick?.id === o.id ? "sel" : ""} onClick={() => setSelected(o.id)} onDoubleClick={() => open(o)}>
                      <td>
                        <div className="nm">
                          <ObjectThumb o={o} />
                          {o.kind === "dir" ? (
                            <Link className="t" href={`${base}/files?f=${o.id}`}>
                              {o.name}
                            </Link>
                          ) : (
                            <span className="t">{o.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="r num">{o.kind === "dir" ? <span className="mute">{t("items", { n: index.countUnder(o.id) })}</span> : bytes(o.size)}</td>
                      <td>{when(o.mtimeMs, locale, words)}</td>
                      <td className="mute">{o.kind === "dir" ? t("kinds.dir") : t(`kinds.${kindOf(o.mime)}`)}</td>
                      {q ? <td className="mute">{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mute" style={{ fontSize: 12, margin: "10px 0 0" }}>
            {t("files.privacy")}
          </p>
        </div>
        {pick ? <Details o={pick} /> : null}
      </div>
    </section>
  );
}

function Details({ o }: { o: DriveObject }) {
  const t = useTranslations("drive");
  const locale = useLocale();
  const index = useIndex();
  const full = (ms: number) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
  return (
    <aside className="panel detail" aria-label={t("files.details")}>
      <div className="pv">
        <ObjectThumb o={o} className="" />
      </div>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
        <b style={{ fontSize: 14, wordBreak: "break-word" }}>{o.name}</b>
        <div className="mute" style={{ fontSize: 12 }}>
          {o.kind === "dir" ? t("kinds.dir") : `${bytes(o.size)} · ${o.mime}`}
        </div>
      </div>
      <dl className="dl">
        <dt>{t("col.where")}</dt>
        <dd>{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</dd>
        <dt>{t("col.modified")}</dt>
        <dd>{full(o.mtimeMs)}</dd>
        <dt>{t("files.added")}</dt>
        <dd>{full(o.createdAt)}</dd>
        {o.kind === "file" ? (
          <>
            <dt>{t("files.encryption")}</dt>
            <dd>{t("files.encryptionValue")}</dd>
            <dt>{t("files.integrity")}</dt>
            <dd>{t("files.integrityValue")}</dd>
            {o.compression ? (
              <>
                <dt>{t("files.stored")}</dt>
                <dd>{t("files.compressed", { size: bytes(o.blobSize) })}</dd>
              </>
            ) : null}
          </>
        ) : (
          <>
            <dt>{t("files.contains")}</dt>
            <dd>{t("items", { n: index.countUnder(o.id) })}</dd>
          </>
        )}
      </dl>
    </aside>
  );
}

/** Recent: files added or changed anywhere, newest first. */
export function RecentPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const index = useIndex();
  const [filter, setFilter] = useState<KindFilter>("all");
  const words = { today: t("today"), yesterday: t("yesterday") };
  const rows = index
    .live()
    .filter((o) => o.kind === "file" && matchesKind(o, filter))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 200);
  return (
    <section className="content">
      <div className="phead">
        <div>
          <h1>{t("nav.recent")}</h1>
          <p>{t("recent.sub")}</p>
        </div>
        <span className="grow" />
        <div className="seg" role="group">
          {(["all", "documents", "media", "audio"] as const).map((k) => (
            <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
              {t(`files.kinds.${k}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="panel scroll">
        {rows.length === 0 ? (
          <div className="empty">
            <b>{t("empty.files")}</b>
            {t("empty.filesBody")}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>{t("col.name")}</th>
                <th>{t("col.where")}</th>
                <th className="r">{t("col.size")}</th>
                <th>{t("col.modified")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="nm">
                      <ObjectThumb o={o} />
                      <span className="t">{o.name}</span>
                    </div>
                  </td>
                  <td className="mute">{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</td>
                  <td className="r num">{bytes(o.size)}</td>
                  <td>{when(o.mtimeMs, locale, words)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
