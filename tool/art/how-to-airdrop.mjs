import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "howToAirdrop";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 40)}
      ${phone(250, 120, { kind: "iphone", label: L.left })}
      ${laptop(660, 150, { os: "mac", accent: C.green, label: L.right })}
      ${beam(410, 670, 250)}
      ${text(600, 528, L.title, { size: 54, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 578, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* The three receiving settings, and who each one lets in. */
  options: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [C.dim, C.blue, C.green];
      const inks = ["#cbd5e1", "#bcd4fb", C.greenInk];
      const glyph = (cx, cy, n) => n === 0
        ? `<path d="M${cx - 13} ${cy - 13} L${cx + 13} ${cy + 13} M${cx + 13} ${cy - 13} L${cx - 13} ${cy + 13}" stroke="${cols[0]}" stroke-width="4.5" stroke-linecap="round"/>`
        : n === 1
          ? `<circle cx="${cx}" cy="${cy - 8}" r="9" fill="${cols[1]}"/><path d="M${cx - 17} ${cy + 18} Q ${cx} ${cy - 6} ${cx + 17} ${cy + 18}" fill="${cols[1]}"/>`
          : `<circle cx="${cx - 16}" cy="${cy}" r="6" fill="${cols[2]}"/><circle cx="${cx}" cy="${cy}" r="6" fill="${cols[2]}"/><circle cx="${cx + 16}" cy="${cy}" r="6" fill="${cols[2]}"/>`;
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${[0, 1, 2].map((n) => {
          const x = 60 + n * 370;
          return `${card(x, 140, 340, 300, { stroke: cols[n], fill: "#0f1e36" })}
            <circle cx="${x + 170}" cy="208" r="36" fill="${cols[n]}" fill-opacity="0.14" stroke="${cols[n]}" stroke-width="2.5"/>
            ${glyph(x + 170, 208, n)}
            ${text(x + 170, 292, L["o" + n], { size: 25, weight: 700, fill: "#ffffff", fit: 300 })}
            ${text(x + 170, 362, L["o" + n + "d"], { size: 19, fill: inks[n], wrap: [290, 4], lh: 1.3 })}`;
        }).join("")}
        ${card(120, 480, 960, 64, { stroke: C.amber, fill: "#1a1508", r: 32 })}
        ${text(600, 520, L.foot, { size: 19, weight: 600, fill: C.amberInk, fit: 900 })}
      `);
    },
  },

  /* What arrives, and where it is saved. */
  landing: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const ids = ["0", "1", "2", "3"];
      const accent = [C.blue, C.blue, C.green, C.amber];
      return frame(1200, 640, `
        ${text(600, 70, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 108, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${ids.map((i, n) => {
          const y = 148 + n * 116;
          return `
            ${card(60, y, 520, 92)}
            ${text(320, y + 52, L.items[i].q, { size: 21, fill: C.ink, wrap: [480, 2] })}
            <path d="M596 ${y + 46} H664 M654 ${y + 36} L666 ${y + 46} L654 ${y + 56}" stroke="${accent[n]}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(680, y, 460, 92, { stroke: accent[n], fill: "#0f1e36" })}
            ${text(910, y + 52, L.items[i].a, { size: 22, weight: 650, fill: "#ffffff", wrap: [420, 2] })}
          `;
        }).join("")}
      `);
    },
  },

  /* Three bands: built in, conditional, out of reach. */
  reach: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const band = (y, col, ink, fill, label, names) => {
        const n = names.length;
        const w = n === 1 ? 740 : 230;
        return `${card(60, y, 300, 120, { stroke: col, fill })}
          ${text(210, y + 66, label, { size: 22, weight: 700, fill: ink, wrap: [260, 3], lh: 1.25 })}
          ${names.map((name, i) => {
            const x = 400 + i * 255;
            return `${card(x, y + 18, w, 84, { stroke: col, fill: "#0f1e36" })}
              ${text(x + w / 2, y + 68, name, { size: 23, weight: 650, fill: "#ffffff", fit: w - 30 })}`;
          }).join("")}`;
      };
      return frame(1200, 620, `
        ${text(600, 66, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${band(142, C.green, C.greenInk, "#0d1f17", L.yes, [L.d0, L.d1, L.d2])}
        ${band(292, C.amber, C.amberInk, "#1a1508", L.cond, [L.d3])}
        ${band(442, C.red, C.redInk, "#221014", L.no, [L.d4, L.d5, L.d6])}
      `);
    },
  },
};
