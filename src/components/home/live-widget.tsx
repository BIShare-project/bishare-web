"island";

import dynamic from "@/ui/lazy";

// The lazy studio pulls the whole upload stack (dropzone, QR, config fetch), so it waits for the page's first paint.
//
// This is the SAME component /transfer uses, deliberately: the homepage
// promises "send a real file, right here", and landing on the real thing —
// route selector, thumbnail grid, preview — beats a simplified stand-in that
// behaves differently from the page it is advertising.
const TransferStudio = dynamic(
  () => import("@/ui/transfer-studio").then((m) => m.TransferStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-border border-t-accent-blue" />
      </div>
    ),
  },
);

export function LiveWidget() {
  return <TransferStudio />;
}
