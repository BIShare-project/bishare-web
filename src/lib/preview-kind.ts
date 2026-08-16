/**
 * What a browser can open directly from raw bytes.
 *
 * One definition, used by BOTH sides of a transfer: the recipient's decrypting
 * player and the sender's local check. That shared answer is the point — the
 * sender's preview is only meaningful as a promise about what the recipient
 * will get, so the two must never disagree about what counts as previewable.
 */
export type PreviewKind = "video" | "audio" | "image" | "pdf";

export function previewKind(mime: string): PreviewKind | null {
  const m = mime.toLowerCase();
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  // HEIC/HEIF come straight off iPhones and most browsers cannot decode them —
  // a preview that renders broken is worse than no preview at all.
  if (m.startsWith("image/") && !/hei[cf]/.test(m)) return "image";
  if (m === "application/pdf") return "pdf";
  return null;
}
