import type { LucideIcon } from "lucide-react";
import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FolderClosed,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Lucide icon for a MIME type (replaces the old emoji mapping). */
export function fileIconFor(mimeType?: string): LucideIcon {
  if (!mimeType) return File;
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("zip") || mime.includes("archive") || mime.includes("compress")) return FileArchive;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return FileSpreadsheet;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return Presentation;
  if (mime.includes("word") || mime.includes("document")) return FileText;
  if (mime.includes("json") || mime.includes("xml") || mime.includes("javascript")) return FileCode;
  if (mime.startsWith("text/")) return FileText;
  return File;
}

interface FileTypeTileProps {
  mimeType?: string;
  /** Renders a folder icon regardless of MIME. */
  folder?: boolean;
  className?: string;
}

/** Rounded icon tile for file previews (mirrors the app's file-type tiles). */
export function FileTypeTile({ mimeType, folder = false, className }: FileTypeTileProps) {
  const Icon = folder ? FolderClosed : fileIconFor(mimeType);
  return (
    <div
      className={cn(
        "mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-primary/10 text-primary",
        className
      )}
    >
      <Icon className="h-7 w-7" strokeWidth={1.8} />
    </div>
  );
}
