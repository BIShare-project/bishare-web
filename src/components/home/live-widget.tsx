"use client";

import dynamic from "next/dynamic";

// Client island: `dynamic(..., { ssr: false })` isn't allowed in a Server
// Component, so the lazy TransferWidget lives here. It pulls the whole upload
// stack (dropzone, QR, config fetch) and sits below the fold, so deferring it
// keeps the (now server-rendered) homepage's initial paint/hydration light.
const TransferWidget = dynamic(
  () => import("@/components/site/transfer-widget").then((m) => m.TransferWidget),
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
  return <TransferWidget />;
}
