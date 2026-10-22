"use client";

import { Archive, File, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, Folder, Presentation } from "lucide-react";
import type { DriveObject } from "@/lib/vault/store";
import { useDrive } from "./drive-app";
import { kindOf } from "./format";
import { useThumb } from "./thumbs";

const ICONS = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  slides: Presentation,
  archive: Archive,
  text: FileText,
  file: File,
} as const;

export function ObjectIcon({ o }: { o: DriveObject }) {
  const Icon = o.kind === "dir" ? Folder : ICONS[kindOf(o.mime)];
  return (
    <span className="ico">
      <Icon className="ic" />
    </span>
  );
}

/** The thumbnail when the file has one, else its icon. */
export function ObjectThumb({ o, className = "thumb" }: { o: DriveObject; className?: string }) {
  const { client, session } = useDrive();
  const url = useThumb(client, session.vaultId, o);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img className={className} src={url} alt="" /> : <ObjectIcon o={o} />;
}

export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="l">{label}</div>
      <div className="v num">{value}</div>
      {sub ? <div className="d">{sub}</div> : null}
    </div>
  );
}

export const KIND_COLORS: Record<string, string> = {
  media: "var(--media)",
  documents: "var(--docs)",
  audio: "var(--audio)",
  other: "var(--other)",
  trash: "var(--trash)",
};
