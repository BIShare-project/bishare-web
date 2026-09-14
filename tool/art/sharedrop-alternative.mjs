import { C, frame, text, logo, card, browser, beam } from "./kit.mjs";

export const ns = "sharedropAlt";

const PURPLE = "#a78bfa";

/* Round avatar with a person glyph. */
const avatar = (cx, cy, col) => `
  <circle cx="${cx}" cy="${cy}" r="46" fill="#0f1e36" stroke="${col}" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy - 12}" r="13" fill="${col}" opacity="0.85"/>
  <path d="M${cx - 24} ${cy + 26} a24 20 0 0 1 48 0" fill="${col}" opacity="0.85"/>`;

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 30)}
      ${browser(120, 150, { accent: C.blue, label: L.left })}
      ${browser(780, 150, { accent: C.green, label: L.right })}
      ${beam(440, 760, 248)}
      <g transform="translate(545,380)" opacity="0.9">
        <rect width="110" height="56" rx="10" fill="#2a1a08" stroke="${C.amber}" stroke-width="2" stroke-dasharray="6 5"/>
        ${text(55, 37, L.ad, { size: 24, weight: 800, fill: C.amberInk, fit: 90 })}
        <path d="M8 50 L102 6" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
      </g>
      ${text(600, 548, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 596, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Two automatic rooms keyed by public IP address. */
  grouping: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => frame(1200, 600, `
      ${text(600, 58, L.title, { size: 32, weight: 660, fit: 1080 })}
      ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
      ${card(50, 120, 650, 360, { stroke: C.blue, fill: "#0c1a31", r: 22 })}
      ${card(740, 120, 410, 360, { stroke: PURPLE, fill: "#140f2a", r: 22 })}
      ${text(375, 166, L.roomA, { size: 26, weight: 700, fill: "#bcd4fb", fit: 560 })}
      ${text(375, 196, L.ipA, { size: 18, fill: C.sub, fit: 560 })}
      ${text(945, 166, L.roomB, { size: 26, weight: 700, fill: "#c4b5fd", fit: 360 })}
      ${text(945, 196, L.ipB, { size: 18, fill: C.sub, fit: 360 })}
      ${avatar(160, 290, C.green)}
      ${avatar(375, 290, C.dim)}
      ${avatar(590, 290, C.dim)}
      ${avatar(945, 290, C.amber)}
      ${text(160, 376, L.you, { size: 19, weight: 650, fill: C.greenInk, wrap: [180, 2], lh: 1.25 })}
      ${text(375, 376, L.stranger1, { size: 19, weight: 600, fill: C.ink, wrap: [180, 2], lh: 1.25 })}
      ${text(590, 376, L.stranger2, { size: 19, weight: 600, fill: C.ink, wrap: [180, 2], lh: 1.25 })}
      ${text(945, 376, L.laptop, { size: 19, weight: 650, fill: C.amberInk, wrap: [300, 2], lh: 1.25 })}
      <path d="M160 452 C 300 560, 820 560, 945 452" stroke="${C.red}" stroke-width="3" fill="none" stroke-dasharray="9 8"/>
      ${card(400, 516, 400, 50, { stroke: C.red, fill: "#1f0f14", r: 25 })}
      ${text(600, 548, L.note, { size: 20, weight: 650, fill: C.redInk, fit: 370 })}
    `),
  },

  /* Three models for reaching another network, and who must stay online. */
  online: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const rows = [
        { s: "yes", r: "yes", col: C.blue },
        { s: "yes", r: "no", col: C.amber },
        { s: "no", r: "no", col: C.green },
      ];
      const chip = (cx, cy, k) => {
        const col = k === "yes" ? C.red : C.green;
        const ink = k === "yes" ? C.redInk : C.greenInk;
        return `<rect x="${cx - 100}" y="${cy - 22}" width="200" height="44" rx="22" fill="${col}" fill-opacity="0.13" stroke="${col}" stroke-width="2"/>
          ${text(cx, cy + 7, L[k], { size: 19, weight: 650, fill: ink, fit: 180 })}`;
      };
      return frame(1200, 600, `
        ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(50, 118, 1100, 440, { stroke: C.line, fill: "#0b1628" })}
        ${text(790, 168, L.colSender, { size: 18, weight: 700, fill: C.sub, wrap: [220, 2], lh: 1.2 })}
        ${text(1020, 168, L.colRecipient, { size: 18, weight: 700, fill: C.sub, wrap: [230, 2], lh: 1.2 })}
        ${rows.map((r, i) => {
          const y = 270 + i * 110;
          return `<path d="M70 ${y - 55} H1130" stroke="${C.line}" stroke-width="1.5"/>
            <rect x="80" y="${y - 32}" width="6" height="64" rx="3" fill="${r.col}"/>
            ${text(360, y - 6, L["m" + i], { size: 24, weight: 700, fill: "#ffffff", fit: 500 })}
            ${text(360, y + 26, L["e" + i], { size: 18, fill: C.sub, fit: 500, ltr: true })}
            ${chip(790, y, r.s)}
            ${chip(1020, y, r.r)}`;
        }).join("")}
      `);
    },
  },

  /* Three self-hosting recipes side by side. */
  hosting: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [C.dim, C.blue, C.amber];
      return frame(1200, 600, `
        ${text(600, 58, L.title, { size: 32, weight: 660, fit: 1080 })}
        ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${[0, 1, 2].map((c) => {
          const x = 60 + c * 370;
          return `${card(x, 122, 340, 430, { stroke: cols[c], fill: "#0f1e36", r: 18 })}
            ${text(x + 170, 170, L["c" + c], { size: 24, weight: 700, fill: "#ffffff", fit: 300, ltr: true })}
            <path d="M${x + 24} 192 H${x + 316}" stroke="${C.line}" stroke-width="2"/>
            ${[0, 1, 2].map((k) => {
              const y = 240 + k * 105;
              return `${text(x + 170, y, L["k" + k], { size: 16, weight: 600, fill: C.sub, fit: 300 })}
                ${text(x + 170, y + 36, L["v" + c + k], { size: 21, weight: 650, fill: C.ink, wrap: [300, 2], lh: 1.25 })}`;
            }).join("")}`;
        }).join("")}
      `);
    },
  },
};
