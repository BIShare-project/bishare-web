"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getRequestUploadURL, isBlockedFileType } from "@/lib/api";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/site/ui/button";
import { Input } from "@/components/site/ui/input";
import { GlowProgress, SuccessCheck } from "@/components/flow-shell";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Info,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";

interface FileEntry {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
  /** Failed client-side validation — never uploaded, doesn't consume a slot. */
  invalid?: boolean;
  /** Upload failed — can be retried. */
  retryable?: boolean;
}

interface UploadZoneProps {
  code: string;
  maxFileSize: number;
  allowedTypes: string | null;
  /** Server-side slots still open (max_files - upload_count), null = unlimited. */
  remainingSlots: number | null;
  requesterAlias?: string;
}

let entryIdCounter = 0;

/**
 * Stall watchdog window (review #14/#24): abort only when no bytes move for
 * this long, instead of a fixed overall timeout that killed slow-but-alive
 * uploads.
 */
const UPLOAD_STALL_TIMEOUT_MS = 60_000;

/**
 * TODO(backend): flip to true once api.bishare.app CORS allows the
 * X-Uploader-Alias request header — sending it today fails the browser
 * preflight and errors the whole upload. The name input is hidden behind the
 * same flag so nobody types a name that silently goes nowhere.
 */
const SEND_UPLOADER_ALIAS = false;

/**
 * X-Uploader-Alias must be a valid HTTP header value: strip diacritics to
 * ASCII where possible and drop anything else, so non-Latin names don't make
 * xhr.setRequestHeader throw (the backend stores the header verbatim).
 */
function sanitizeAlias(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^ -~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function UploadZone({
  code,
  maxFileSize,
  allowedTypes,
  remainingSlots,
  requesterAlias,
}: UploadZoneProps) {
  const t = useTranslations("flows.uploader");
  const locale = useLocale();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [notice, setNotice] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  /** Files delivered in previous batches after "Send more". */
  const [sentEarlier, setSentEarlier] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const uploadingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFileById = useCallback((id: string, updates: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  function validateFile(file: File): string | null {
    if (isBlockedFileType(file.name)) {
      return t("invalidType");
    }
    if (file.size > maxFileSize) {
      return t("tooLarge", { size: formatFileSize(maxFileSize, locale) });
    }
    if (file.size <= 0) {
      return t("empty");
    }
    if (allowedTypes) {
      const allowed = allowedTypes.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const mimeMatch = allowed.some((a) => file.type.toLowerCase().includes(a));
      const extMatch = allowed.some((a) => a === ext);
      if (!mimeMatch && !extMatch) {
        return t("notAcceptedType", { types: allowedTypes });
      }
    }
    return null;
  }

  // Slots already promised to files in this session (valid ones only).
  const consumingCount = files.filter((f) => !f.invalid).length;
  const effectiveRemaining =
    remainingSlots == null ? null : Math.max(0, remainingSlots - sentEarlier);
  const openSlots =
    effectiveRemaining == null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, effectiveRemaining - consumingCount);

  function handleFiles(fileList: FileList) {
    const incoming = Array.from(fileList);
    const additions: FileEntry[] = [];
    // Open slots at drop time (review #7): already-queued files are subtracted
    // via openSlots, so the notice can't overstate what's actually left.
    const slotsAtDrop = openSlots;
    let addedValid = 0;
    let skipped = 0;

    for (const file of incoming) {
      const error = validateFile(file);
      if (error) {
        additions.push({
          id: `entry-${++entryIdCounter}`,
          file,
          progress: 0,
          status: "error",
          errorMsg: error,
          invalid: true,
        });
        continue;
      }
      if (addedValid >= openSlots) {
        skipped += 1;
        continue;
      }
      additions.push({
        id: `entry-${++entryIdCounter}`,
        file,
        progress: 0,
        status: "pending",
      });
      addedValid += 1;
    }

    setFiles((prev) => [...prev, ...additions]);
    if (skipped > 0) {
      const total = Number.isFinite(slotsAtDrop) ? slotsAtDrop : 0;
      setNotice(t("slotsNotice", { total, skipped }));
    } else {
      setNotice("");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function openPicker() {
    fileInputRef.current?.click();
  }

  function removeFile(id: string) {
    if (isUploading) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const uploadAll = useCallback(async () => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setIsUploading(true);

    const uploadURL = getRequestUploadURL(code);
    const alias = sanitizeAlias(uploaderName);
    const snapshot = [...files];

    for (const entry of snapshot) {
      if (entry.status !== "pending") continue;

      updateFileById(entry.id, { status: "uploading" });

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          let stalled = false;
          let stallTimer: ReturnType<typeof setTimeout> | undefined;
          const armStallTimer = () => {
            clearTimeout(stallTimer);
            stallTimer = setTimeout(() => {
              stalled = true;
              xhr.abort();
            }, UPLOAD_STALL_TIMEOUT_MS);
          };

          xhr.open("POST", uploadURL);
          xhr.setRequestHeader("X-File-Name", encodeURIComponent(entry.file.name));
          xhr.setRequestHeader("X-File-Type", entry.file.type || "application/octet-stream");
          if (SEND_UPLOADER_ALIAS && alias) {
            xhr.setRequestHeader("X-Uploader-Alias", alias);
          }

          xhr.upload.onprogress = (e) => {
            armStallTimer();
            if (e.lengthComputable) {
              updateFileById(entry.id, { progress: Math.round((e.loaded / e.total) * 100) });
            }
          };
          // Response-phase liveness (headers/body arriving) also re-arms.
          xhr.onreadystatechange = () => armStallTimer();

          xhr.onload = () => {
            clearTimeout(stallTimer);
            if (xhr.status === 200) {
              resolve();
            } else {
              try {
                const res = JSON.parse(xhr.responseText);
                reject(new Error(res.error?.message || t("uploadFailedStatus", { status: xhr.status })));
              } catch {
                reject(new Error(t("uploadFailedStatus", { status: xhr.status })));
              }
            }
          };
          xhr.onerror = () => {
            clearTimeout(stallTimer);
            reject(new Error(t("networkError")));
          };
          xhr.onabort = () => {
            clearTimeout(stallTimer);
            reject(new Error(stalled ? t("stalled") : t("canceled")));
          };

          armStallTimer();
          xhr.send(entry.file);
        });

        updateFileById(entry.id, { status: "done", progress: 100 });
      } catch (err) {
        updateFileById(entry.id, {
          status: "error",
          retryable: true,
          errorMsg: err instanceof Error ? err.message : t("uploadFailed"),
        });
      }
    }

    uploadingRef.current = false;
    setIsUploading(false);
  }, [code, files, updateFileById, uploaderName, t]);

  // Retry flow: reset failed entries to pending, then re-run in the effect
  // so uploadAll sees the committed state.
  useEffect(() => {
    if (retryTick > 0) void uploadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTick]);

  function retryFailed() {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error" && f.retryable
          ? { ...f, status: "pending", errorMsg: undefined, retryable: false, progress: 0 }
          : f
      )
    );
    setRetryTick((t) => t + 1);
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const failedUploads = files.filter((f) => f.status === "error" && f.retryable);
  const showSuccess =
    doneCount > 0 && pendingCount === 0 && !isUploading && failedUploads.length === 0;
  const canAddMore = openSlots > 0;

  // ── Success view ──
  if (showSuccess) {
    const remainingAfter =
      effectiveRemaining == null ? null : Math.max(0, effectiveRemaining - doneCount);
    return (
      <div className="mt-6 py-4 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <SuccessCheck size={76} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">{t("sentTitle")}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {requesterAlias
            ? t("sentBodyTo", { count: doneCount, recipient: requesterAlias })
            : t("sentBody", { count: doneCount })}
        </p>
        {remainingAfter === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">{t("nowFull")}</p>
        ) : (
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => {
              setSentEarlier((n) => n + doneCount);
              setFiles([]);
              setNotice("");
            }}
          >
            <Upload />
            {t("sendMore")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {canAddMore && !isUploading && (
        <div
          role="button"
          tabIndex={0}
          aria-label={t("dropzoneAria")}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          className={cn(
            "gradient-border-glass relative block w-full cursor-pointer overflow-hidden rounded-[20px] p-8 text-center outline-none",
            "transition-shadow duration-300 focus-visible:ring-3 focus-visible:ring-ring/50",
            dragActive
              ? "shadow-[var(--glow-card-hover)]"
              : "hover:shadow-[var(--glow-card)]"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div aria-hidden className="grid-dots pointer-events-none absolute inset-0" />
          <div className="relative">
            <div
              className={cn(
                "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary shadow-[0_0_24px_-6px_rgba(59,130,246,0.55)] transition-transform duration-300",
                dragActive && "scale-110"
              )}
            >
              <FileUp className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <p className="text-sm text-foreground">
              {dragActive ? (
                <span className="font-semibold">{t("dropActive")}</span>
              ) : (
                t.rich("dropCta", {
                  b: (chunks) => (
                    <span className="font-semibold text-primary">{chunks}</span>
                  ),
                })
              )}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("perFile", { size: formatFileSize(maxFileSize, locale) })}
              {allowedTypes && <> · {t("accepted", { types: allowedTypes })}</>}
              {effectiveRemaining != null && (
                <> · {t("slotsLeft", { count: openSlots })}</>
              )}
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div className="glass flex items-start gap-2 rounded-2xl border px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-primary" />
          {notice}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className={cn(
                "gradient-border-glass flex items-center gap-3 rounded-2xl p-3.5 text-sm",
                f.status === "uploading" && "shadow-[var(--glow-card)]"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(f.file.size, locale)}</p>
                {f.status === "uploading" && <GlowProgress value={f.progress} className="mt-2" />}
                {f.status === "error" && (
                  <p className="mt-1 text-xs text-destructive">{f.errorMsg}</p>
                )}
              </div>
              <div className="shrink-0">
                {f.status === "done" && <CheckCircle2 className="h-5 w-5 text-success" />}
                {f.status === "uploading" && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                {(f.status === "pending" || f.status === "error") && !isUploading && (
                  <button
                    type="button"
                    aria-label={t("removeAria", { name: f.file.name })}
                    onClick={() => removeFile(f.id)}
                  >
                    <XCircle
                      className={
                        f.status === "error"
                          ? "h-5 w-5 text-destructive"
                          : "h-5 w-5 text-muted-foreground transition-colors hover:text-destructive"
                      }
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {failedUploads.length > 0 && !isUploading && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/[0.04] px-3.5 py-2.5 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          <span className="flex-1 text-muted-foreground">
            {t("failedCount", { count: failedUploads.length })}
          </span>
          <button
            type="button"
            onClick={retryFailed}
            className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <RotateCcw className="h-3 w-3" />
            {t("retry")}
          </button>
        </div>
      )}

      {pendingCount > 0 && !isUploading && (
        <>
          {SEND_UPLOADER_ALIAS && (
            <Input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder={t("yourName")}
              aria-label={t("yourName")}
              maxLength={120}
              className="h-11 rounded-2xl"
            />
          )}
          <Button onClick={uploadAll} className="w-full" size="lg">
            <Upload />
            {t("uploadButton", { count: pendingCount })}
          </Button>
        </>
      )}
    </div>
  );
}
