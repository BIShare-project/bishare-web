import { Geist } from "next/font/google";

// The web Drive's type (the approved look): Geist for text. Codes and numbers
// use the system's monospace (drive.css): Geist Mono v6 on Google Fonts breaks
// Turbopack's font loader in Next 16.3 (build: "next/font/google queries have
// exactly one entry"). Only the Drive's pages load it.
export const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-drive",
  display: "swap",
});
