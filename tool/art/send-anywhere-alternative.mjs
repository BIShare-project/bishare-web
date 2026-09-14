import { C, frame, text, logo, card, phone, laptop } from "./kit.mjs";

export const ns = "sendAnywhereAlt";

const PURPLE = "#a78bfa";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 30)}
      ${phone(230, 110, { kind: "android", accent: C.green, label: L.left })}
      ${laptop(700, 150, { os: "win", accent: C.blue, label: L.right })}
      <path d="M392 250 C 500 190, 600 190, 690 238" stroke="${C.green}" stroke-width="3.5" fill="none" stroke-dasharray="10 9" stroke-linecap="round"/>
      <g transform="translate(470,130)">
        ${card(0, 0, 150, 52, { stroke: C.green, fill: "#0d2418", r: 26 })}
        ${text(75, 35, "K7Q2MX", { size: 24, weight: 800, fill: C.greenInk, ltr: true, ls: 2 })}
      </g>
      <g transform="translate(440,405)">
        ${card(0, 0, 320, 64, { stroke: C.amber, fill: "#1a1508", r: 12 })}
        <rect x="18" y="24" width="90" height="16" rx="8" fill="${C.amber}" opacity="0.85"/>
        ${text(212, 40, L.meter, { size: 20, weight: 700, fill: C.amberInk, fit: 180, ltr: true })}
        <path d="M10 58 L310 6" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
      </g>
      ${text(600, 548, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 596, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Six dated notices along one axis. */
  timeline: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [C.dim, C.dim, C.blue, C.amber, C.red, PURPLE];
      return frame(1200, 600, `
        ${text(600, 60, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 98, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        <path d="M70 330 H1130" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
        ${[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 125 + i * 190, up = i % 2 === 0;
          const cy = up ? 140 : 400;
          return `<circle cx="${x}" cy="330" r="10" fill="${cols[i]}"/>
            <path d="M${x} ${up ? 320 : 340} V${up ? cy + 150 : cy}" stroke="${cols[i]}" stroke-width="2" stroke-dasharray="4 5"/>
            ${card(x - 88, cy, 176, 150, { stroke: cols[i], fill: "#0f1e36", r: 14 })}
            ${text(x, cy + 38, L["y" + i], { size: 21, weight: 700, fill: i < 2 ? C.sub : cols[i], fit: 156 })}
            ${text(x, cy + 92, L["e" + i], { size: 19, weight: 600, fill: "#ffffff", wrap: [150, 2], lh: 1.3 })}`;
        }).join("")}
      `);
    },
  },

  /* Three modes as a comparison grid. */
  modes: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [390, 580, 780, 990];
      const rows = [
        { size: L.s0, kept: L.k0, pool: "no", resume: "no", col: C.green },
        { size: L.s1, kept: L.k1, pool: "yes", resume: "yes", col: C.amber },
        { size: L.s2, kept: L.k2, pool: "no", resume: "no", col: C.blue },
      ];
      const chip = (cx, cy, k, bad) => {
        const col = bad ? C.red : C.green;
        const ink = bad ? C.redInk : C.greenInk;
        return `<rect x="${cx - 70}" y="${cy - 20}" width="140" height="40" rx="20" fill="${col}" fill-opacity="0.13" stroke="${col}" stroke-width="2"/>
          ${text(cx, cy + 7, L[k], { size: 18, weight: 650, fill: ink, fit: 125 })}`;
      };
      return frame(1200, 600, `
        ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(50, 118, 1100, 440, { stroke: C.line, fill: "#0b1628" })}
        ${text(cols[0], 172, L.colSize, { size: 18, weight: 700, fill: C.sub, wrap: [170, 2], lh: 1.2 })}
        ${text(cols[1], 172, L.colKept, { size: 18, weight: 700, fill: C.sub, wrap: [180, 2], lh: 1.2 })}
        ${text(cols[2], 172, L.colPool, { size: 18, weight: 700, fill: C.sub, wrap: [180, 2], lh: 1.2 })}
        ${text(cols[3], 172, L.colResume, { size: 18, weight: 700, fill: C.sub, wrap: [170, 2], lh: 1.2 })}
        ${rows.map((r, i) => {
          const y = 270 + i * 105;
          return `<path d="M70 ${y - 52} H1130" stroke="${C.line}" stroke-width="1.5"/>
            <rect x="80" y="${y - 30}" width="6" height="60" rx="3" fill="${r.col}"/>
            ${text(190, y + 8, L["m" + i], { size: 22, weight: 700, fill: "#ffffff", wrap: [190, 2], lh: 1.2 })}
            ${text(cols[0], y + 9, r.size, { size: 26, weight: 750, fill: r.col, fit: 160, ltr: true })}
            ${text(cols[1], y + 8, r.kept, { size: 19, weight: 600, fill: C.ink, wrap: [180, 2], lh: 1.2 })}
            ${chip(cols[2], y, r.pool, r.pool === "yes")}
            ${chip(cols[3], y, r.resume, r.resume === "no")}`;
        }).join("")}
      `);
    },
  },

  /* One monthly pool drained by downloads from several links. */
  pool: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const links = [0, 1, 2];
      return frame(1200, 600, `
        ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(70, 150, 300, 300, { stroke: C.blue, fill: "#0c1a31", r: 22 })}
        ${text(220, 200, L.sender, { size: 22, weight: 700, fill: "#bcd4fb", fit: 260 })}
        <g transform="translate(145,230)">
          <rect width="150" height="190" rx="16" fill="#10213d" stroke="${C.amber}" stroke-width="3"/>
          <rect x="10" y="10" width="130" height="170" rx="10" fill="${C.amber}" opacity="0.18"/>
          <rect x="10" y="150" width="130" height="30" rx="8" fill="${C.amber}" opacity="0.8"/>
        </g>
        ${text(220, 480, L.pool, { size: 20, weight: 700, fill: C.amberInk, fit: 280 })}
        ${links.map((i) => {
          const y = 190 + i * 110;
          return `<path d="M${620} ${y + 30} C 500 ${y + 30}, 470 330, 380 330" stroke="${C.amber}" stroke-width="3" fill="none" stroke-dasharray="8 7"/>
            ${card(620, y, 220, 60, { stroke: C.line, fill: "#0f1e36", r: 14 })}
            ${text(730, y + 38, L["l" + (i + 1)], { size: 21, weight: 650, fill: "#ffffff", fit: 190 })}
            <path d="M846 ${y + 30} H900" stroke="${C.dim}" stroke-width="3"/>
            <circle cx="930" cy="${y + 30}" r="20" fill="#0f1e36" stroke="${C.dim}" stroke-width="2.5"/>
            <circle cx="930" cy="${y + 24}" r="6" fill="${C.dim}"/><path d="M918 ${y + 42} a12 10 0 0 1 24 0" fill="${C.dim}"/>
            <circle cx="990" cy="${y + 30}" r="20" fill="#0f1e36" stroke="${C.dim}" stroke-width="2.5"/>
            <circle cx="990" cy="${y + 24}" r="6" fill="${C.dim}"/><path d="M978 ${y + 42} a12 10 0 0 1 24 0" fill="${C.dim}"/>`;
        }).join("")}
        ${text(730, 170, L.used, { size: 18, weight: 600, fill: C.sub, fit: 380 })}
        ${card(420, 510, 460, 56, { stroke: C.red, fill: "#1f0f14", r: 28 })}
        ${text(650, 546, L.blocked, { size: 20, weight: 700, fill: C.redInk, fit: 430 })}
        ${card(920, 510, 220, 56, { stroke: C.green, fill: "#0d2418", r: 28 })}
        ${text(1030, 546, L.reset, { size: 19, weight: 650, fill: C.greenInk, fit: 200 })}
      `);
    },
  },
};
