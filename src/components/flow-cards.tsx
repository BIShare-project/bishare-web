import type { Child } from "@/jsx";
import { Card } from "@/ui/card";
import type { IconComponent } from "@/ui/icons";
import { cn } from "@/lib/utils";

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
  icon: IconComponent;
  title: string;
  message: string;
  tone?: StatusTone;
  children?: Child;
}) {
  return (
    <div>
      <Card className="p-8 text-center">
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
      </Card>
    </div>
  );
}

/** Pulsing placeholder card used by the route loading skeletons. */
export function FlowSkeletonCard({ rows = 2 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="space-y-5">
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
