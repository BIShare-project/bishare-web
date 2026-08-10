"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { EASE_OUT, staggerDelay } from "@/lib/motion";

export interface FeatureCardProps {
  icon: LucideIcon;
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
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: staggerDelay(index) }}
      className={className}
    >
      <div className="h-full rounded-xl border border-border bg-card p-6 transition-colors duration-300 hover:border-border-strong">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mb-1.5 font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </motion.div>
  );
}
