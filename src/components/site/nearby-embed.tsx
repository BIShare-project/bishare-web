"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { ArrowRight, RadioTower } from "lucide-react";
import { getWebNearbyEnabled } from "@/lib/api";

// The WebRTC client is heavy and browser-only; it loads when someone asks for it.
const NearbyPanel = dynamic(
  () => import("@/components/site/nearby-panel").then((m) => m.NearbyPanel),
  { ssr: false },
);

/**
 * The Nearby tool, embedded in a guide page. People who search "airdrop
 * online" want to move a file now, and every result above us for that query
 * is a working tool, so the page offers the tool itself rather than a link
 * to it.
 *
 * It starts on a click, never on load. Mounting the panel opens the
 * signalling socket and lists this device to everyone else behind the same
 * public address who has it open; a reader skimming an article has not asked
 * for that, and a crawler should not be announcing itself at all. The click
 * also keeps the WebRTC bundle off the page's initial load.
 */
export function NearbyEmbed({
  labels,
}: {
  labels: { start: string; note: string; full: string; off: string };
}) {
  const [started, setStarted] = useState(false);
  // null until the flag is known; the button stays usable meanwhile and the
  // answer only matters once it is pressed.
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    getWebNearbyEnabled()
      .then((on) => alive && setEnabled(on))
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, []);

  if (started && enabled) {
    return (
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-background">
        <NearbyPanel />
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setStarted(true)}
          disabled={enabled === false}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RadioTower className="h-4 w-4" aria-hidden />
          {labels.start}
        </button>
        <Link
          href="/transfer"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-medium transition-colors hover:border-accent-blue"
        >
          {labels.full}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {enabled === false ? labels.off : labels.note}
      </p>
    </div>
  );
}
