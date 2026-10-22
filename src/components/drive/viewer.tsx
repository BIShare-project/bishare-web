"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Copy, Download, FolderInput, Loader2, Pencil, Trash2, X } from "lucide-react";
import { fetchPlain, IN_PAGE_MAX, streamMedia } from "@/lib/vault/download";
import { FilePreview, PREVIEW_MAX, previewKindOf, type PreviewKind } from "./previews";
import type { DriveObject } from "@/lib/vault/store";
import { useActions } from "./actions";
import { ObjectIcon } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes, kindOf } from "./format";
import { useThumb } from "./thumbs";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type Shown =
  | { kind: "loading"; done: number; total: number }
  | { kind: "stream"; media: "video" | "audio"; url: string }
  | { kind: "file"; preview: PreviewKind; blob: Blob }
  | { kind: "none"; reason: "type" | "size" | "failed" };

function Icon({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} disabled={disabled}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** A square outlined action next to Download, named by its tooltip. */
function Action({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label={label} onClick={onClick} className={danger ? "text-destructive hover:text-destructive" : undefined}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** A file opened from a list: a sheet at the side, the list still in view behind it. */
export function Viewer({ ids, at, onClose }: { ids: string[]; at: number; onClose: () => void }) {
  const t = useTranslations("drive");
  const locale = useLocale();
  const { client, session, scope } = useDrive();
  const index = useIndex();
  const actions = useActions();
  const [i, setI] = useState(at);
  const [shown, setShown] = useState<Shown>({ kind: "loading", done: 0, total: 0 });
  const list = ids.map((id) => index.get(id)).filter((o): o is DriveObject => !!o && !index.inTrash(o));
  const n = Math.min(i, list.length - 1);
  const o = list[n];
  const thumb = useThumb(client, session.vaultId, o);

  const go = useCallback((step: number) => setI((x) => Math.max(0, Math.min(list.length - 1, x + step))), [list.length]);

  useEffect(() => {
    if (!o) return;
    const ctrl = new AbortController();
    let end: (() => void) | undefined;
    const preview = previewKindOf(o.name, o.mime);
    setShown({ kind: "loading", done: 0, total: o.size ?? 0 });
    void (async () => {
      try {
        if (!preview) return setShown({ kind: "none", reason: "type" });
        const size = o.size ?? 0;
        // Large video and sound play while they download, decrypted by the worker.
        if (size > IN_PAGE_MAX && (preview === "video" || preview === "audio")) {
          const s = await streamMedia(client, o, scope);
          if (!s) return setShown({ kind: "none", reason: "size" });
          end = s.end;
          return setShown({ kind: "stream", media: preview, url: s.src });
        }
        if (size > PREVIEW_MAX[preview]) return setShown({ kind: "none", reason: "size" });
        const blob = await fetchPlain(client, o, (done, total) => setShown({ kind: "loading", done, total }), ctrl.signal);
        if (!ctrl.signal.aborted) setShown({ kind: "file", preview, blob });
      } catch {
        if (!ctrl.signal.aborted) setShown({ kind: "none", reason: "failed" });
      }
    })();
    return () => {
      ctrl.abort();
      end?.();
    };
  }, [o?.id, o?.blobId, client, scope]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.closest("video,audio")) return;
      const rtl = document.documentElement.dir === "rtl";
      if (e.key === "ArrowDown" || e.key === "ArrowRight") go(rtl && e.key === "ArrowRight" ? -1 : 1);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(rtl && e.key === "ArrowLeft" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    if (!o) onClose();
  }, [o, onClose]);
  if (!o) return null;

  const reason = shown.kind === "none" ? shown.reason : "failed";
  const full = (ms: number) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
  const where = ["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ");
  const facts: [string, string][] = [
    [t("col.where"), where],
    [t("col.kind"), `${t(`kinds.${kindOf(o.mime)}`)} · ${o.mime}`],
    [t("col.size"), bytes(o.size)],
    [t("col.modified"), full(o.mtimeMs)],
    [t("files.added"), full(o.createdAt)],
    [t("files.encryption"), t("files.encryptionValue")],
    [t("files.integrity"), t("files.integrityValue")],
  ];

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()} className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[560px]">
        <header className="flex h-14 shrink-0 items-center gap-2.5 border-b px-3">
          <ObjectIcon o={o} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-xs font-semibold">{o.name}</SheetTitle>
            <SheetDescription className="text-3xs text-muted-foreground">
              {bytes(o.size)} · {t("viewer.counter", { i: n + 1, n: list.length })}
            </SheetDescription>
          </div>
          <Icon label={t("act.previous")} onClick={() => go(-1)} disabled={n === 0}>
            <ChevronLeft className="flip-rtl" />
          </Icon>
          <Icon label={t("act.next")} onClick={() => go(1)} disabled={n >= list.length - 1}>
            <ChevronRight className="flip-rtl" />
          </Icon>
          <Icon label={t("act.close")} onClick={onClose}>
            <X />
          </Icon>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="relative grid min-h-64 place-items-center border-b bg-muted/40">
            {shown.kind === "loading" ? (
              <div className="flex w-full flex-col items-center gap-3 p-6 text-2xs text-muted-foreground">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="max-h-72 max-w-full object-contain opacity-60 blur-[2px]" />
                ) : (
                  <Loader2 className="size-6 animate-spin" />
                )}
                <Progress value={shown.total ? (shown.done * 100) / shown.total : 5} className="max-w-56" />
                <span>{t("viewer.opening")}</span>
              </div>
            ) : shown.kind === "stream" ? (
              shown.media === "video" ? (
                <video src={shown.url} controls autoPlay playsInline className="max-h-[62vh] w-full bg-black" />
              ) : (
                <div className="w-full p-8">
                  <audio src={shown.url} controls autoPlay className="w-full" />
                </div>
              )
            ) : shown.kind === "file" ? (
              <FilePreview key={o.id} kind={shown.preview} blob={shown.blob} name={o.name} onDownload={() => void actions.download([o])} />
            ) : (
              <div className="flex max-w-xs flex-col items-center gap-2 p-8 text-center">
                <ObjectIcon o={o} className="size-12 [&_svg]:size-5" />
                <p className="text-xs font-medium">{t(reason === "failed" ? "viewer.failed" : "viewer.noPreview")}</p>
                <p className="text-2xs text-muted-foreground">
                  {t(reason === "size" ? "viewer.tooLarge" : reason === "failed" ? "viewer.failedBody" : "viewer.noPreviewBody", { kind: t(`kinds.${kindOf(o.mime)}`) })}
                </p>
              </div>
            )}
          </div>

          {/* One row in every language: the main action named, the rest as icons with their names on hover. */}
          <div className="flex items-center gap-1.5 border-b p-3">
            <Button className="min-w-0 flex-1" onClick={() => void actions.download([o])}>
              <Download /> <span className="truncate">{t("act.download")}</span>
            </Button>
            <Action label={t("act.rename")} onClick={() => void actions.rename(o)}>
              <Pencil />
            </Action>
            <Action label={t("act.move")} onClick={() => void actions.move([o.id])}>
              <FolderInput />
            </Action>
            <Action label={t("act.copy")} onClick={() => void actions.copy([o.id])}>
              <Copy />
            </Action>
            <Action label={t("act.trash")} danger onClick={() => void actions.trash([o.id])}>
              <Trash2 />
            </Action>
          </div>

          <dl className="m-0 grid grid-cols-[110px_1fr] text-2xs">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="border-b px-4 py-2.5 text-muted-foreground">{k}</dt>
                <dd className="m-0 truncate border-b py-2.5 pe-4" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  );
}
