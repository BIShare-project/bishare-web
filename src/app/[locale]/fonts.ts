import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

/**
 * Shared font instances for the marketing surface. Declared here (imported by
 * BOTH the <html>-owning [locale]/layout AND (site)/layout) so next/font can
 * emit the <link rel="preload"> into <head> — which only happens when the font
 * is applied in the layout that renders <html>/<body>. A single instance means
 * one font load, no duplicates.
 */
export const plexSans = IBM_Plex_Sans({
  // `subsets` only decides what is PRELOADED; every subset keeps its
  // @font-face and loads on demand through unicode-range. Preloading Cyrillic
  // put 25 KB on the critical path of every page for the one Russian locale.
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono-plex",
  display: "swap",
  // Mono only sets small labels (eyebrows, fact lines); swapping it in after
  // first paint costs nothing, preloading it cost 20 KB before the first paint.
  preload: false,
});
