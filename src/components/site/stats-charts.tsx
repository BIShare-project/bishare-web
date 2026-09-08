"use client";

import { useCallback, useRef, useState } from "react";

const nf = new Intl.NumberFormat("en-US");

/** Chart geometry, shared so the SVG path and the HTML overlay agree. */
const H = 160;
const TOP_PAD = 8;
const SPAN = H - 22;

export type SeriesPoint = { date: string; value: number };

/**
 * Cumulative area chart with a hover readout.
 *
 * The SVG is drawn with `preserveAspectRatio="none"`, so a marker placed at an
 * SVG coordinate would not land where the eye expects once the box stretches.
 * Everything interactive is therefore positioned in percentages over the top,
 * which stretches with the box the same way the path does.
 */
export function AreaChart({ points }: { points: SeriesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.value));
  const xPct = useCallback((i: number) => (n < 2 ? 0 : (i / (n - 1)) * 100), [n]);
  const yPct = useCallback(
    (v: number) => ((H - TOP_PAD - (v / max) * SPAN) / H) * 100,
    [max]
  );

  const track = useCallback(
    (clientX: number) => {
      const el = box.current;
      if (!el || n < 2) return;
      const r = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      setHover(Math.round(ratio * (n - 1)));
    },
    [n]
  );

  if (n < 2) return <div className="h-40" />;

  const w = 640;
  const step = w / (n - 1);
  const xy = points.map((p, i) => [i * step, H - TOP_PAD - (p.value / max) * SPAN] as const);
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const active = hover !== null ? points[hover] : null;
  const lastIdx = n - 1;
  const markerIdx = hover ?? lastIdx;
  const marker = points[markerIdx];

  return (
    <div
      ref={box}
      className="relative h-40 w-full touch-none"
      onMouseMove={(e) => track(e.clientX)}
      onMouseLeave={() => setHover(null)}
      onTouchStart={(e) => track(e.touches[0]!.clientX)}
      onTouchMove={(e) => track(e.touches[0]!.clientX)}
      onTouchEnd={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${w} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${w},${H} L0,${H} Z`} fill="url(#ag)" />
        <path
          d={line}
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* guide line, only while pointing */}
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-foreground/25"
          style={{ left: `${xPct(hover!)}%` }}
        />
      )}

      {/* marker: the latest point at rest, the pointed-at one on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-blue)] ring-2 ring-background transition-[left,top] duration-75"
        style={{ left: `${xPct(markerIdx)}%`, top: `${yPct(marker.value)}%` }}
      />

      {active && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-center shadow-lg"
          style={{
            left: `clamp(3.5rem, ${xPct(hover!)}%, calc(100% - 3.5rem))`,
            top: `${yPct(active.value)}%`,
          }}
        >
          <p className="font-mono text-[13px] font-semibold tabular-nums leading-none text-foreground">
            {nf.format(active.value)}
          </p>
          <p className="mt-1 text-[11px] leading-none text-muted-foreground">
            {new Date(`${active.date}T00:00:00Z`).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </p>
        </div>
      )}
    </div>
  );
}

export type Slice = { label: string; value: number; color: string };

/** Donut breakdown; hovering a slice or a legend row highlights both. */
export function Donut({ slices, totalLabel }: { slices: Slice[]; totalLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const active = hover !== null ? slices[hover] : null;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-strong)" strokeWidth="13" opacity="0.4" />
          {slices.map((s, i) => {
            const len = (s.value / total) * C;
            const dim = hover !== null && hover !== i;
            const seg = (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? 16 : 13}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
                strokeLinecap="butt"
                opacity={dim ? 0.35 : 1}
                className="cursor-pointer transition-[stroke-width,opacity] duration-150"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
            acc += len;
            return seg;
          })}
        </svg>
        {/* centre readout: the pointed-at slice, or the total at rest */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[15px] font-semibold tabular-nums leading-none text-foreground">
            {nf.format(active ? active.value : total)}
          </span>
          <span className="mt-1 max-w-[5.5rem] truncate text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {active ? active.label : totalLabel}
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {slices.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={
              "flex cursor-default items-center gap-2.5 rounded-md px-1 py-0.5 text-sm transition " +
              (hover === i ? "bg-foreground/[0.06]" : "")
            }
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto shrink-0 font-mono font-semibold tabular-nums text-foreground">
              {nf.format(s.value)}
            </span>
            <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
