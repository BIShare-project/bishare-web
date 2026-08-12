"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FileUpload } from "@/components/file-upload";
import { CodeInput } from "@/components/code-input";
import { getWebNearbyEnabled, getWebQrBeamEnabled } from "@/lib/api";
import { ChevronDown, Download, QrCode, RadioTower } from "lucide-react";

// Nearby pulls in the WebRTC client and QR Beam the camera + QR codec —
// lazy-load both so they never ship to users who don't expand the row
// (and never run on the server). Collapsing unmounts, exactly like the old
// tab semantics.
const NearbyPanel = dynamic(
  () => import("@/components/site/nearby-panel").then((m) => m.NearbyPanel),
  { ssr: false },
);
const QrBeamPanel = dynamic(
  () => import("@/components/site/qr-beam-panel").then((m) => m.QrBeamPanel),
  { ssr: false },
);

/**
 * The /transfer page's unified studio panel (Geist-minimal): ONE surface,
 * split like WeTransfer — the drop zone owns the left half at full height,
 * the right rail stacks Receive-by-code and the secondary modes (Nearby,
 * QR Beam) as expandable rows. On mobile the halves stack in the same order.
 * All transfer logic lives untouched in FileUpload / CodeInput / panels; the
 * compact tabbed TransferWidget remains the homepage hero card.
 */
export function TransferStudio() {
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [beamEnabled, setBeamEnabled] = useState(false);
  const t = useTranslations("tool");
  const tn = useTranslations("nearby");
  const tb = useTranslations("beam");

  useEffect(() => {
    let alive = true;
    getWebNearbyEnabled().then((on) => {
      if (alive) setNearbyEnabled(on);
    });
    getWebQrBeamEnabled().then((on) => {
      if (alive) setBeamEnabled(on);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
      {/* Send — the drop zone owns the whole left half */}
      <section
        aria-label={t("send")}
        className="flex flex-col justify-center p-3 sm:p-5 md:p-7 lg:min-h-[480px] lg:p-8"
      >
        <FileUpload />
      </section>

      {/* Right rail — receive + secondary modes on one shared surface */}
      <div className="flex flex-col border-t border-border bg-background-raised/40 lg:border-l lg:border-t-0">
        <section aria-label={t("receive")} className="p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
              <Download className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                {t("enterCode")}
              </h2>
              <p className="text-[12.5px] text-muted-foreground">
                {t("codeSub")}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <CodeInput />
          </div>
        </section>

        {nearbyEnabled && (
          <ModeRow
            icon={<RadioTower className="h-4 w-4" />}
            title={tn("title")}
            subtitle={tn("subtitle")}
          >
            <NearbyPanel />
          </ModeRow>
        )}
        {beamEnabled && (
          <ModeRow
            icon={<QrCode className="h-4 w-4" />}
            title={tb("title")}
            subtitle={tb("subtitle")}
          >
            <QrBeamPanel />
          </ModeRow>
        )}
      </div>
    </div>
  );
}

/** A secondary transfer mode as an expandable row on the right rail. */
function ModeRow({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-4 text-left transition-colors hover:bg-secondary/60 sm:px-5 md:px-6"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold tracking-[-0.01em]">
            {title}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
            {subtitle}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-border bg-card p-4 sm:p-5 md:p-6">{children}</div>
      )}
    </div>
  );
}
