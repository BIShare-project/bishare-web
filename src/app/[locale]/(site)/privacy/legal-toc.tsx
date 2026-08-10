"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  label: string;
}

/**
 * Desktop TOC rail for the legal pages (shared by /privacy and /terms):
 * a hairline rail with a single blue marker that tracks the section currently
 * in view (cheap scroll-position scrollspy, rAF-gated).
 */
export function LegalToc({ items }: { items: TocItem[] }) {
  const t = useTranslations("legal");
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // Anchored sections land ~112px below the viewport top (scroll-mt-28),
      // so a 160px probe line marks the section being read.
      const probe = window.scrollY + 160;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.offsetTop <= probe) current = section.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav aria-label="Table of contents" className="sticky top-24">
      <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue" aria-hidden />
        {t("shared.onThisPage")}
      </p>
      <ul className="relative">
        {/* Hairline rail */}
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 w-px bg-border"
        />
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} className="relative">
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "block py-[7px] pr-2 pl-4 text-[13px] leading-snug transition-[color,transform] duration-200",
                  isActive
                    ? "translate-x-0.5 font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Marker riding the rail */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 left-[-1px] h-5 w-[2px] -translate-y-1/2 rounded-[1px] bg-accent-blue transition-opacity duration-200",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
