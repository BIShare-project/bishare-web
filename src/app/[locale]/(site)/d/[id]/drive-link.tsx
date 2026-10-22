"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Clock, CloudOff, Download, FileX, Hourglass, KeyRound, Loader2, Lock } from "lucide-react";
import { triggerBrowserDownload } from "@/components/download-button";
import { FileTypeTile, fileIconFor } from "@/components/file-icon";
import { FlowStatusCard } from "@/components/flow-shell";
import { FadeUp } from "@/components/site/motion";
import { TagBadge } from "@/components/site/status-pill";
import { DecryptError } from "@/lib/e2e/crypto";
import { formatFileSize } from "@/lib/format";
import type { LinkFile } from "@/lib/vault/crypto";
import { fetchFile, fileUrl, keyFromFragment, LinkError, linkThumbs, openDriveLink, type OpenedLink } from "@/lib/vault/link";
import { buildStoreZip } from "@/lib/zip";
import { ReportAbuse } from "../../transfer/[code]/report-abuse";

/** Files decrypted whole in the page: above this they stream through the site's worker, or the person is asked to reload. */
const IN_PAGE_MAX = 192 * 1024 * 1024;
const FALLBACK_MAX = 1024 * 1024 * 1024;
/** A zip is put together in memory. */
const ZIP_MAX = 1024 * 1024 * 1024;
/** Rows shown before "Show all". */
const FIRST_ROWS = 100;

interface FsWritable {
  write: (data: BufferSource) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => Promise<void>;
}
type ShowSaveFilePicker = (opts?: { suggestedName?: string }) => Promise<{ createWritable: () => Promise<FsWritable> }>;

function savePicker(): ShowSaveFilePicker | null {
  const p = (globalThis as unknown as { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker;
  return typeof p === "function" ? p : null;
}

function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * A large file through the site's service worker (public/sw.js pulls in the
 * stream worker): the browser's own downloader writes it to disk as it is
 * decrypted. Null when the worker does not control this page.
 */
async function streamedSave(url: string, f: LinkFile, onDone: () => void, onError: () => void): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || f.compression) return false;
  const worker = navigator.serviceWorker.controller;
  if (!worker) return false;
  const id = crypto.randomUUID();
  const ch = new MessageChannel();
  const ready = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 10_000);
    ch.port1.onmessage = (e: MessageEvent) => {
      const d = e.data as { type?: string };
      if (d?.type === "ready") {
        clearTimeout(timer);
        resolve(true);
      } else if (d?.type === "done") onDone();
      else if (d?.type === "error") onError();
    };
  });
  const name = f.path.split("/").pop()!;
  worker.postMessage({ type: "download", id, url, key: Array.from(f.fileKey), name, size: f.size }, [ch.port2]);
  if (!(await ready)) return false;
  const probe = await fetch(`/stream/${id}?download=1`, { method: "HEAD" }).catch(() => null);
  if (!probe?.ok) {
    worker.postMessage({ type: "end", id });
    return false;
  }
  triggerBrowserDownload(`/stream/${id}?download=1`);
  return true;
}

type Failure = LinkError["code"];

/** The page for https://get.bishare.app/d/<id>#<key>: what someone shared from their Drive. */
export function DriveLink({ id }: { id: string }) {
  const t = useTranslations("flows");
  const [link, setLink] = useState<OpenedLink | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    const key = keyFromFragment(window.location.hash);
    if (!key) return setFailure("NO_KEY");
    openDriveLink(id, key).then(setLink, (e) => setFailure(e instanceof LinkError ? e.code : "NETWORK"));
  }, [id]);

  if (failure) {
    const card = {
      NO_KEY: { icon: KeyRound, key: "noKey" },
      BAD_KEY: { icon: KeyRound, key: "badKey" },
      NOT_FOUND: { icon: FileX, key: "notFound" },
      EXPIRED: { icon: Hourglass, key: "expired" },
      RATE_LIMITED: { icon: Hourglass, key: "rateLimited" },
      NETWORK: { icon: CloudOff, key: "network" },
      SERVER: { icon: CloudOff, key: "network" },
    }[failure];
    return <FlowStatusCard icon={card.icon} title={t(`driveLink.${card.key}.title`)} message={t(`driveLink.${card.key}.message`)} />;
  }
  if (!link) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("driveLink.loading")}
      </div>
    );
  }
  return (
    <FadeUp>
      <LinkCard link={link} />
      <ReportAbuse code={id} fileName={link.manifest.name} subject={`Drive link: ${id}`} />
    </FadeUp>
  );
}

function LinkCard({ link }: { link: OpenedLink }) {
  const t = useTranslations("flows");
  const locale = useLocale();
  const m = link.manifest;
  const folder = m.kind === "dir";
  const total = m.files.reduce((a, f) => a + f.size, 0);
  const files = useMemo(() => [...m.files].sort((a, b) => a.path.localeCompare(b.path, locale, { numeric: true })), [m.files, locale]);
  const until =
    link.expiresAt === null
      ? t("driveLink.forever")
      : t("driveLink.until", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(link.expiresAt)) });

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <FileTypeTile mimeType={folder ? undefined : files[0]?.mime} folder={folder} />
      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em] break-all">{m.name}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {formatFileSize(total, locale)}
        {folder && <> · {t("driveLink.files", { n: files.length })}</>}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-raised px-3 py-[5px] text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {until}
        </span>
        <TagBadge>{t("driveLink.e2e")}</TagBadge>
      </div>
      <div className="mt-6">
        {folder ? <FolderBody link={link} files={files} total={total} /> : files[0] ? <FileButton link={link} f={files[0]} primary /> : null}
      </div>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        {t("driveLink.note")}
      </p>
    </div>
  );
}

type SaveState = "idle" | "preparing" | "decrypting" | "started" | "error";

/** Saves one file: to disk as it decrypts where the browser allows, else through the worker, else in the page. */
function useSave(link: OpenedLink) {
  const t = useTranslations("flows");
  const [state, setState] = useState<SaveState>("idle");
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");

  async function save(f: LinkFile) {
    setError("");
    const name = f.path.split("/").pop()!;
    const fail = (e: unknown) => {
      setState("error");
      setError(
        e instanceof DecryptError
          ? t("download.errors.decryptFailed")
          : e instanceof LinkError && e.code === "EXPIRED"
            ? t("driveLink.expired.message")
            : e instanceof LinkError && e.code === "RATE_LIMITED"
              ? t("download.errors.rateLimited")
              : e instanceof LinkError && e.code === "NOT_FOUND"
                ? t("driveLink.notFound.message")
                : t("download.errors.network")
      );
    };
    const progress = (done: number) => {
      setState("decrypting");
      setPct(Math.min(100, Math.round((done / Math.max(1, f.size)) * 100)));
    };
    // The save dialog first, inside the click (a later await would lose it).
    const picker = savePicker();
    let writable: FsWritable | undefined;
    if (picker) {
      try {
        writable = await (await picker({ suggestedName: name })).createWritable();
      } catch {
        return; // dismissed
      }
    }
    setState("preparing");
    setPct(0);
    try {
      const url = await fileUrl(link.id, f);
      if (writable) {
        await fetchFile(url, f, progress, (c) => writable!.write(c as unknown as BufferSource));
        await writable.close();
        setState("started");
        return;
      }
      if (f.size > IN_PAGE_MAX && !f.compression) {
        if (await streamedSave(url, f, () => setState("started"), () => fail(new LinkError("NETWORK")))) {
          setState("decrypting");
          return;
        }
        if (f.size > FALLBACK_MAX) {
          setState("error");
          setError(t("driveLink.tooLargeHere"));
          return;
        }
      }
      const parts = (await fetchFile(url, f, progress))!;
      saveBlob(new Blob(parts as BlobPart[], { type: "application/octet-stream" }), name);
      setState("started");
    } catch (e) {
      await writable?.abort?.().catch(() => {});
      fail(e);
    }
  }
  return { state, pct, error, save };
}

function FileButton({ link, f, primary }: { link: OpenedLink; f: LinkFile; primary?: boolean }) {
  const t = useTranslations("flows");
  const { state, pct, error, save } = useSave(link);
  const busy = state === "preparing" || state === "decrypting";
  const label =
    state === "preparing"
      ? t("download.preparing")
      : state === "decrypting"
        ? t("download.decrypting", { pct })
        : state === "started"
          ? t("download.started")
          : t("download.downloadEncrypted");
  if (!primary) {
    return (
      <button
        type="button"
        onClick={() => void save(f)}
        disabled={busy}
        aria-label={`${t("driveLink.download")} ${f.path}`}
        title={error || undefined}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : state === "started" ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-accent-blue" aria-hidden />
        ) : (
          <Download className={state === "error" ? "h-3.5 w-3.5 text-destructive" : "h-3.5 w-3.5"} aria-hidden />
        )}
      </button>
    );
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void save(f)}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
      >
        {busy ? <Loader2 className="animate-spin" /> : state === "started" ? <CheckCircle2 /> : <Lock />}
        {label}
      </button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}

function FolderBody({ link, files, total }: { link: OpenedLink; files: LinkFile[]; total: number }) {
  const t = useTranslations("flows");
  const locale = useLocale();
  const [all, setAll] = useState(false);
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [zip, setZip] = useState<{ done: number } | null>(null);
  const [zipError, setZipError] = useState("");
  const shown = all ? files : files.slice(0, FIRST_ROWS);

  useEffect(() => {
    let live = true;
    let got: Map<string, string> | null = null;
    linkThumbs(link, files.slice(0, FIRST_ROWS)).then(
      (m) => {
        got = m;
        if (live) setThumbs(m);
        else for (const u of m.values()) URL.revokeObjectURL(u);
      },
      () => undefined
    );
    return () => {
      live = false;
      if (got) for (const u of got.values()) URL.revokeObjectURL(u);
    };
  }, [link, files]);

  async function downloadAll() {
    setZipError("");
    setZip({ done: 0 });
    try {
      const out: File[] = [];
      for (const [i, f] of files.entries()) {
        const parts = (await fetchFile(await fileUrl(link.id, f), f))!;
        out.push(new File(parts as BlobPart[], f.path.split("/").pop()!, { type: "application/octet-stream", lastModified: f.mtimeMs }));
        setZip({ done: i + 1 });
      }
      saveBlob(await buildStoreZip(out, undefined, false, files.map((f) => f.path)), `${link.manifest.name}.zip`);
    } catch (e) {
      setZipError(e instanceof DecryptError ? t("download.errors.decryptFailed") : t("download.errors.network"));
    } finally {
      setZip(null);
    }
  }

  if (!files.length) return <p className="text-sm text-muted-foreground">{t("driveLink.empty")}</p>;
  return (
    <div className="space-y-4 text-left">
      {total <= ZIP_MAX ? (
        <button
          type="button"
          onClick={() => void downloadAll()}
          disabled={zip !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
        >
          {zip ? <Loader2 className="animate-spin" /> : <Download />}
          {zip ? t("driveLink.zipping", { done: zip.done, n: files.length }) : t("driveLink.downloadAll")}
        </button>
      ) : (
        <p className="text-center text-xs text-muted-foreground">{t("driveLink.tooLargeZip", { size: formatFileSize(ZIP_MAX, locale) })}</p>
      )}
      {zipError && <p className="text-center text-sm text-destructive">{zipError}</p>}
      <ul className="divide-y divide-border rounded-xl border border-border">
        {shown.map((f) => {
          const cut = f.path.lastIndexOf("/");
          const Icon = fileIconFor(f.mime);
          const thumb = thumbs.get(f.objectId);
          return (
            <li key={f.objectId} className="flex items-center gap-3 px-3 py-2.5">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">
                  {cut > 0 && <span className="text-muted-foreground">{f.path.slice(0, cut + 1)}</span>}
                  {f.path.slice(cut + 1)}
                </span>
                <span className="block text-xs text-muted-foreground">{formatFileSize(f.size, locale)}</span>
              </span>
              <FileButton link={link} f={f} />
            </li>
          );
        })}
      </ul>
      {!all && files.length > FIRST_ROWS && (
        <button type="button" onClick={() => setAll(true)} className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
          {t("driveLink.showAll", { n: files.length })}
        </button>
      )}
    </div>
  );
}
