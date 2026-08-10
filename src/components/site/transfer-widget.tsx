"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FileUpload } from "@/components/file-upload";
import { CodeInput } from "@/components/code-input";
import { getWebNearbyEnabled, getWebQrBeamEnabled } from "@/lib/api";
import { Upload, Download, QrCode, RadioTower } from "lucide-react";

// Nearby pulls in the WebRTC client — lazy-load so it never ships to users who
// don't open the tab (and never runs on the server).
const NearbyPanel = dynamic(
  () => import("@/components/site/nearby-panel").then((m) => m.NearbyPanel),
  { ssr: false },
);
// QR Beam pulls in the camera + QR codec — lazy-load for the same reason.
const QrBeamPanel = dynamic(
  () => import("@/components/site/qr-beam-panel").then((m) => m.QrBeamPanel),
  { ssr: false },
);

type Tab = "send" | "receive" | "nearby" | "beam";

/**
 * The functional send/receive card from the homepage hero:
 * browser upload (get a link) + 6-character code entry, plus an optional
 * Nearby tab (browser-to-browser P2P) gated behind the web_nearby_enabled flag.
 *
 * v2 (Nightglass): shell only reskinned — glass segmented control instead of
 * the underline tab bar. All transfer logic lives untouched in FileUpload /
 * CodeInput. The home hero wraps this in a GradientBorderCard, so the widget
 * itself stays chrome-less.
 */
export function TransferWidget() {
  const [activeTab, setActiveTab] = useState<Tab>("send");
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

  const tabs: { key: Tab; label: string; icon: typeof Upload }[] = [
    { key: "send", label: t("send"), icon: Upload },
    { key: "receive", label: t("receive"), icon: Download },
    ...(nearbyEnabled
      ? [{ key: "nearby" as const, label: tn("tab"), icon: RadioTower }]
      : []),
    ...(beamEnabled ? [{ key: "beam" as const, label: tb("tab"), icon: QrCode }] : []),
  ];

  return (
    <div className="relative overflow-hidden rounded-[inherit]">
      <div className="p-4 pb-0">
        {/* Plain toggle buttons with aria-pressed — not the tabs pattern
            (review #8/#18: role=tab without full keyboard semantics is worse
            than no role). */}
        <div
          role="group"
          aria-label={t("modeAria")}
          className="flex gap-1 rounded-lg border border-border bg-secondary p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold tracking-[-0.01em] transition-colors duration-[180ms] ease-out ${
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {activeTab === tab.key && (
                <motion.span
                  layoutId="transfer-widget-tab"
                  className="absolute inset-0 rounded-md border border-border bg-background shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <tab.icon className="relative h-4 w-4" />
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 md:p-6">
        {activeTab === "send" && <FileUpload />}
        {activeTab === "receive" && (
          <div className="py-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                <QrCode className="h-5 w-5" />
              </div>
              <p className="font-medium">{t("enterCode")}</p>
              <p className="text-sm text-muted-foreground">{t("codeSub")}</p>
            </div>
            <CodeInput />
          </div>
        )}
        {activeTab === "nearby" && nearbyEnabled && <NearbyPanel />}
        {activeTab === "beam" && beamEnabled && <QrBeamPanel />}
      </div>
    </div>
  );
}
