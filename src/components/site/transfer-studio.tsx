"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FileUpload } from "@/components/file-upload";
import { CodeInput } from "@/components/code-input";
import { getWebNearbyEnabled, getWebQrBeamEnabled } from "@/lib/api";
import { Download, Link2, QrCode, RadioTower } from "lucide-react";

// Nearby pulls in the WebRTC client and QR Beam the camera + QR codec —
// lazy-load both so they never ship to users who don't pick that mode (and
// never run on the server). Switching modes unmounts the previous panel.
const NearbyPanel = dynamic(
  () => import("@/components/site/nearby-panel").then((m) => m.NearbyPanel),
  { ssr: false },
);
const QrBeamPanel = dynamic(
  () => import("@/components/site/qr-beam-panel").then((m) => m.QrBeamPanel),
  { ssr: false },
);

type Mode = "link" | "nearby" | "beam";

/**
 * The /transfer page's studio panel.
 *
 * The previous layout gave the whole left half to the drop zone and buried
 * Nearby as a collapsed row in the right rail, so visitors never learned the
 * local path existed at all. Now the ROUTE is the first choice on the page:
 * a segmented control names each way of sending, and the line under it states
 * the trade every time, so the difference lands without a click.
 *
 * A selector beats showing both paths side by side here, because Nearby only
 * has anything to show when another device is on the same Wi-Fi — the common
 * first visit has none, and half a page of "no devices found" would be the
 * worst use of the best space. As a tab it still advertises itself, and the
 * panel can explain how to get a device to appear.
 *
 * Receiving stays outside the selector: it's the counterpart action, not a
 * fourth way to send, so a code can be pasted whichever mode is showing.
 */
export function TransferStudio() {
  const [mode, setMode] = useState<Mode>("link");
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

  // A disabled flag must never strand the user on a hidden panel.
  useEffect(() => {
    if (mode === "nearby" && !nearbyEnabled) setMode("link");
    if (mode === "beam" && !beamEnabled) setMode("link");
  }, [mode, nearbyEnabled, beamEnabled]);

  const modes: {
    key: Mode;
    label: string;
    hint: string;
    icon: typeof Link2;
  }[] = [
    {
      key: "link",
      label: t("studio.linkTab"),
      hint: t("studio.linkSub"),
      icon: Link2,
    },
    ...(nearbyEnabled
      ? [
          {
            key: "nearby" as const,
            label: tn("tab"),
            hint: t("studio.localSub"),
            icon: RadioTower,
          },
        ]
      : []),
    ...(beamEnabled
      ? [
          {
            key: "beam" as const,
            label: tb("tab"),
            hint: t("studio.beamSub"),
            icon: QrCode,
          },
        ]
      : []),
  ];
  const active = modes.find((m) => m.key === mode) ?? modes[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4 sm:p-5 md:p-6">
        {/* The teaching line, kept next to the control rather than up in the
            hero — this is where the choice is actually made. */}
        <p className="mb-3.5 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
          {t("studio.intro")}
        </p>

        {/* Plain toggle buttons with aria-pressed, matching TransferWidget —
            role=tab without full keyboard semantics is worse than no role. */}
        <div
          role="group"
          aria-label={t("modeAria")}
          className="flex gap-1 rounded-xl border border-border bg-secondary p-1"
        >
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={mode === m.key}
              onClick={() => setMode(m.key)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold tracking-[-0.01em] transition-colors duration-[180ms] ease-out ${
                mode === m.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {mode === m.key && (
                <motion.span
                  layoutId="transfer-studio-mode"
                  className="absolute inset-0 rounded-lg border border-border bg-background shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <m.icon className="relative h-4 w-4 shrink-0" />
              <span className="relative">{m.label}</span>
            </button>
          ))}
        </div>

        {/* States the TRADE for the selected route, deliberately not the
            panel's own description — repeating that put the same sentence on
            screen twice. This line is what makes a selector as informative as
            two side-by-side panels. */}
        {active && (
          <p
            aria-live="polite"
            className="mt-3 text-[12.5px] leading-snug text-muted-foreground"
          >
            {active.hint}
          </p>
        )}
      </div>

      <section
        aria-label={active?.label ?? t("send")}
        className="p-3 sm:p-5 md:p-7 lg:min-h-[420px] lg:p-8"
      >
        {mode === "link" && <FileUpload />}
        {mode === "nearby" && nearbyEnabled && <NearbyPanel />}
        {mode === "beam" && beamEnabled && <QrBeamPanel />}
      </section>

      {/* Receiving is always reachable, whichever send route is showing. */}
      <section
        aria-label={t("receive")}
        className="border-t border-border bg-background-raised/40 p-4 sm:p-5 md:p-6"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
            <Download className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              {t("enterCode")}
            </h2>
            <p className="text-[12.5px] text-muted-foreground">{t("codeSub")}</p>
          </div>
        </div>
        <div className="mt-5 sm:max-w-md">
          <CodeInput />
        </div>
      </section>
    </div>
  );
}
