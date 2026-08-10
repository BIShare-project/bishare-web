import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { GlassCard } from "@/components/site/glass-card";
import { FadeUp } from "@/components/site/motion";
import { cn } from "@/lib/utils";

/**
 * Shared layout for the functional deep-link pages (/transfer, /share,
 * /request) — Geist: sticky header + a centered column over the faint
 * hairline grid.
 */
export function FlowShell({
  children,
  maxWidthClassName = "max-w-md",
}: {
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-6 py-14 md:py-20">
        <div className="geist-grid pointer-events-none absolute inset-0 -z-10" />
        <div className={cn("w-full", maxWidthClassName)}>{children}</div>
      </main>
    </div>
  );
}

type StatusTone = "muted" | "primary" | "success";

const TONE_CLASSES: Record<StatusTone, string> = {
  muted: "border border-border bg-background-raised text-muted-foreground",
  primary: "border border-border bg-background-raised text-accent-blue",
  success: "border border-border bg-background-raised text-success",
};

/**
 * Centered status card for terminal flow states (not found, expired,
 * already downloaded, closed, full). Optional children render below the
 * message — e.g. a recovery action.
 */
export function FlowStatusCard({
  icon: Icon,
  title,
  message,
  tone = "muted",
  children,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  tone?: StatusTone;
  children?: ReactNode;
}) {
  return (
    <FadeUp>
      <GlassCard className="p-8 text-center">
        <div
          className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-[18px]",
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        {children && <div className="mt-6">{children}</div>}
      </GlassCard>
    </FadeUp>
  );
}

/**
 * Glow progress bar (Nightglass flow treatment): brand-gradient fill with a
 * colored halo on a muted track. Server-safe; drives itself purely off the
 * `value` prop (0–100).
 */
export function GlowProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-border",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-accent-blue"
        style={{
          width: `${clamped}%`,
          transition: "width 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}

/**
 * Success checkmark that draws itself on (confetti-free success moment):
 * gradient-stroked circle + tick using the `.demo-check-*` draw-on keyframes.
 * Reduced motion renders it fully drawn (the base classes' static pose).
 * Server-safe — stable gradient id, no hooks.
 */
export function SuccessCheck({
  size = 72,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={className}
    >
      <circle
        cx="48"
        cy="48"
        r="42"
        stroke="var(--accent-blue)"
        strokeWidth="3"
        strokeLinecap="round"
        className="demo-check-circle"
        style={{ "--draw": 264 } as CSSProperties}
      />
      <path
        d="M31 50l12 12 22-26"
        stroke="var(--accent-blue)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="demo-check-mark"
        style={{ "--draw": 52 } as CSSProperties}
      />
    </svg>
  );
}

/** Pulsing placeholder card used by the route loading skeletons. */
export function FlowSkeletonCard({ rows = 2 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="animate-pulse space-y-5">
        <div className="mx-auto h-16 w-16 rounded-[18px] bg-muted" />
        <div className="mx-auto h-5 w-3/5 rounded-md bg-muted" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="mx-auto h-4 w-2/5 rounded-md bg-muted" />
        ))}
        <div className="h-[52px] w-full rounded-[13px] bg-muted" />
      </div>
    </div>
  );
}
