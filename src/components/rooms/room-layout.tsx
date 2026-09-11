"use client";

// The in-room screen, shared by Cloud and Local rooms so the two cannot drift
// apart: the files on the left (the reason the room exists), the code and the
// people on the right. Each mode maps its own state onto these props — the
// relay's WS events for Cloud, the WebRTC mesh for Local.
import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, Cloud, Copy, Download, FileIcon, Radio, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RoomLayoutMember {
  id: string;
  alias: string;
  icon: ReactNode;
  badge?: "host" | "you";
}

export interface RoomLayoutFile {
  id: string;
  name: string;
  size: number;
  byAlias: string;
  /** data: or blob: URL of an image preview, when there is one */
  thumbnailSrc?: string;
  onDownload: () => void;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

export function RoomLayout({
  mode,
  code,
  members,
  membersPlaceholder,
  files,
  filesPlaceholder,
  note,
  uploadPct,
  uploadingBy,
  uploadLabel,
  uploadDisabled = false,
  onFiles,
  leave,
  status,
  error,
}: {
  mode: "cloud" | "local";
  code: string;
  members: RoomLayoutMember[];
  /** shown under the people list while nobody else is there */
  membersPlaceholder?: string;
  files: RoomLayoutFile[];
  filesPlaceholder: string;
  /** one line under the files header (e.g. how Local rooms move bytes) */
  note?: string;
  uploadPct: number | null;
  /** "<alias> · <fileName>" while someone else is sharing */
  uploadingBy: string | null;
  uploadLabel: string;
  uploadDisabled?: boolean;
  onFiles: (files: File[]) => void;
  leave: { label: string; icon: ReactNode; onClick: () => void };
  /** one line under the code — e.g. whether the room is end-to-end encrypted */
  status?: { icon: ReactNode; text: string; tone: "ok" | "warn" | "muted" };
  error: string | null;
}) {
  const t = useTranslations("rooms");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const canPick = uploadPct === null && !uploadDisabled;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  };

  // Copied out first: clearing the input (so the same file can be picked again)
  // empties its FileList in some browsers.
  const pick = (list: FileList | null) => {
    const picked = list ? Array.from(list) : [];
    if (fileInput.current) fileInput.current.value = "";
    if (picked.length > 0) onFiles(picked);
  };

  return (
    <div className="relative flex flex-col lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
      {/* ── left: the files themselves, the reason the room exists ──────── */}
      <section
        onDragOver={(e) => {
          e.preventDefault();
          if (canPick) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (canPick) pick(e.dataTransfer.files);
        }}
        className={
          "relative order-2 flex min-h-[20rem] min-w-0 flex-col p-5 transition sm:p-6 lg:order-1 lg:p-7 " +
          (dragging ? "bg-primary/[0.06]" : "")
        }
      >
        {dragging && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-primary/60"
          />
        )}

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            <FileIcon className="h-3.5 w-3.5" />
            {t("room.files")}
            <span className="tabular-nums">{files.length}</span>
          </p>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => pick(e.target.files)}
          />
          <Button
            onClick={() => fileInput.current?.click()}
            size="sm"
            disabled={!canPick}
            className="rounded-lg"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {uploadPct !== null ? `${t("room.uploading")} ${uploadPct}%` : uploadLabel}
          </Button>
        </div>

        {note && <p className="-mt-2 mb-4 text-xs text-muted-foreground">{note}</p>}

        {uploadPct !== null && (
          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        )}
        {uploadingBy && (
          <p className="mb-3 text-xs text-muted-foreground">
            {t("room.uploadingBy", { who: uploadingBy })}
          </p>
        )}

        {files.length === 0 ? (
          <button
            onClick={() => fileInput.current?.click()}
            disabled={!canPick}
            className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center transition enabled:hover:border-foreground/25 enabled:hover:bg-muted/30"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </span>
            <span className="text-sm text-muted-foreground">{filesPlaceholder}</span>
          </button>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {files.map((f) => (
              <li
                key={f.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card transition duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {f.thumbnailSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.thumbnailSrc}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <FileIcon className="h-6 w-6 text-muted-foreground/70" />
                    </span>
                  )}
                  <Button
                    onClick={f.onDownload}
                    size="icon"
                    aria-label={t("room.download")}
                    className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg opacity-0 shadow-md transition group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[13px] font-medium leading-tight" title={f.name}>
                    {f.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatBytes(f.size)} · {t("room.by", { who: f.byAlias })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p
            className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </section>

      {/* ── right: who and where — the room's identity, always in view ──── */}
      <aside className="relative order-1 flex flex-col gap-6 border-b border-border/60 bg-background-raised/30 p-5 backdrop-blur-sm sm:p-6 lg:order-2 lg:border-b-0 lg:border-l lg:p-7">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("room.codeLabel")}
            </p>
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {mode === "cloud" ? <Cloud className="h-3 w-3" aria-hidden /> : <Radio className="h-3 w-3" aria-hidden />}
              {mode === "cloud" ? t("mode.cloud") : t("local.tag")}
            </span>
          </div>
          <button
            onClick={copyCode}
            title={t("room.copy")}
            className="group mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 transition hover:border-foreground/25 hover:bg-muted/70"
          >
            <span className="font-mono text-[26px] font-semibold leading-none tracking-[0.18em]">
              {code}
            </span>
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
            )}
          </button>
          {status && (
            <p
              className={
                "mt-2 flex items-center gap-1.5 text-xs " +
                (status.tone === "ok"
                  ? "text-success"
                  : status.tone === "warn"
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-muted-foreground")
              }
            >
              {status.icon}
              {status.text}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <p className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {t("room.members")}
            <span className="ml-auto tabular-nums">{members.length}</span>
          </p>
          <ul className="space-y-0.5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {m.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{m.alias}</span>
                {m.badge === "host" && (
                  <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                    {t("room.host")}
                  </span>
                )}
                {m.badge === "you" && (
                  <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {t("room.you")}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {membersPlaceholder && (
            <p className="mt-1 px-1.5 text-sm text-muted-foreground">{membersPlaceholder}</p>
          )}
        </div>

        <Button
          onClick={leave.onClick}
          variant="ghost"
          size="sm"
          className="mt-auto justify-start text-destructive hover:text-destructive"
        >
          {leave.icon}
          {leave.label}
        </Button>
      </aside>
    </div>
  );
}
