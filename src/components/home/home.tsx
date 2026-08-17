import { Link } from "@/i18n/navigation";
import type { CSSProperties, ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Check,
  Globe,
  KeyRound,
  Link2,
  Lock,
  MonitorSmartphone,
  QrCode,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/site/motion";
import { VButton } from "@/components/site/vbutton";
import { StoreButtons } from "@/components/site/store-buttons";
import { QRDisplay } from "@/components/site/qr-display";
import { LiveWidget } from "@/components/home/live-widget";

/**
 * Geist/Vercel-grade homepage — high-contrast monochrome, big tight type,
 * hairline bordered grids, a framed product surface, restrained motion. Color
 * appears once, as a single blue accent. Premium through precision, not effects.
 *
 * This is a SERVER component: all the static translated markup streams
 * server-rendered, and only the small reveal wrappers (FadeUp) + the lazy
 * transfer widget hydrate as client islands. That keeps the homepage's client
 * JS / hydration work minimal.
 */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-raised px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue" />
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  center,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <FadeUp>
        <Eyebrow>{eyebrow}</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.05}>
        <h2 className="mt-5 text-[clamp(2rem,3.8vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          {title}
        </h2>
      </FadeUp>
      {sub && (
        <FadeUp delay={0.1}>
          <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
            {sub}
          </p>
        </FadeUp>
      )}
    </div>
  );
}

/* ── Hero product mock — a clean, monochrome BIShare window ───────────────── */
async function AppFrame() {
  const t = await getTranslations("home");
  return (
    <div className="sheen-border frame-top-line overflow-hidden rounded-xl bg-card shadow-2xl shadow-black/20">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <span className="ml-3 font-mono text-[11px] text-muted-foreground">
          BIShare
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {t("appFrame.ready")}
        </span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1.1fr] sm:p-6">
        {/* Nearby devices */}
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("appFrame.nearby")}
          </p>
          <div className="space-y-2">
            {[
              { name: "iPhone 15", meta: "iOS" },
              { name: "MacBook Pro", meta: "macOS" },
              { name: "Desktop-PC", meta: "Windows" },
            ].map((d, i) => (
              <div
                key={d.name}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                  i === 0
                    ? "border-foreground/25 bg-secondary"
                    : "border-border"
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground">
                  <MonitorSmartphone className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {d.name}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {d.meta}
                  </span>
                </span>
                {i === 0 && (
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-accent-blue">
                    {t("appFrame.selected")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active transfer */}
        <div className="rounded-lg border border-border bg-background-raised p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
              <Zap className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                design-final.zip
              </span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                248 MB
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <Lock className="h-3 w-3" /> E2E
            </span>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent-blue"
              style={{ width: "72%" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
            <span>{t("appFrame.sending")} · 72%</span>
            <span className="text-foreground">48 MB/s</span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="font-mono text-[11px] text-muted-foreground">
              {t("appFrame.caption")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
/** Above-the-fold stagger delay for the SSR-visible `.hero-rise` CSS entrance. */
const rise = (d: number): CSSProperties => ({ "--rise-delay": `${d}s` } as CSSProperties);

async function Hero() {
  const t = await getTranslations("home");
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="geist-grid pointer-events-none absolute inset-0 -z-10" />
      {/* Hero uses the CSS `.hero-rise` entrance (SSR-visible, no JS) instead of
          a framer-motion reveal: the LCP <h1> must paint immediately, not wait
          for the bundle to hydrate + an IntersectionObserver to fire. */}
      <div className="spotlight-radial relative mx-auto max-w-5xl px-5 pt-12 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16 md:pt-28">
        <div className="hero-rise flex justify-center" style={rise(0)}>
          <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
        </div>
        <h1
          className="hero-rise mx-auto mt-7 max-w-3xl text-[clamp(2.75rem,6.4vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-balance"
          style={rise(0.06)}
        >
          {t("hero.title")}
        </h1>
        <p
          className="hero-rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-balance"
          style={rise(0.12)}
        >
          {t.rich("hero.body", {
            highlight: (chunks) => <span className="text-foreground">{chunks}</span>,
          })}
        </p>
        <div
          className="hero-rise mt-9 flex flex-wrap items-center justify-center gap-3"
          style={rise(0.18)}
        >
          <VButton href="/download" size="lg">
            {t("hero.ctaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </VButton>
          <VButton href="/transfer" size="lg" variant="secondary">
            {t("hero.ctaSecondary")}
          </VButton>
        </div>
        <p
          className="hero-rise mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          style={rise(0.24)}
        >
          {t("hero.footnote")}
        </p>

        {/* Framed product */}
        <div className="hero-rise mx-auto mt-14 max-w-3xl text-left" style={rise(0.2)}>
          <AppFrame />
        </div>
      </div>
    </section>
  );
}

/* ── Live transfer — a real, working send right on the homepage ───────────── */
async function Live() {
  const t = await getTranslations("home");
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-20 md:py-28">
        <div className="text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-blue/40 bg-accent-blue/[0.06] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-blue">
              <span className="pulse-dot relative h-1.5 w-1.5 rounded-full bg-accent-blue" />
              {t("live.badge")}
            </span>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="mt-5 text-[clamp(1.85rem,3.6vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
              {t("live.title")}
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-muted-foreground text-balance">
              {t("live.sub")}
            </p>
          </FadeUp>
        </div>
        <FadeUp delay={0.1}>
          {/* No card wrapper: the studio brings its own shell (ring, glass,
              bloom), and nesting it in a plain card double-bordered it. */}
          <div className="mt-9">
            <LiveWidget />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Differentiators (bento) ─────────────────────────────────────────────── */
async function Differentiators() {
  const t = await getTranslations("home");
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-20 md:py-28">
        <SectionHead
          eyebrow={t("differentiators.eyebrow")}
          title={t("differentiators.title")}
          sub={t("differentiators.sub")}
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {/* Wide feature */}
          <div className="bg-card p-8 md:col-span-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
              <Link2 className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
              {t("differentiators.noApp.title")}
            </h3>
            <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {t("differentiators.noApp.body")}
            </p>
          </div>
          <div className="bg-card p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
              {t("differentiators.platform.title")}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {t("differentiators.platform.body")}
            </p>
          </div>
          <div className="bg-card p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
              {t("differentiators.private.title")}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {t("differentiators.private.body")}
            </p>
          </div>
          <div className="bg-card p-8 md:col-span-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
              {t("differentiators.speed.title")}
            </h3>
            <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {t("differentiators.speed.body")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Feature grid (bordered, Vercel-style) ───────────────────────────────── */
const FEATURES = [
  { icon: Zap, key: "speed" },
  { icon: Link2, key: "links" },
  { icon: Users, key: "rooms" },
  { icon: QrCode, key: "qr" },
  { icon: MonitorSmartphone, key: "platform" },
  { icon: KeyRound, key: "noAccount" },
] as const;

async function Features() {
  const t = await getTranslations("home");
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-20 md:py-28">
        <SectionHead
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
        />
        <div className="mt-12 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.key}
              className="group border-b border-r border-border p-8 transition-all duration-300 hover:bg-background-raised hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]"
            >
              <f.icon className="h-5 w-5 text-foreground transition-colors duration-300 group-hover:text-accent-blue" />
              <h3 className="mt-5 text-base font-semibold tracking-[-0.01em]">
                {t(`features.items.${f.key}.title`)}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {t(`features.items.${f.key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────────────────────── */
const STEPS = [
  { n: "01", key: "pick" },
  { n: "02", key: "encrypt" },
  { n: "03", key: "land" },
] as const;

async function HowItWorks() {
  const t = await getTranslations("home");
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-20 md:py-28">
        <SectionHead eyebrow={t("steps.eyebrow")} title={t("steps.title")} />
        <div className="mt-12 grid grid-cols-1 border-l border-t border-border md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-b border-r border-border p-8">
              <span className="font-mono text-sm font-semibold text-accent-blue">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold leading-snug tracking-[-0.01em]">
                {t(`steps.items.${s.key}.title`)}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {t(`steps.items.${s.key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────────────────────── */
const CTA_POINTS = ["free", "platforms", "anyone"] as const;

async function DownloadCTA() {
  const t = await getTranslations("home");
  return (
    <section className="relative overflow-hidden">
      <div className="geist-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-6 sm:py-24 md:grid-cols-[1.1fr_0.9fr] md:py-32">
        <FadeUp>
          <div>
            <h2 className="text-[clamp(2.25rem,4.4vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
              {t("cta.title")}
            </h2>
            <ul className="mt-8 space-y-3">
              {CTA_POINTS.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-3 text-[15px] text-muted-foreground"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background-raised text-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  {t(`cta.points.${p}`)}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <VButton href="/download" size="lg">
                {t("cta.download")}
                <ArrowRight className="h-4 w-4" />
              </VButton>
            </div>
            <div className="mt-6">
              <StoreButtons />
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="flex justify-center md:justify-end">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-7">
              <QRDisplay value="https://bishare.app" size={150} />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("cta.scan")}
              </p>
              <Link
                href="/download"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue transition-opacity hover:opacity-80"
              >
                {t("cta.allPlatforms")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export function Home() {
  return (
    <main>
      <Hero />
      <Live />
      <Differentiators />
      <Features />
      <HowItWorks />
      <DownloadCTA />
    </main>
  );
}
