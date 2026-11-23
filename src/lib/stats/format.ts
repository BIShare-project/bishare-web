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

