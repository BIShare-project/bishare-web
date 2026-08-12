"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FileUpload } from "@/components/file-upload";
import { CodeInput } from "@/components/code-input";
import { getWebNearbyEnabled, getWebQrBeamEnabled } from "@/lib/api";
import { ChevronDown, Download, QrCode, RadioTower, Upload } from "lucide-react";

// Nearby pulls in the WebRTC client and QR Beam the camera + QR codec —
// lazy-load both so they never ship to users who don't expand the card
// (and never run on the server). Mount/unmount on toggle mirrors the old
// tab semantics (collapsing disconnects, exactly like switching tabs did).
const NearbyPanel = dynamic(
  () => import("@/components/site/nearby-panel").then((m) => m.NearbyPanel),
  { ssr: false },
);
const QrBeamPanel = dynamic(
  () => import("@/components/site/qr-beam-panel").then((m) => m.QrBeamPanel),
  { ssr: false },
);

/**
 * The /transfer page's two-column studio layout (Nightglass). Unlike the
 * compact tabbed TransferWidget (which stays as the homepage hero card), the
 * studio shows the two primary actions AT ONCE instead of hiding them behind
 * tabs: Send is the hero on the left, Receive-by-code sits beside it, and the
 * secondary modes (Nearby, QR Beam) are collapsible cards underneath. On
 * mobile everything stacks in the same order. All transfer logic lives
 * untouched in FileUpload / CodeInput / NearbyPanel / QrBeamPanel.
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* Send — the hero card */}
      <section
        aria-label={t("send")}
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <CardHeader icon={<Upload className="h-4 w-4" />} title={t("send")} />
        <div className="p-5 pt-1 md:p-6 md:pt-1">
          <FileUpload />
        </div>
      </section>

      {/* Right rail: receive + secondary modes */}
      <div className="grid gap-5">
        <section
          aria-label={t("receive")}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <CardHeader
            icon={<Download className="h-4 w-4" />}
            title={t("receive")}
          />
          <div className="px-5 pb-6 pt-1 md:px-6">
            <p className="text-sm font-medium">{t("enterCode")}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {t("codeSub")}
            </p>
            <div className="mt-4">
              <CodeInput />
            </div>
          </div>
        </section>

        {nearbyEnabled && (
          <ExpandCard
            icon={<RadioTower className="h-4 w-4" />}
            title={tn("title")}
            subtitle={tn("subtitle")}
          >
            <NearbyPanel />
          </ExpandCard>
        )}
        {beamEnabled && (
          <ExpandCard
            icon={<QrCode className="h-4 w-4" />}
            title={tb("title")}
            subtitle={tb("subtitle")}
          >
            <QrBeamPanel />
          </ExpandCard>
        )}
      </div>
    </div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 pb-3 pt-4 md:px-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground">
        {icon}
      </span>
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
    </div>
  );
}

/** A secondary mode card: header toggles the (lazy-mounted) panel open. */
function ExpandCard({
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
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left transition-colors hover:bg-background-raised md:px-6"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold tracking-[-0.01em]">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
            {subtitle}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className="border-t border-border p-5 md:p-6">{children}</div>}
    </section>
  );
}
