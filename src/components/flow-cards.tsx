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

