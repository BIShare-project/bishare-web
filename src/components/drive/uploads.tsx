"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, CloudUpload, Link2, RotateCw, X } from "lucide-react";
import type { UploadItem } from "@/lib/vault/upload";
import { cn } from "@/lib/utils";
import { useDrive, useIndex, useUploads } from "./drive-app";
import { bytes } from "./format";
import { InfoTip } from "./help";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

function statusOf(t: ReturnType<typeof useTranslations>, it: UploadItem): string {
  const pct = it.total ? Math.floor((it.done * 100) / it.total) : 0;
  switch (it.state) {
    case "queued":
      return t("uploads.queued");
    case "preparing":
      return t("uploads.preparing", { pct });
    case "sending":
      return t("uploads.sending", { pct, size: bytes(it.size) });
    case "finishing":
      return t("uploads.finishing");
    case "done":
      return it.linked ? t("uploads.linked") : t("uploads.done", { size: bytes(it.size) });
    case "canceled":
      return t("uploads.canceled");
    case "failed":
      return t(`errors.${it.error === "STORAGE_LIMIT_EXCEEDED" || it.error === "VAULT_READ_ONLY" || it.error === "NETWORK" ? it.error : "upload"}`);
  }
}

/** Uploads in progress, bottom corner; stays until closed once everything is done. */
export function UploadTray() {
  const t = useTranslations("drive");
  const uploader = useUploads();
  const [open, setOpen] = useState(true);
  const items = uploader.items;
  if (!items.length) return null;
  const active = items.filter((i) => i.state === "queued" || i.state === "preparing" || i.state === "sending" || i.state === "finishing");
  const failed = items.filter((i) => i.state === "failed").length;
  const total = items.reduce((a, i) => a + (i.state === "canceled" ? 0 : i.size), 0) || 1;
  const done = items.reduce((a, i) => a + (i.state === "done" ? i.size : i.state === "sending" || i.state === "finishing" ? (i.done / (i.total || 1)) * i.size : 0), 0);
  const title = active.length ? t("uploads.title", { n: active.length }) : failed ? t("uploads.someFailed", { n: failed }) : t("uploads.allDone", { n: items.filter((i) => i.state === "done").length });

  return (
    <div className="fixed end-4 bottom-4 z-40 w-[min(380px,calc(100vw-32px))] border bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/5 animate-in slide-in-from-bottom-4 fade-in-0">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        {active.length ? <CloudUpload className="size-4 text-blau" /> : failed ? <X className="size-4 text-destructive" /> : <Check className="size-4 text-good" />}
        <span className="flex-1 truncate text-xs font-medium">{title}</span>
        <Button variant="ghost" size="icon-sm" aria-label={t("uploads.minimize")} onClick={() => setOpen((v) => !v)}>
          <ChevronDown className={cn("transition-transform", !open && "rotate-180")} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={active.length ? t("uploads.cancelAll") : t("act.close")}
          onClick={() => (active.length ? uploader.cancelAll() : uploader.clearFinished())}
        >
          <X />
        </Button>
      </div>
      {active.length ? <Progress value={(done * 100) / total} className="h-0.5" /> : null}
      {open ? (
        <ul className="max-h-72 overflow-y-auto">
          {items.map((it) => (
            <li key={it.id} className="group flex items-center gap-3 border-b px-3 py-2 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-2xs font-medium">{it.name}</div>
                <div className={cn("flex items-center gap-1 truncate text-3xs text-muted-foreground", it.state === "failed" && "text-destructive")}>
                  {it.linked ? <Link2 className="size-3" /> : null}
                  {statusOf(t, it)}
                  {it.linked ? <InfoTip>{t("glossary.linked.definition")}</InfoTip> : null}
                </div>
                {it.state === "preparing" || it.state === "sending" ? <Progress value={it.total ? (it.done * 100) / it.total : 0} className="mt-1.5" /> : null}
              </div>
              {it.state === "failed" ? (
                <Button variant="ghost" size="icon-xs" aria-label={t("act.retry")} onClick={() => uploader.retry(it.id)}>
                  <RotateCw />
                </Button>
              ) : null}
              {it.state === "done" ? <Check className="size-4 text-good" /> : null}
              {it.state === "queued" || it.state === "preparing" || it.state === "sending" ? (
                <Button variant="ghost" size="icon-xs" aria-label={t("act.cancel")} className="opacity-60 group-hover:opacity-100" onClick={() => uploader.cancel(it.id)}>
                  <X />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type Entry = { file: File; path: string[] };

/** Files and folders out of a drop, folders walked through. */
async function dropped(dt: DataTransfer): Promise<{ loose: File[]; tree: Entry[] }> {
  const loose: File[] = [];
  const tree: Entry[] = [];
  const entries = [...dt.items].map((i) => (i.kind === "file" ? i.webkitGetAsEntry?.() : null)).filter(Boolean) as FileSystemEntry[];
  if (!entries.length) return { loose: [...dt.files], tree };
  const readAll = (dir: FileSystemDirectoryEntry) =>
    new Promise<FileSystemEntry[]>((resolve) => {
      const reader = dir.createReader();
      const out: FileSystemEntry[] = [];
      const next = () =>
        reader.readEntries((batch) => {
          if (!batch.length) return resolve(out);
          out.push(...batch);
          next();
        }, () => resolve(out));
      next();
    });
  const walk = async (e: FileSystemEntry, path: string[]) => {
    if (e.isFile) {
      const file = await new Promise<File | null>((r) => (e as FileSystemFileEntry).file(r, () => r(null)));
      if (file) (path.length ? tree.push({ file, path }) : loose.push(file));
    } else if (e.isDirectory) {
      for (const c of await readAll(e as FileSystemDirectoryEntry)) await walk(c, [...path, e.name]);
    }
  };
  for (const e of entries) await walk(e, []);
  return { loose, tree };
}

/** Drop files or folders anywhere on the Drive: they go to the folder open in Files, else the top. */
export function DropZone() {
  const t = useTranslations("drive");
  const { uploader, toast } = useDrive();
  const index = useIndex();
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current++;
      setOver(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setOver(false);
    };
    const overFn = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e) || !e.dataTransfer) return;
      e.preventDefault();
      depth.current = 0;
      setOver(false);
      const params = new URLSearchParams(location.search);
      const f = location.pathname.endsWith("/files") ? params.get("f") : null;
      const parent = f && index.get(f) ? f : null;
      const { loose, tree } = await dropped(e.dataTransfer);
      if (loose.length) uploader.add(loose, parent);
      if (tree.length) await uploader.addTree(tree, parent);
      if (!loose.length && !tree.length) toast(t("errors.dropEmpty"), { tone: "error" });
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", overFn);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", overFn);
      window.removeEventListener("drop", drop);
    };
  }, [index, uploader, toast, t]);

  if (!over) return null;
  const params = typeof location !== "undefined" ? new URLSearchParams(location.search) : null;
  const f = params && location.pathname.endsWith("/files") ? params.get("f") : null;
  const where = f ? (index.get(f)?.name ?? "Drive") : "Drive";
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-blau/10 p-6 backdrop-blur-[2px] animate-in fade-in-0">
      <div className="flex flex-col items-center gap-3 border-2 border-dashed border-blau bg-background/95 px-12 py-10 text-center shadow-2xl">
        <span className="grid size-12 place-items-center bg-blau text-white">
          <CloudUpload className="size-6" />
        </span>
        <p className="text-sm font-semibold">{t("uploads.dropTitle", { where })}</p>
        <p className="text-2xs text-muted-foreground">{t("uploads.dropBody")}</p>
      </div>
    </div>
  );
}
