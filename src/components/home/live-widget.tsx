"use client";

import dynamic from "next/dynamic";

// Client island: `dynamic(..., { ssr: false })` isn't allowed in a Server
// Component, so the lazy studio lives here. It pulls the whole upload stack
// (dropzone, QR, config fetch) and sits below the fold, so deferring it keeps
// the (server-rendered) homepage's initial paint and hydration light.
//
// This is the SAME component /transfer uses, deliberately: the homepage
// promises "send a real file, right here", and landing on the real thing —
// route selector, thumbnail grid, preview — beats a simplified stand-in that
// behaves differently from the page it is advertising.
const TransferStudio = dynamic(
  () => import("@/components/site/transfer-studio").then((m) => m.TransferStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent-blue" />
      </div>
    ),
  },
);

export function LiveWidget() {
  return <TransferStudio />;
}
