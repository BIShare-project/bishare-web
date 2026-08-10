"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { deleteTransfer } from "@/lib/api";
import { formatExpiry } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TagBadge } from "@/components/site/status-pill";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  FileUp,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  forgetTransfer,
  formatDisplayCode,
  listRememberedTransfers,
  type RememberedTransfer,
} from "./recent-transfers";

interface RowState {
  deleting?: boolean;
  confirmDelete?: boolean;
  error?: string;
  copied?: boolean;
}

/**
 * "Your uploads" — files sent from this browser, remembered in localStorage
 * by the upload widget (review #17: the store was write-only dead code; it
 * now powers this list). Client-only: renders nothing on the server and
 * nothing when the list is empty.
 */
export function YourUploads() {
  const tr = useTranslations("flows");
  const tt = useTranslations("tool");
  const locale = useLocale();
  const expiryLabels = { expired: tt("expired"), lessThanHour: tt("lessThanHour") };
  const [entries, setEntries] = useState<RememberedTransfer[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});

  useEffect(() => {
    setEntries(listRememberedTransfers());
  }, []);

  function patchRow(rawCode: string, updates: RowState) {
    setRows((prev) => ({ ...prev, [rawCode]: { ...prev[rawCode], ...updates } }));
  }

  function copyLink(t: RememberedTransfer) {
    const url = `${window.location.origin}/transfer/${t.rawCode}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    patchRow(t.rawCode, { copied: true });
    setTimeout(() => patchRow(t.rawCode, { copied: false }), 2000);
  }

  async function handleDelete(t: RememberedTransfer) {
    if (!t.deleteToken) return;
    const row = rows[t.rawCode];
    if (!row?.confirmDelete) {
      patchRow(t.rawCode, { confirmDelete: true, error: undefined });
      return;
    }
    patchRow(t.rawCode, { deleting: true });
    const res = await deleteTransfer(t.rawCode, t.deleteToken);
    if (res.success) {
      forgetTransfer(t.rawCode);
      setEntries((prev) => prev.filter((e) => e.rawCode !== t.rawCode));
    } else {
      patchRow(t.rawCode, {
        deleting: false,
        confirmDelete: false,
        error: res.error?.message || tr("uploads.deleteError"),
      });
    }
  }

  if (entries.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold tracking-tight">
          {tr("uploads.heading")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {tr("uploads.fromThisBrowser")}
        </span>
      </div>
      <div className="space-y-2">
        {entries.map((t) => {
          const row = rows[t.rawCode] ?? {};
          return (
            <div key={t.rawCode} className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                  <FileUp className="h-4.5 w-4.5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/transfer/${t.rawCode}`}
                    className="group/name flex min-w-0 items-center gap-1 text-sm font-medium transition-colors hover:text-foreground"
                  >
                    <span className="truncate">{t.fileName}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/name:opacity-100" />
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">
                      {formatDisplayCode(t.rawCode)}
                    </span>
                    {t.expiresAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tr("uploads.timeLeft", {
                          time: formatExpiry(t.expiresAt, locale, expiryLabels),
                        })}
                      </span>
                    )}
                    {t.oneTime && (
                      <TagBadge>{tr("uploads.oneTime")}</TagBadge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={tr("uploads.copyLink", { name: t.fileName })}
                    onClick={() => copyLink(t)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    {row.copied ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  {t.deleteToken && (
                    <button
                      type="button"
                      aria-label={
                        row.confirmDelete
                          ? tr("uploads.confirmDelete", { name: t.fileName })
                          : tr("uploads.delete", { name: t.fileName })
                      }
                      onClick={() => handleDelete(t)}
                      disabled={row.deleting}
                      className={cn(
                        "flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-destructive/80 transition-colors hover:bg-destructive/[0.08] hover:text-destructive disabled:opacity-60",
                        row.confirmDelete && "bg-destructive/[0.08] text-destructive"
                      )}
                    >
                      {row.deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {row.confirmDelete && !row.deleting && (
                        <span className="text-xs font-semibold">
                          {tr("uploads.sure")}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {row.error && (
                <p className="mt-2 pl-13 text-xs text-destructive">{row.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
