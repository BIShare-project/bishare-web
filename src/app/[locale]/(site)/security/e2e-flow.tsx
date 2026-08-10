import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Beam } from "@/components/site/beam";
import { TagBadge } from "@/components/site/status-pill";
import { EyeOff, FileText, KeyRound, Laptop, Lock, Smartphone } from "lucide-react";

/**
 * The trust-page centerpiece (page-local): Device A → encrypted channel →
 * Device B, staged on a HUD surface (hairline grid + accent bloom under the
 * card). Geist/monochrome with a single blue accent: three light-packet lanes,
 * a plaintext chip that dissolves into the seal and a ciphertext chip that
 * emerges from it, then a wire-tap ticker showing what anyone in between gets.
 *
 * Server component — every animation is CSS (transform/opacity only, see the
 * `.e2e-*` block in site.css) and falls back to a meaningful static pose under
 * prefers-reduced-motion: file before the seal, ciphertext after it.
 */

/** One row of the wire-tap ticker; rendered twice for the seamless loop. */
const CIPHER_GROUPS = [
  "9f2e", "7c41", "b3a8", "d05f", "66e1", "4b9c",
  "2ad7", "8e30", "51fa", "c96b", "03d4", "7e28",
];

/** Ordered step keys → resolved against the "security" `flow.steps` namespace. */
const FLOW_STEPS: { step: string; key: string }[] = [
  { step: "01", key: "sealed" },
  { step: "02", key: "transit" },
  { step: "03", key: "unlocked" },
];

/* ── Parts ───────────────────────────────────────────────────────────── */

function DeviceNode({
  icon: Icon,
  name,
  role,
  keyLabel,
  orbitDuration,
  keyDelay,
}: {
  icon: LucideIcon;
  name: string;
  role: string;
  keyLabel: string;
  /** Desynchronize the two nodes so the pair never beats in lockstep. */
  orbitDuration: string;
  keyDelay: string;
}) {
  return (
    <div className="e2e-node relative w-full overflow-hidden rounded-xl border border-border bg-card px-6 py-7 text-center md:w-[212px]">
      <span
        className="e2e-node-sheen pointer-events-none absolute inset-x-6 top-0 h-px"
        aria-hidden
      />

      {/* Icon tile inside a slowly rotating dashed orbit. The orbit radius
          clears the tile's corners, so the ring reads as a full circle. */}
      <div className="relative mx-auto mb-4 h-[72px] w-[72px]">
        <svg
          viewBox="0 0 72 72"
          className="e2e-orbit absolute inset-0 h-full w-full text-border-strong"
          style={{ "--orbit-dur": orbitDuration } as React.CSSProperties}
          aria-hidden
        >
          <circle
            cx="36"
            cy="36"
            r="35"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 7"
          />
        </svg>
        <div className="hud-tile absolute inset-[14px] flex items-center justify-center rounded-[12px] border border-border text-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="font-semibold tracking-[-0.01em]">{name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{role}</p>

      <span
        className="e2e-key mt-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-background-raised px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        style={{ "--key-delay": keyDelay } as React.CSSProperties}
      >
        <KeyRound className="h-3 w-3 text-foreground" />
        {keyLabel}
      </span>
    </div>
  );
}

/** The seal that sits mid-channel: conic ring + expanding halos. */
function SealBadge() {
  return (
    <div className="absolute left-1/2 top-1/2 z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2">
      <span
        className="e2e-halo absolute inset-0 rounded-full border border-accent-blue/45"
        aria-hidden
      />
      <span
        className="e2e-halo absolute inset-0 rounded-full border border-accent-blue/30"
        style={{ "--halo-delay": "1.8s" } as React.CSSProperties}
        aria-hidden
      />
      <div className="conic-border relative flex h-full w-full items-center justify-center rounded-full border border-border bg-card shadow-[var(--shadow-card-hover)]">
        <span className="conic-ring" aria-hidden />
        <Lock className="h-5 w-5 text-foreground" aria-hidden />
      </div>
    </div>
  );
}

/** A chip riding the channel: full-width runner + the chip pinned at its edge. */
function ChannelChip({
  variant,
  children,
}: {
  variant: "plain" | "cipher";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`e2e-runner absolute inset-0 ${
        variant === "plain" ? "e2e-runner-plain" : "e2e-runner-cipher"
      }`}
      aria-hidden
    >
      <span className="e2e-chip absolute left-0 top-1/2 -ml-6 -mt-[15px] inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 font-mono text-[10px] text-foreground">
        {children}
      </span>
    </div>
  );
}

/* ── Diagram ─────────────────────────────────────────────────────────── */

export async function E2EFlowDiagram() {
  const t = await getTranslations("security");

  return (
    <div className="frame-top-line relative isolate overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-glass)]">
      {/* Backdrop layers */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="hud-grid absolute inset-0" />
        <div className="hud-bloom absolute inset-0" />
      </div>

      {/* HUD corner ticks */}
      <span
        className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-border-strong"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-border-strong"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-border-strong"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-border-strong"
        aria-hidden
      />

      <div className="p-6 md:p-10">
        {/* Header strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="pulse-dot relative h-2 w-2 rounded-full bg-success" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("flow.keysNeverLeave")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TagBadge>X25519</TagBadge>
            <TagBadge>AES-256-GCM</TagBadge>
          </div>
        </div>

        {/* Plain-language description for assistive tech; the diagram below
            is decorative repetition of the same fact. */}
        <p className="sr-only">{t("flow.srDescription")}</p>

        {/* The flow: Device A → encrypted channel → Device B */}
        <div className="mt-9 flex flex-col items-center md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-3">
          <DeviceNode
            icon={Smartphone}
            name={t("flow.deviceA.name")}
            role={t("flow.deviceA.role")}
            keyLabel={t("flow.keyStaysHere")}
            orbitDuration="26s"
            keyDelay="0s"
          />

          {/* Vertical channel (mobile) */}
          <div
            className="relative flex h-32 w-full items-center justify-center md:hidden"
            aria-hidden
          >
            <Beam
              path="M 1 0 L 1 100"
              width={2}
              height={100}
              preserveAspectRatio="none"
              duration={3}
              className="h-full w-[2px]"
            />
            <SealBadge />
          </div>

          {/* Horizontal channel (desktop): three lanes + the seal + chips */}
          <div className="e2e-channel relative hidden h-[132px] w-full md:block">
            <Beam
              path="M 0 34 C 110 12, 290 62, 400 30"
              width={400}
              height={132}
              duration={4.6}
              delay={0.7}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full opacity-45"
            />
            <Beam
              path="M 0 66 L 400 66"
              width={400}
              height={132}
              duration={3.2}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            />
            <Beam
              path="M 0 98 C 110 120, 290 70, 400 102"
              width={400}
              height={132}
              duration={5.2}
              delay={1.4}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full opacity-45"
            />

            <ChannelChip variant="plain">
              <FileText className="h-3 w-3" />
            </ChannelChip>
            <ChannelChip variant="cipher">8e30 51fa</ChannelChip>

            <SealBadge />

            <span className="absolute bottom-1 left-0 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("flow.plaintext")}
            </span>
            <span className="absolute bottom-1 right-0 font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
              {t("flow.ciphertext")}
            </span>
          </div>

          <DeviceNode
            icon={Laptop}
            name={t("flow.deviceB.name")}
            role={t("flow.deviceB.role")}
            keyLabel={t("flow.keyStaysHere")}
            orbitDuration="34s"
            keyDelay="2.1s"
          />
        </div>

        {/* What anyone in between actually sees */}
        <div className="relative mt-9 overflow-hidden rounded-lg border border-border bg-background-raised px-4 py-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("flow.whatNetworkSees")}
            </span>
            <div
              className="cipher-line min-w-0 flex-1 font-mono text-[11px] text-muted-foreground"
              aria-hidden
            >
              <span>
                {[...CIPHER_GROUPS, ...CIPHER_GROUPS].map((group, i) => (
                  <span
                    key={`${group}-${i}`}
                    className={i % 3 === 0 ? "opacity-45" : i % 3 === 1 ? "opacity-80" : ""}
                  >
                    {group}{" "}
                  </span>
                ))}
              </span>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:inline-flex">
              <EyeOff className="h-3 w-3" aria-hidden />
              {t("flow.unreadable")}
            </span>
          </div>
          <span className="e2e-scan" aria-hidden />
        </div>

        {/* Three-beat caption, on a hairline grid */}
        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {FLOW_STEPS.map((s) => (
            <div key={s.step} className="e2e-step bg-card p-5">
              <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-accent-blue">
                {s.step}
              </span>
              <p className="mt-2 text-sm font-semibold">
                {t(`flow.steps.${s.key}.title`)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t(`flow.steps.${s.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
