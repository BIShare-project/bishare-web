import type { IconComponent } from "@/ui/icons";

export interface FeatureCardProps {
  icon: IconComponent;
  title: string;
  desc: string;
  /** Grid position for the stagger. */
  index?: number;
  className?: string;
}

/**
 * Feature grid card v2 (Nightglass): gradient-border glass surface with a
 * cursor-tracked spotlight and a glowing blue icon tile. Accents are
 * brand-blue ONLY (2-hue rule §1.3) — the old per-feature rainbow props
 * are gone by design.
 */
export function FeatureCard({
  icon: Icon,
  title,
  desc,
  index = 0,
  className,
}: FeatureCardProps) {
  return (
    <div className={className}>
      <div className="h-full rounded-xl border border-border bg-card p-6 transition-colors duration-300 hover:border-border-strong">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mb-1.5 font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
