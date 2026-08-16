"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { previewKind } from "@/lib/preview-kind";

/**
 * "See what they'll see" — the sender's side of preview.
 *
 * It renders the LOCAL File the browser still holds from the upload, never a
 * round trip: the sender already has these bytes, so re-downloading and
 * re-decrypting their own file would spend bandwidth to learn nothing. An
 * object URL is instant and free.
 *
 * Its real job isn't "what is this file" — the sender knows that. It answers
 * "will the person I'm sending this to actually be able to open it?", which is
 * why it shares `previewKind` with the recipient's player: same rules, same
 * browser, same verdict. A file that shows nothing here will show nothing
 * there either, and the sender finds out before sending rather than after.
 */
export function SenderPreview({ file }: { file: File }) {
  const t = useTranslations("tool");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const kind = previewKind(file.type || "");

  useEffect(() => {
    if (!open) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      setUrl(null);
    };
  }, [open, file]);

  if (!kind) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {open ? t("upload.hidePreview") : t("upload.showPreview")}
      </button>

      {open && url && (
        <div className="mt-2.5">
          {kind === "video" && (
            <video src={url} controls playsInline className="w-full rounded-lg bg-black" />
          )}
          {kind === "audio" && <audio src={url} controls className="w-full" />}
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={t("upload.previewAlt", { name: file.name })}
              className="mx-auto max-h-72 w-auto rounded-lg border border-border"
            />
          )}
          {kind === "pdf" && (
            <object
              data={url}
              type="application/pdf"
              className="h-72 w-full rounded-lg border border-border"
            />
          )}
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            {t("upload.previewNote")}
          </p>
        </div>
      )}
    </div>
  );
}
