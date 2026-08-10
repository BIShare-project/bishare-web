import type { Metadata } from "next";

// Passthrough root. It intentionally does NOT render <html>/<body>: the three
// surfaces own their own document root so each can set the right attributes —
//   • marketing  → src/app/[locale]/layout.tsx  (<html lang dir> per locale)
//   • admin      → src/app/admin/layout.tsx      (<html class="dark">)
//   • Web Drive  → src/app/app/layout.tsx        (<html class="dark">)
// This "multiple root layouts" split is what lets the marketing surface carry
// a per-locale lang/dir while admin/app stay single-<html>, untouched.
export const metadata: Metadata = {
  title: "BIShare",
  description: "Fast, private file sharing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
