// Numbers and dates as the Drive shows them (the app's drive_format.dart).

// A value with its unit, kept in one left-to-right piece inside Arabic text
// (first-strong isolate), where "21.7 MB" would otherwise read "MB 21.7".
const iso = (s: string) => `\u2068${s}\u2069`;

/** Decimal units, as the quota counts them (1 GB = 1,000,000,000 bytes). */
export function bytes(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v < 1000) return iso(`${v} B`);
  const units = ["KB", "MB", "GB", "TB"];
  let x = v / 1000;
  let i = 0;
  while (x >= 1000 && i < units.length - 1) {
    x /= 1000;
    i++;
  }
  return iso(`${x >= 100 ? Math.round(x) : x.toFixed(x >= 10 ? 1 : 2).replace(/\.?0+$/, "")} ${units[i]}`);
}

export function percent(part: number, whole: number): string {
  if (whole <= 0) return iso("0%");
  const p = (part * 100) / whole;
  return iso(p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`);
}

/** "Today, 06:12", "Yesterday, 21:40", or "21 Oct 2026". */
export function when(ms: number, locale: string, words: { today: string; yesterday: string }): string {
  const d = new Date(ms);
  const now = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(d);
  if (diff === 0) return `${words.today}, ${time}`;
  if (diff === 1) return `${words.yesterday}, ${time}`;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function dayTitle(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(ms));
}

export function kindOf(mime: string | undefined): "image" | "video" | "audio" | "pdf" | "doc" | "sheet" | "slides" | "archive" | "text" | "file" {
  const m = mime ?? "";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (/spreadsheet|excel|csv/.test(m)) return "sheet";
  if (/presentation|powerpoint/.test(m)) return "slides";
  if (/word|opendocument\.text|rtf/.test(m)) return "doc";
  if (/zip|rar|7z|tar|gzip/.test(m)) return "archive";
  if (m.startsWith("text/") || /json|xml/.test(m)) return "text";
  return "file";
}

export function isMedia(mime: string | undefined): boolean {
  return !!mime && (mime.startsWith("image/") || mime.startsWith("video/"));
}
