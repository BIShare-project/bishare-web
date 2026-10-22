import { Geist, Geist_Mono } from "next/font/google";

// The web Drive's type (the approved look): Geist for text, Geist Mono for
// codes and numbers. Only the Drive's pages load them.
export const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-drive",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-drive-mono",
  display: "swap",
  preload: false,
});
