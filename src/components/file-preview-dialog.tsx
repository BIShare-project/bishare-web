"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileIcon, X } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { previewKind } from "@/lib/preview-kind";

/**
 * Tap a picked file, see what it is — a modal over the whole panel.
 *
 * It renders the LOCAL File the browser already holds, through an object URL:
 * nothing is uploaded, decrypted, or fetched to show it. That also makes it an
 * honest rehearsal of the recipient's side, because it uses the same
 * `previewKind` rules — a file this dialog can't render is a file their browser
 * won't render either.
 *
 * Types the browser can't open still get a dialog rather than nothing: name,
 * size and type are the useful answer to "did I pick the right one?".
 */
export function FilePreviewDialog({ file, onClose }: { file: File; onClose: () => void }) {
  const t = useTranslations("tool");
  const locale = useLocale();
  const [url, setUrl] = useState<string | null>(null);
  const kind = previewKind(file.type || "");

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Escape closes — this one is safe to dismiss casually, unlike the incoming
  // transfer prompt where a stray key would decline someone's send.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("upload.previewAlt", { name: file.name })}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size, locale)}
              {file.type ? ` · ${file.type}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("upload.closePreview")}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex max-h-[70vh] items-center justify-center overflow-auto bg-background-raised/40 p-4">
          {url && kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={t("upload.previewAlt", { name: file.name })}
              className="max-h-[62vh] w-auto rounded-lg"
            />
          )}
          {url && kind === "video" && (
            <video src={url} controls autoPlay playsInline className="max-h-[62vh] w-full rounded-lg bg-black" />
          )}
          {url && kind === "audio" && <audio src={url} controls autoPlay className="w-full" />}
          {url && kind === "pdf" && (
            <object data={url} type="application/pdf" className="h-[62vh] w-full rounded-lg" />
          )}
          {!kind && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue">
                <FileIcon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="text-sm text-muted-foreground">{t("upload.noPreview")}</p>
            </div>
          )}
        </div>

        <p className="border-t border-border px-4 py-2.5 text-center text-[11px] text-muted-foreground">
          {t("upload.previewNote")}
        </p>
      </div>
    </div>
  );
}
