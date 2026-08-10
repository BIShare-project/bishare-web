// Formatting helpers for the admin panel (read-only display). All English —
// internal tool, no i18n. Deterministic UTC output so server-rendered values
// match `wrangler d1 execute` spot-checks (no locale/timezone drift).

const BYTE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;

/** IEC binary bytes (base 1024). Quotas in this app are GiB/TiB. */
export function formatBytes(bytes: number | null | undefined, fractionDigits = 1): string {
  const n = typeof bytes === "number" && Number.isFinite(bytes) ? bytes : 0;
  if (n <= 0) return "0 B";
  const exp = Math.min(Math.floor(Math.log(n) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = n / 1024 ** exp;
  // Whole bytes need no decimals; larger units show up to `fractionDigits`.
  const digits = exp === 0 ? 0 : fractionDigits;
  return `${value.toFixed(digits)} ${BYTE_UNITS[exp]}`;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number | null | undefined): string {
  return numberFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);
}

/** Percentage 0–100 with one decimal; guards divide-by-zero. */
export function formatPercent(part: number, whole: number): string {
  if (!whole || whole <= 0) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

/**
 * ISO-8601 (stored as `2026-01-01T00:00:00.000Z`) → `2026-01-01 00:00 UTC`.
 * Returns "—" for null/empty. Intentionally UTC-literal (slice the ISO string)
 * so the panel is timezone-stable across viewers and matches raw D1 rows.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]} ${m[2]} UTC`;
}

/** Date-only (`2026-01-01`) from an ISO string; "—" when absent. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

/** Coarse relative time ("just now", "3h ago", "5d ago"); "—" when absent. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Short middle-truncation for long opaque ids/keys in dense tables. */
export function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Integer cents → "$1.99" style. Returns "—" for null (e.g. free / contact-sales). */
export function formatCents(
  cents: number | null | undefined,
  currency = "USD"
): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "—";
  const symbol = currency === "USD" ? "$" : "";
  const suffix = symbol ? "" : ` ${currency}`;
  return `${symbol}${(cents / 100).toFixed(2)}${suffix}`;
}

/** Parse a features_json TEXT column into a string[] (never throws). */
export function parseFeatures(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr: unknown = JSON.parse(json);
    return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}
