"use client";

import { useTranslations } from "next-intl";
import { FeatureCard } from "@/components/site/feature-card";
import {
  Languages,
  MonitorSmartphone,
  QrCode,
  Inbox,
  KeyRound,
  EyeOff,
  ShieldCheck,
  Trash2,
  ScanLine,
} from "lucide-react";

/**
 * Client wrapper for the secondary feature grid: FeatureCard is a client
 * component, so the Lucide icon components must be referenced inside the
 * client boundary (a server page cannot pass component functions as props).
 * FeatureCard renders the monochrome Geist icon tile — no per-feature color.
 *
 * Icons stay in code; titles/descriptions come from the "features" namespace
 * (t.raw("more.items")). Order must match the icon list below.
 */
const MORE_ICONS = [
  Languages,
  MonitorSmartphone,
  QrCode,
  Inbox,
  KeyRound,
  EyeOff,
  ShieldCheck,
  Trash2,
  ScanLine, // QR Beam — screen-to-camera, no network
];

interface MoreFeatureText {
  title: string;
  desc: string;
}

export function MoreFeaturesGrid() {
  const t = useTranslations("features");
  const items = t.raw("more.items") as MoreFeatureText[];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((feature, i) => (
        <FeatureCard
          key={i}
          index={i}
          icon={MORE_ICONS[i]}
          title={feature.title}
          desc={feature.desc}
        />
      ))}
    </div>
  );
}
