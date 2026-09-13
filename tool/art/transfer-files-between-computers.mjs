import { C, frame, text, logo, card, laptop, beam } from "./kit.mjs";

export const ns = "pcToPc";

const PURPLE = "#a78bfa";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${laptop(110, 150, { os: "win", label: L.left })}
      ${laptop(790, 150, { os: "mac", accent: C.green, label: L.right })}
      ${beam(430, 790, 244)}
      <g transform="translate(548,196)">
        <path d="M0 14 a8 8 0 0 1 8 -8 h28 l10 10 h50 a8 8 0 0 1 8 8 v54 a8 8 0 0 1 -8 8 h-88 a8 8 0 0 1 -8 -8 z" fill="#0f1e36" stroke="${C.blue}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M0 32 h104" stroke="${C.blue}" stroke-width="2" opacity="0.6"/>
      </g>
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Four pairs of operating systems, with built-in routes and fallbacks. */
  pairs: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const cards = [
        { k: "a", color: C.blue },
        { k: "b", color: C.green },
        { k: "c", color: C.amber },
        { k: "d", color: PURPLE },
      ];
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${cards.map((c, n) => {
          const x = 60 + (n % 2) * 550, y = 132 + Math.floor(n / 2) * 238;
          const Lk = L[c.k];
          return `${card(x, y, 530, 220, { stroke: c.color, fill: "#0f1e36" })}
            ${text(x + 265, y + 48, Lk.pair, { size: 26, weight: 720, fill: "#ffffff", ltr: true, fit: 480 })}
            <rect x="${x + 195}" y="${y + 68}" width="140" height="26" rx="13" fill="${c.color}" fill-opacity="0.16"/>
            ${text(x + 265, y + 87, L.builtLabel, { size: 14, weight: 700, fill: c.color, fit: 130 })}
            ${text(x + 265, y + 126, Lk.built, { size: 18, weight: 600, fill: C.ink, wrap: [480, 2], lh: 1.25 })}
            <path d="M${x + 40} ${y + 160} H${x + 490}" stroke="${C.line}" stroke-width="1.5"/>
            ${text(x + 265, y + 186, L.anyLabel, { size: 14, fill: C.sub, fit: 200 })}
            ${text(x + 265, y + 208, Lk.any, { size: 17, fill: C.sub, fit: 480 })}`;
        }).join("")}
      `);
    },
  },

  /* Check grid: what three tools carry to a new computer. */
  moves: {
    mirror: true,
    w: 1200, h: 560,
    draw: (L) => {
      const cols = [
        { k: "backup", color: C.blue, v: [true, true, false, false] },
        { k: "migration", color: C.green, v: [true, true, true, true] },
        { k: "bishare", color: PURPLE, v: [true, false, false, true] },
      ];
      const rows = ["files", "settings", "apps", "anytime"];
      const mark = (cx, cy, ok) => ok
        ? `<circle cx="${cx}" cy="${cy}" r="17" fill="${C.green}" fill-opacity="0.18" stroke="${C.green}" stroke-width="2.5"/>
           <path d="M${cx - 8} ${cy} l5 6 l11 -12" stroke="${C.green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<circle cx="${cx}" cy="${cy}" r="17" fill="${C.red}" fill-opacity="0.12" stroke="${C.red}" stroke-opacity="0.7" stroke-width="2.5"/>
           <path d="M${cx - 6} ${cy - 6} l12 12 M${cx + 6} ${cy - 6} l-12 12" stroke="${C.redInk}" stroke-width="3" stroke-linecap="round"/>`;
      return frame(1200, 560, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 130, 1080, 370, { stroke: C.line, fill: "#0b1628" })}
        ${cols.map((c, n) => {
          const cx = 510 + n * 230;
          return `<rect x="${cx - 105}" y="146" width="210" height="46" rx="12" fill="${c.color}" fill-opacity="0.14" stroke="${c.color}" stroke-width="2"/>
            ${text(cx, 176, L[c.k], { size: 18, weight: 700, fill: "#ffffff", fit: 190 })}`;
        }).join("")}
        ${rows.map((r, i) => {
          const y = 238 + i * 70;
          return `${i ? `<path d="M80 ${y - 35} H1120" stroke="${C.line}" stroke-width="1.5"/>` : ""}
            ${text(235, y + 7, L[r], { size: 20, weight: 600, fill: C.ink, fit: 300 })}
            ${cols.map((c, n) => mark(510 + n * 230, y, c.v[i])).join("")}`;
        }).join("")}
        ${text(600, 536, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Nominal link rates on a log scale. */
  speed: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L, locale) => {
      const u = locale === "ru" ? { mb: "Мбит/с", gb: "Гбит/с" } : { mb: "Mb/s", gb: "Gb/s" };
      const num = (n) => new Intl.NumberFormat(`${locale}-u-nu-latn`).format(n);
      const rows = [
        { k: "r0", mbps: 2, v: `${num(2)} ${u.mb}`, color: C.dim },
        { k: "r1", mbps: 1000, v: `${num(1)} ${u.gb}`, color: C.blue },
        { k: "r2", mbps: 2500, v: `${num(2.5)} ${u.gb}`, color: C.blue },
        { k: "r3", mbps: 5000, v: `${num(5)} ${u.gb}`, color: C.amber },
        { k: "r4", mbps: 20000, v: `${num(20)} ${u.gb}`, color: C.green },
        { k: "r5", mbps: 40000, v: `${num(40)} ${u.gb}`, color: C.green },
      ];
      const x0 = 470, span = 600, lo = Math.log10(1), hi = Math.log10(40000);
      const len = (m) => Math.max(40, ((Math.log10(m) - lo) / (hi - lo)) * span);
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, n) => {
          const y = 168 + n * 64;
          const w = len(r.mbps);
          return `${text(245, y + 7, L[r.k], { size: 19, weight: 600, fill: C.ink, fit: 390 })}
            <rect x="${x0}" y="${y - 18}" width="${span}" height="36" rx="18" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="${x0}" y="${y - 18}" width="${w}" height="36" rx="18" fill="${r.color}" fill-opacity="0.7"/>
            ${w < 120
              ? text(x0 + w + 60, y + 7, r.v, { size: 17, weight: 700, fill: C.ink, ltr: true })
              : text(x0 + w / 2, y + 7, r.v, { size: 17, weight: 700, fill: "#ffffff", ltr: true, fit: w - 16 })}`;
        }).join("")}
        ${text(600, 576, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },
};
