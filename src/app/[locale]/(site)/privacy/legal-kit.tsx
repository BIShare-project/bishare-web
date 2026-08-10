import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Globe, Mail, MessageSquare } from "lucide-react";
import { GridBackdrop } from "@/components/site/grid-backdrop";
import { FadeUp } from "@/components/site/motion";
import type { TocItem } from "./legal-toc";

/**
 * Shared editorial shell for the legal pages. Lives in /privacy and is also
 * imported by /terms — both routes share the same reading experience.
 * (Candidate for promotion to components/site/ if a third legal page lands.)
 */

const SUPPORT_EMAIL = "support@billiongroup.net";

/* ── Page header: hairline grid, mono eyebrow, tight display title ──────── */
export function LegalHero({
  badge,
  title,
  dates,
}: {
  badge: string;
  title: ReactNode;
  dates: string[];
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <GridBackdrop pattern="lines" />
      <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <FadeUp y={16}>
          <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue" aria-hidden />
            {badge}
          </p>
          <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
            {title}
          </h1>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            {dates.map((date) => (
              <span
                key={date}
                className="inline-flex items-center rounded-full border border-border bg-background-raised px-3.5 py-1.5 font-mono text-[11px] tracking-[0.04em] text-muted-foreground"
              >
                {date}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Anchored section with hairline divider between siblings ───────────── */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="group scroll-mt-28">
      <span aria-hidden className="mt-12 mb-12 block h-px bg-border group-first:hidden" />
      {title && (
        <h2 className="mb-5 text-xl font-semibold tracking-[-0.015em] md:text-2xl">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/* ── Mobile TOC: collapsible bordered panel ─────────────────────────────── */
export function LegalTocMobile({ items }: { items: TocItem[] }) {
  const t = useTranslations("legal");
  return (
    <details className="mb-10 rounded-xl border border-border bg-card lg:hidden">
      <summary className="cursor-pointer px-5 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground select-none">
        {t("shared.onThisPage")}
      </summary>
      <ul className="space-y-2.5 px-5 pb-5 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ── Contact channels (identical on both legal pages) ──────────────────── */
const CHANNELS = [
  {
    icon: Mail,
    labelKey: "shared.contact.email",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    internal: false,
  },
  {
    icon: MessageSquare,
    labelKey: "shared.contact.form",
    value: "bishare.app/contact",
    href: "/contact",
    internal: true,
  },
  {
    icon: Globe,
    labelKey: "shared.contact.website",
    value: "bishare.app",
    href: "https://bishare.app",
    internal: false,
  },
] as const;

export function LegalContactChannels() {
  const t = useTranslations("legal");
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {CHANNELS.map((channel) => {
        const inner = (
          <>
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-raised text-foreground">
              <channel.icon className="h-4 w-4" />
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t(channel.labelKey)}
            </span>
            <span className="mt-1 block text-sm font-medium break-all text-foreground">
              {channel.value}
            </span>
          </>
        );
        const cls =
          "block rounded-xl border border-border bg-card p-4 transition-colors duration-200 hover:bg-background-raised hover:border-border-strong";
        return channel.internal ? (
          <Link key={channel.labelKey} href={channel.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <a key={channel.labelKey} href={channel.href} className={cls}>
            {inner}
          </a>
        );
      })}
    </div>
  );
}

/* ── "Read next" footer pills ───────────────────────────────────────────── */
export function LegalFooterLinks({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <div className="mt-14">
      <span aria-hidden className="mb-8 block h-px bg-border" />
      <div className="flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {link.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
