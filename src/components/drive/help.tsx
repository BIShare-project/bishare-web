"use client";

// Plain-language help, the way the midcos console does it: a small ⓘ next to
// a label (InfoTip), a glossary word with a dotted underline (Term), and a row
// of numbered steps that says how a page works (ExplainGrid). Every
// definition comes from the "glossary" strings, so each screen explains a
// word the same way.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export type GlossaryId = "e2e" | "key" | "device" | "browser" | "stay" | "trash" | "linked" | "region" | "thumbnail" | "plan" | "phrase" | "quota";

/** A small ⓘ that explains the thing next to it; clicks never reach the parent. */
export function InfoTip({ children, className }: { children: ReactNode; className?: string }) {
  const t = useTranslations("drive");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={t("help.more")}
          onClick={(e) => e.stopPropagation()}
          className={cn("inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring", className)}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-2xs leading-relaxed font-normal normal-case tracking-normal">{children}</TooltipContent>
    </Tooltip>
  );
}

/** A glossary word: dotted underline, its plain-language definition on hover or focus. */
export function Term({ id, children, className }: { id: GlossaryId; children?: ReactNode; className?: string }) {
  const t = useTranslations("drive");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn("cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
        >
          {children ?? t(`glossary.${id}.term`)}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-2xs leading-relaxed">
        <span>
          <span className="font-semibold">{t(`glossary.${id}.term`)}.</span> {t(`glossary.${id}.definition`)}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

/** Numbered steps that say how a page works, on shared 1 px lines. */
export function ExplainGrid({ items }: { items: { icon: LucideIcon; title: string; text: ReactNode }[] }) {
  return (
    <div className={cn("grid gap-px overflow-hidden border bg-border", items.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
      {items.map((it, i) => (
        <div key={it.title} className="flex gap-3 bg-card p-4">
          <span className="grid size-8 shrink-0 place-items-center border bg-blau-soft text-blau">
            <it.icon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium">
              <span className="me-1 text-muted-foreground tabular-nums">{i + 1}.</span>
              {it.title}
            </div>
            <p className="mt-0.5 text-2xs leading-relaxed text-muted-foreground">{it.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
