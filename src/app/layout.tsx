import type { Metadata } from "next";

// Passthrough root. It intentionally does NOT render <html>/<body>: the
// site's document root is src/app/[locale]/layout.tsx, so <html lang dir> can
// vary per locale.
export const metadata: Metadata = {
  title: "BIShare",
  description: "Fast, private file sharing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
