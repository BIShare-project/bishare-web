import { C, frame, text, logo, card, laptop, phone } from "./kit.mjs";

export const ns = "airdropFix";

const PURPLE = "#a78bfa";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 30)}
      ${phone(290, 110, { kind: "iphone", accent: C.blue, label: L.left })}
      ${laptop(640, 150, { os: "mac", accent: C.blue, label: L.right })}
      <g fill="none" stroke-width="3" stroke-linecap="round">
        <path d="M456 250 C 500 222, 530 214, 552 214" stroke="${C.blue}" stroke-dasharray="9 8"/>
        <path d="M612 214 C 632 214, 652 220, 676 232" stroke="${C.blue}" stroke-dasharray="9 8" stroke-opacity="0.5"/>
      </g>
      <circle cx="582" cy="214" r="22" fill="#2a1216" stroke="${C.red}" stroke-width="2.5"/>
      <path d="M573 205 L591 223 M591 205 L573 223" stroke="${C.redInk}" stroke-width="3.5" stroke-linecap="round"/>
      <g transform="translate(1010,110)">
        ${card(0, 0, 120, 150, { stroke: C.amber, fill: "#1a1508", r: 14 })}
        ${[0, 1, 2].map((n) => `<rect x="20" y="${28 + n * 40}" width="18" height="18" rx="4" fill="none" stroke="${n < 2 ? C.green : C.dim}" stroke-width="2.5"/>
          ${n < 2 ? `<path d="M24 ${37 + n * 40} l4 4 l8 -9" stroke="${C.green}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
          <rect x="50" y="${33 + n * 40}" width="${50 - n * 8}" height="8" rx="4" fill="${C.amber}" opacity="${0.6 - n * 0.15}"/>`).join("")}
      </g>
      ${text(600, 548, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 596, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Six symptom cards, each with its usual cause underneath. */
  symptoms: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const colors = [C.blue, C.amber, C.green, C.red, PURPLE, C.blueDeep];
      return frame(1200, 600, `
        ${text(600, 62, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 100, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${[0, 1, 2, 3, 4, 5].map((i) => {
          const x = i % 2 ? 620 : 60, y = 128 + Math.floor(i / 2) * 150;
          const col = colors[i];
          return `${card(x, y, 520, 130, { stroke: C.line, fill: "#0f1e36" })}
            <rect x="${x}" y="${y + 18}" width="6" height="94" rx="3" fill="${col}"/>
            ${text(x + 266, y + 52, L["s" + i], { size: 23, weight: 700, fill: "#ffffff", fit: 460 })}
            <path d="M${x + 250} ${y + 68} l16 10 l16 -10" stroke="${col}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${text(x + 266, y + 108, L["c" + i], { size: 19, fill: C.ink, fit: 460 })}`;
        }).join("")}
      `);
    },
  },

  /* Apple's checklist as a chain of five steps. */
  needs: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const xs = [150, 375, 600, 825, 1050];
      const cols = [C.blue, C.blue, C.amber, C.green, PURPLE];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        <path d="M150 262 H1050" stroke="${C.line}" stroke-width="4"/>
        ${xs.map((x, i) => `
          <circle cx="${x}" cy="262" r="58" fill="#0f1e36" stroke="${cols[i]}" stroke-width="3"/>
          ${text(x, 280, String(i + 1), { size: 48, weight: 700, fill: cols[i] })}
          ${text(x, 390, L["n" + i], { size: 22, weight: 650, fill: "#ffffff", wrap: [190, 2], lh: 1.3 })}`).join("")}
        ${card(160, 470, 880, 64, { stroke: C.amber, fill: "#1a1508", r: 32 })}
        ${text(600, 510, L.foot, { size: 19, weight: 600, fill: C.amberInk, fit: 820 })}
      `);
    },
  },

  /* Six dated changes along one axis, alternating above and below. */
  timeline: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [C.amber, C.amber, C.blue, C.blue, C.green, PURPLE];
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
            ${text(x, cy + 36, L["e" + i + "y"], { size: 19, weight: 700, fill: cols[i], fit: 156 })}
            ${text(x, cy + 96, L["e" + i], { size: 18, weight: 600, fill: "#ffffff", wrap: [156, 3], lh: 1.3 })}`;
        }).join("")}
      `);
    },
  },
};
