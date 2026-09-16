import { C, frame, text, logo, card, browser, phone, beam } from "./kit.mjs";

export const ns = "noAccountShare";

const PURPLE = "#a78bfa";

/* A small sign-in form with a slash through it, centred on (cx, cy). */
function noForm(cx, cy, label) {
  return `<g transform="translate(${cx},${cy})">
    <rect x="-70" y="-46" width="140" height="92" rx="12" fill="#15122a" stroke="${C.red}" stroke-opacity="0.9" stroke-width="3"/>
    <rect x="-52" y="-28" width="104" height="16" rx="6" fill="#1f2a44"/>
    <rect x="-52" y="-4" width="104" height="16" rx="6" fill="#1f2a44"/>
    <rect x="-52" y="20" width="60" height="16" rx="8" fill="${C.blue}" fill-opacity="0.35"/>
    <path d="M-62 40 L62 -40" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
    ${text(0, 76, label, { size: 18, weight: 650, fill: C.redInk, fit: 200 })}
  </g>`;
}

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${browser(150, 170, { label: L.left })}
      ${beam(470, 800, 280)}
      ${phone(820, 130, { kind: "iphone", label: L.right })}
      ${noForm(600, 150, L.badge)}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Three groups as nested bands. */
  sides: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const zones = [
        { k: "z1", apps: "z1apps", color: C.green, y: 140 },
        { k: "z2", apps: "z2apps", color: C.amber, y: 280 },
        { k: "z3", apps: "z3apps", color: C.blue, y: 420 },
      ];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${zones.map((z, n) => {
          const w = 700 + n * 190, x = 600 - w / 2;
          return `${card(x, z.y, w, 118, { stroke: z.color, fill: n === 0 ? "#0c1f22" : n === 1 ? "#221c10" : "#0f1e36" })}
            <circle cx="${x + 46}" cy="${z.y + 59}" r="${10 + n * 6}" fill="none" stroke="${z.color}" stroke-width="3"/>
            <circle cx="${x + 46}" cy="${z.y + 59}" r="5" fill="${z.color}"/>
            ${text(600, z.y + 48, L[z.k], { size: 23, weight: 700, fill: "#ffffff", fit: w - 180 })}
            ${text(600, z.y + 88, L[z.apps], { size: 18, fill: C.ink, fit: w - 180 })}`;
        }).join("")}
        ${text(600, 578, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Free size per transfer, log scale bars. */
  limits: {
    mirror: true,
    w: 1200, h: 660,
    draw: (L) => {
      const rows = [
        { k: "dropbox", v: "dropboxv", gb: 2, color: C.dim, ink: C.sub },
        { k: "smash", v: "smashv", gb: 2, color: C.amber, ink: C.amberInk },
        { k: "send", v: "sendv", gb: 2.5, color: C.amber, ink: C.amberInk },
        { k: "filemail", v: "filemailv", gb: 5, color: C.blue, ink: "#bcd4fb" },
        { k: "wormhole", v: "wormholev", gb: 10, color: C.blue, ink: "#bcd4fb" },
        { k: "swiss", v: "swissv", gb: 50, color: C.green, ink: C.greenInk },
        { k: "bishare", v: "bisharev", gb: 100, color: C.green, ink: C.greenInk },
      ];
      const x0 = 400, x1 = 1120;
      const px = (gb) => x0 + ((Math.log10(gb) - 0) / (Math.log10(150) - 0)) * (x1 - x0);
      return frame(1200, 660, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 128, 1080, 470, { stroke: C.line, fill: "#0b1628" })}
        ${[1, 10, 100].map((g) => `<path d="M${px(g)} 146 V580" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="4 6"/>`).join("")}
        ${rows.map((r, i) => {
          const y = 166 + i * 58;
          const w = Math.max(px(r.gb) - x0, 14);
          // Centred labels only, so the Arabic mirror needs no anchor swap.
          return `${text(230, y + 23, L[r.k], { size: 18, weight: 650, fill: C.ink, fit: 300 })}
            <rect x="${x0}" y="${y}" width="${w}" height="34" rx="8" fill="${r.color}" fill-opacity="0.22" stroke="${r.color}" stroke-width="2"/>
            ${w > 300
              ? text(x0 + w / 2, y + 23, L[r.v], { size: 16, weight: 700, fill: "#ffffff", fit: w - 24, ltr: true })
              : text(x0 + w + 150, y + 23, L[r.v], { size: 16, weight: 600, fill: r.ink, fit: 280, ltr: true })}`;
        }).join("")}
        ${text(600, 634, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Five controls against four services: check grid. */
  controls: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      // rows: expiry at send · one-time · password · extend · receipts
      // cols: BIShare · Wormhole · SwissTransfer · Smash
      const grid = [
        [true, true, true, true],
        [true, false, false, false],
        [false, false, true, false],
        [false, false, true, false],
        [false, false, false, false],
      ];
      const cols = [640, 780, 920, 1060];
      const mark = (cx, cy, ok) => ok
        ? `<circle cx="${cx}" cy="${cy}" r="15" fill="${C.green}" fill-opacity="0.18" stroke="${C.green}" stroke-width="2.5"/>
           <path d="M${cx - 7} ${cy} l5 5 l10 -11" stroke="${C.green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M${cx - 11} ${cy} H${cx + 11}" stroke="${C.dim}" stroke-width="3" stroke-linecap="round"/>`;
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 128, 1080, 404, { stroke: C.line, fill: "#0b1628" })}
        ${cols.map((cx, c) => `<rect x="${cx - 62}" y="142" width="124" height="40" rx="10" fill="${c === 0 ? C.green : C.blue}" fill-opacity="0.14" stroke="${c === 0 ? C.green : C.blue}" stroke-width="2"/>
          ${text(cx, 168, L["c" + c], { size: 16, weight: 700, fill: "#ffffff", fit: 108 })}`).join("")}
        ${grid.map((row, i) => {
          const y = 222 + i * 62;
          return `${i ? `<path d="M80 ${y - 31} H1120" stroke="${C.line}" stroke-width="1.5"/>` : ""}
            ${text(320, y + 7, L["r" + i], { size: 19, weight: 600, fill: C.ink, fit: 470 })}
            ${row.map((ok, c) => mark(cols[c], y, ok)).join("")}`;
        }).join("")}
        ${text(600, 568, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },
};
