"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { VButton } from "./vbutton";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

/**
 * Curated top-level nav — product surface only. About/Philosophy/Contact
 * live in the footer so the bar stays scannable. Labels are resolved from the
 * "chrome" namespace at render time (`nav.<key>`).
 */
const NAV_LINKS = [
  { href: "/transfer", key: "transfer" },
  { href: "/rooms", key: "rooms" },
  { href: "/features", key: "features" },
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/security", key: "security" },
  { href: "/faq", key: "faq" },
  { href: "/blog", key: "blog" },
  { href: "/stats", key: "stats" },
] as const;

/**
 * Sticky header that floats on scroll: flush and full-width at the top, then —
 * once the page scrolls — the inner bar detaches into a centered, frosted-glass
 * island (rounded, subtle ring highlight + shadow, slightly shorter). Calm
 * Geist surface otherwise: accent underline on the active link, a pill CTA, and
 * a solid dropdown hamburger on mobile.
 */
export function SiteHeader() {
  const t = useTranslations("chrome");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 ease-out",
        scrolled
          ? "bg-transparent px-3 pt-3"
          : "border-b border-border bg-background/80 backdrop-blur-xl"
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between transition-all duration-300 ease-out",
          scrolled
            ? "h-14 max-w-5xl rounded-2xl border border-border bg-background/70 px-5 shadow-lg shadow-black/[0.06] ring-1 ring-white/10 backdrop-blur-xl"
            : "h-16 max-w-7xl px-6"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-lg tracking-[-0.02em]">
            BIShare
          </span>
        </Link>

        <div className="flex items-center gap-3 lg:gap-6">
          {/* Five links need more room than md allows — nav expands at lg */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative py-1 text-sm transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(`nav.${link.key}`)}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-0.5 left-1/2 h-px w-4 -translate-x-1/2 rounded-full bg-primary transition-opacity duration-300",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <LanguageSwitcher className="hidden lg:block" />
          <ThemeToggle className="hidden lg:flex" />

          <VButton href="/download" size="sm">
            {t("download")}
          </VButton>

          <button
            type="button"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-foreground"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — solid, calm */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="lg:hidden absolute inset-x-0 top-full border-b border-border bg-background/95 backdrop-blur-xl px-6 py-4"
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                    )}
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] px-3 pt-3">
              <span className="text-[13px] text-muted-foreground">
                {t("appearance")}
              </span>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
