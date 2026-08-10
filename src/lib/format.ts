/**
 * Human file size. Unit symbols (B/KB/MB/GB/TB) are locale-neutral, but the
 * number is formatted for `locale` so the decimal separator matches the page
 * ("1.5 MB" en / "1,5 MB" de/id). Omit `locale` on English-only surfaces
 * (Web Drive) to keep the runtime default.
 */
export function formatFileSize(bytes: number, locale?: string): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  const num =
    i === 0
      ? String(Math.round(val))
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(val);
  return `${num} ${units[i]}`;
}

export function getFileIcon(mimeType: string): string {
  if (!mimeType) return "📄";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📕";
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compress")) return "📦";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📽️";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.startsWith("text/")) return "📄";
  return "📄";
}

/** Localized edge labels for {@link formatExpiry}. */
export interface ExpiryLabels {
  expired: string;
  lessThanHour: string;
}

/**
 * Coarse remaining time until `dateStr` ("3 hours", "2 days"). The count+unit
 * is formatted for `locale` via Intl (so "2 heures"/"2時間"), and the two edge
 * cases (already expired / under an hour) come from `labels`. Both are optional
 * — English-only surfaces (Web Drive) can call with just the date.
 */
export function formatExpiry(dateStr: string, locale?: string, labels?: ExpiryLabels): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return labels?.expired ?? "Expired";

  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return labels?.lessThanHour ?? "Less than 1 hour";
  if (hours < 24)
    return new Intl.NumberFormat(locale, { style: "unit", unit: "hour", unitDisplay: "long" }).format(hours);
  const days = Math.floor(hours / 24);
  return new Intl.NumberFormat(locale, { style: "unit", unit: "day", unitDisplay: "long" }).format(days);
}

/**
 * Coarse relative time for the Web Drive ("just now", "3h ago", "5d ago",
 * "2mo ago"). Returns "—" for null/empty and echoes an unparseable input.
 */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  if (diffMs < 60000) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
