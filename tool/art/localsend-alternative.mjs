import { C, frame, text, logo, card, laptop, phone } from "./kit.mjs";

export const ns = "localsendAlt";

const PURPLE = "#a78bfa";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      <ellipse cx="560" cy="270" rx="330" ry="170" fill="none" stroke="${C.blue}" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="6 8"/>
      ${phone(300, 118, { kind: "android", accent: C.green, label: L.left })}
      ${laptop(640, 150, { os: "win", label: L.right })}
      <path d="M460 250 C 540 214, 600 214, 650 240" stroke="${C.blue}" stroke-width="3" fill="none" stroke-dasharray="8 7" stroke-linecap="round"/>
      <path d="M636 232 L652 241 L640 256" stroke="${C.blue}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(1000,120)">
        <rect x="0" y="0" width="92" height="44" rx="22" fill="#15122a" stroke="${PURPLE}" stroke-width="2.5"/>
        <path d="M34 22 h24 M40 14 a8 8 0 0 0 0 16 M52 14 a8 8 0 0 1 0 16" stroke="#c4b5fd" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Three reach zones as nested bands. */
  reach: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const zones = [
        { k: "z1", apps: "z1apps", color: C.green, y: 140, inset: 0 },
        { k: "z2", apps: "z2apps", color: C.blue, y: 280, inset: 0 },
        { k: "z3", apps: "z3apps", color: PURPLE, y: 420, inset: 0 },
      ];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${zones.map((z, n) => {
          const w = 700 + n * 190, x = 600 - w / 2;
          return `${card(x, z.y, w, 118, { stroke: z.color, fill: n === 0 ? "#0c1f22" : n === 1 ? "#0f1e36" : "#15122a" })}
            <circle cx="${x + 46}" cy="${z.y + 59}" r="${10 + n * 6}" fill="none" stroke="${z.color}" stroke-width="3"/>
            <circle cx="${x + 46}" cy="${z.y + 59}" r="5" fill="${z.color}"/>
            ${text(600, z.y + 48, L[z.k], { size: 23, weight: 700, fill: "#ffffff", fit: w - 180 })}
            ${text(600, z.y + 88, L[z.apps], { size: 19, fill: C.ink, fit: w - 180 })}`;
        }).join("")}
        ${text(600, 578, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Two-column checklist, LocalSend against BIShare. */
  versus: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const rows = [
        { k: "r0", v: [true, true] },
        { k: "r1", v: [true, true] },
        { k: "r2", v: [true, true] },
        { k: "r3", v: [false, true] },
        { k: "r4", v: [false, true] },
        { k: "r5", v: [false, true] },
      ];
      const mark = (cx, cy, ok) => ok
        ? `<circle cx="${cx}" cy="${cy}" r="16" fill="${C.green}" fill-opacity="0.18" stroke="${C.green}" stroke-width="2.5"/>
           <path d="M${cx - 7} ${cy} l5 5 l10 -11" stroke="${C.green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M${cx - 12} ${cy} H${cx + 12}" stroke="${C.dim}" stroke-width="3" stroke-linecap="round"/>`;
      const c1 = 780, c2 = 1000;
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 128, 1080, 404, { stroke: C.line, fill: "#0b1628" })}
        <rect x="${c1 - 95}" y="142" width="190" height="44" rx="12" fill="${C.blue}" fill-opacity="0.14" stroke="${C.blue}" stroke-width="2"/>
        ${text(c1, 171, L.ls, { size: 19, weight: 700, fill: "#ffffff", fit: 170 })}
        <rect x="${c2 - 95}" y="142" width="190" height="44" rx="12" fill="${C.green}" fill-opacity="0.14" stroke="${C.green}" stroke-width="2"/>
        ${text(c2, 171, L.bs, { size: 19, weight: 700, fill: "#ffffff", fit: 170 })}
        ${rows.map((r, i) => {
          const y = 226 + i * 50;
          return `${i ? `<path d="M80 ${y - 25} H1120" stroke="${C.line}" stroke-width="1.5"/>` : ""}
            ${text(355, y + 7, L[r.k], { size: 19, weight: 600, fill: C.ink, fit: 520 })}
            ${mark(c1, y, r.v[0])}
            ${mark(c2, y, r.v[1])}`;
        }).join("")}
        ${text(600, 568, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Four situations stacked as rows: need on one side, picks on the other. */
  choose: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const rows = [
        { k: "a", color: C.green },
        { k: "b", color: C.blue },
        { k: "c", color: C.amber },
        { k: "d", color: PURPLE },
      ];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, i) => {
          const y = 134 + i * 110;
          const Lr = L[r.k];
          return `${card(60, y, 460, 90, { stroke: r.color, fill: "#0f1e36" })}
            ${text(290, y + 53, Lr.need, { size: 21, weight: 700, fill: "#ffffff", fit: 420 })}
            <path d="M532 ${y + 45} H652 M640 ${y + 35} L654 ${y + 45} L640 ${y + 55}" stroke="${r.color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(668, y, 472, 90, { stroke: C.line, fill: "#0b1628" })}
            ${text(904, y + 53, Lr.pick, { size: 20, weight: 600, fill: C.ink, fit: 430 })}`;
        }).join("")}
      `);
    },
  },
};
