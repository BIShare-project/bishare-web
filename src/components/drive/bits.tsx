"use client";

import { useEffect, useState, type ReactNode, type Ref } from "react";
import { Archive, File, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, Folder, Presentation, type LucideIcon } from "lucide-react";
import type { DriveObject } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { useDrive } from "./drive-app";
import { InfoTip } from "./help";
import { kindOf } from "./format";
import { useNear, useThumb } from "./thumbs";

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

const TINTS: Record<string, string> = {
  dir: "text-blau",
  image: "text-media",
  video: "text-media",
  audio: "text-audio",
  pdf: "text-bad",
  doc: "text-docs",
  sheet: "text-good",
  slides: "text-docs",
};

export function iconFor(o: DriveObject): LucideIcon {
  return o.kind === "dir" ? Folder : ICONS[kindOf(o.mime)];
}

export function ObjectIcon({ o, className, ref }: { o: DriveObject; className?: string; ref?: Ref<HTMLSpanElement> }) {
  const Icon = iconFor(o);
  const kind = o.kind === "dir" ? "dir" : kindOf(o.mime);
  return (
    <span ref={ref} className={cn("grid size-7 shrink-0 place-items-center border bg-muted/60", className)}>
      <Icon className={cn("size-4", TINTS[kind] ?? "text-muted-foreground")} strokeWidth={1.7} />
    </span>
  );
}

/**
 * A long list drawn [step] items at a time (audit W7: a Drive of 20–30k
 * photos): the first [limit] items, and a [mark] to put below them that adds
 * more as it nears the screen.
 */
export function useStepped(count: number, step = 300): { limit: number; mark: ReactNode } {
  const [limit, setLimit] = useState(step);
  const [end, setEnd] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!end || limit >= count || typeof IntersectionObserver === "undefined") return;
    const seen = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setLimit((n) => n + step), { rootMargin: "1200px 0px" });
    seen.observe(end);
    return () => seen.disconnect();
  }, [end, limit, count, step]);
  return { limit, mark: limit < count ? <div ref={setEnd} className="h-px" aria-hidden /> : null };
}

/** The thumbnail when the file has one, else its icon. The thumbnail is asked for once the tile nears the screen. */
export function ObjectThumb({ o, className, large }: { o: DriveObject; className?: string; large?: boolean }) {
  const { client, session } = useDrive();
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [attempt, setAttempt] = useState(0);
  const url = useThumb(client, session.vaultId, o, useNear(el), attempt);
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={cn(large ? "size-full object-cover" : "size-7 shrink-0 border object-cover", className)}
        src={url}
        alt=""
        draggable={false}
        onError={() => setAttempt((n) => (n < 2 ? n + 1 : n))}
      />
    );
  }
  if (large) {
    const Icon = iconFor(o);
    const kind = o.kind === "dir" ? "dir" : kindOf(o.mime);
    return (
      <span ref={setEl} className={cn("grid size-full place-items-center bg-muted/50", className)}>
        <Icon className={cn("size-9", TINTS[kind] ?? "text-muted-foreground")} strokeWidth={1.3} />
      </span>
    );
  }
  return <ObjectIcon o={o} className={className} ref={setEl} />;
}

/** A bordered section: title, optional description and actions, then content (the admin's Panel). */
export function Panel({
  title,
  description,
  actions,
  help,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** What this panel shows and how it is counted, as an ⓘ next to the title. */
  help?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col border bg-card", className)}>
      {(title || actions) && (
        <header className="flex min-h-12 items-center gap-3 border-b px-4 py-2">
          <div className="flex min-w-0 flex-col">
            {title && (
              <h2 className="flex items-center gap-1.5 truncate text-xs font-semibold">
                {title}
                {help ? <InfoTip>{help}</InfoTip> : null}
              </h2>
            )}
            {description && <p className="truncate text-2xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="ms-auto flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/** A grid of figures on shared 1 px lines. */
export function KpiGrid({ children, cols = 5 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden border bg-border",
        cols === 5 && "lg:grid-cols-5",
        cols === 4 && "lg:grid-cols-4",
        cols === 3 && "sm:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}

export function Kpi({ label, value, sub, icon: Icon, tone, help }: { label: string; value: string; sub?: string; icon?: LucideIcon; tone?: "warn" | "bad"; help?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        <span className="truncate">{label}</span>
        {help ? <InfoTip>{help}</InfoTip> : null}
      </div>
      <div className={cn("truncate text-xl font-semibold tracking-tight tabular-nums", tone === "warn" && "text-warn", tone === "bad" && "text-bad")}>{value}</div>
      {sub ? <div className="truncate text-3xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      {Icon ? (
        <span className="mb-1 grid size-10 place-items-center border bg-muted/50">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </span>
      ) : null}
      <p className="text-xs font-medium">{title}</p>
      {description ? <p className="max-w-sm text-2xs text-muted-foreground">{description}</p> : null}
      {action}
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

export function PageHead({ title, sub, actions, crumbs }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; crumbs?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-0">
        {crumbs}
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {sub ? <p className="mt-0.5 text-2xs text-muted-foreground">{sub}</p> : null}
      </div>
      {actions ? <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
