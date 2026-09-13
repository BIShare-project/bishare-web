import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "phoneToPc";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${phone(120, 138, { kind: "android", accent: C.green })}
      ${phone(285, 118, { kind: "iphone" })}
      ${text(282, 455, L.left, { size: 24, weight: 620, fill: "#bcd4fb", fit: 300 })}
      ${beam(460, 790, 250)}
      ${laptop(800, 150, { os: "win", label: L.right })}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* The job decides the route: four content types, each with its best route. */
  types: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const rows = [
        { t: "t0", r: "r0", color: C.blue, icon: "photo" },
        { t: "t1", r: "r1", color: C.green, icon: "stack" },
        { t: "t2", r: "r2", color: C.amber, icon: "video" },
        { t: "t3", r: "r3", color: "#a78bfa", icon: "doc" },
      ];
      const glyph = (kind, cx, cy, c) => ({
        photo: `<rect x="${cx - 22}" y="${cy - 17}" width="44" height="34" rx="6" fill="none" stroke="${c}" stroke-width="3"/><circle cx="${cx - 8}" cy="${cy - 5}" r="4" fill="${c}"/><path d="M${cx - 18} ${cy + 12} L${cx - 4} ${cy + 1} L${cx + 6} ${cy + 8} L${cx + 12} ${cy + 3} L${cx + 19} ${cy + 12}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`,
        stack: `<rect x="${cx - 16}" y="${cy - 20}" width="36" height="28" rx="5" fill="none" stroke="${c}" stroke-width="3" opacity="0.5"/><rect x="${cx - 22}" y="${cy - 12}" width="36" height="28" rx="5" fill="#0f1e36" stroke="${c}" stroke-width="3"/>`,
        video: `<rect x="${cx - 22}" y="${cy - 18}" width="44" height="36" rx="5" fill="none" stroke="${c}" stroke-width="3"/><path d="M${cx - 22} ${cy - 8} H${cx + 22} M${cx - 22} ${cy + 8} H${cx + 22}" stroke="${c}" stroke-width="2.5"/><g fill="${c}"><rect x="${cx - 17}" y="${cy - 15}" width="5" height="4" rx="1"/><rect x="${cx - 2.5}" y="${cy - 15}" width="5" height="4" rx="1"/><rect x="${cx + 12}" y="${cy - 15}" width="5" height="4" rx="1"/><rect x="${cx - 17}" y="${cy + 11}" width="5" height="4" rx="1"/><rect x="${cx - 2.5}" y="${cy + 11}" width="5" height="4" rx="1"/><rect x="${cx + 12}" y="${cy + 11}" width="5" height="4" rx="1"/></g>`,
        doc: `<path d="M${cx - 15} ${cy - 21} H${cx + 7} L${cx + 17} ${cy - 11} V${cy + 21} H${cx - 15} Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M${cx - 8} ${cy - 2} H${cx + 10} M${cx - 8} ${cy + 8} H${cx + 10}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
      })[kind];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, n) => {
          const y = 136 + n * 100;
          return `${card(60, y, 1080, 86, { stroke: r.color, fill: "#0f1e36" })}
            ${glyph(r.icon, 112, y + 43, r.color)}
            ${text(310, y + 51, L[r.t], { size: 23, weight: 700, fill: "#ffffff", fit: 300 })}
            <path d="M470 ${y + 43} H520 M508 ${y + 33} L520 ${y + 43} L508 ${y + 53}" stroke="${r.color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${text(820, y + 51, L[r.r], { size: 20, weight: 560, fill: C.ink, wrap: [560, 2], lh: 1.2 })}`;
        }).join("")}
        ${text(600, 574, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Where files end up on each desktop OS. */
  landing: {
    mirror: true,
    w: 1200, h: 560,
    draw: (L) => {
      const col = (x, title, color, rows) => `${card(x, 132, 340, 50, { stroke: color, fill: "#0f1e36" })}
        ${text(x + 170, 165, title, { size: 21, weight: 700, fill: "#ffffff", fit: 300 })}
        ${rows.map(([route, place], n) => {
          const y = 198 + n * 110;
          return `${card(x, y, 340, 96, { stroke: C.line, fill: "#0b1628" })}
            ${text(x + 170, y + 36, route, { size: 16, fill: C.sub, fit: 300 })}
            ${text(x + 170, y + 70, place, { size: 20, weight: 680, fill: "#ffffff", wrap: [310, 2], lh: 1.15 })}`;
        }).join("")}`;
      return frame(1200, 560, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${col(60, L.win, C.blue, [[L.w0, L.w0p], [L.w1, L.w1p], [L.w2, L.w2p]])}
        ${col(430, L.mac, "#cbd5e1", [[L.m0, L.m0p], [L.m1, L.m1p], [L.m2, L.m2p]])}
        ${col(800, L.linux, C.amber, [[L.l0, L.l0p], [L.l1, L.l1p], [L.l2, L.l2p]])}
      `);
    },
  },

  /* Format surprises on Windows: source, what arrives, the fix. */
  formats: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const lanes = [
        { k: "a", color: C.blue },
        { k: "b", color: C.amber },
        { k: "c", color: C.green },
      ];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${lanes.map((ln, n) => {
          const x = 60 + n * 366;
          const Lk = L[ln.k];
          return `${card(x, 138, 348, 76, { stroke: ln.color, fill: "#0f1e36" })}
            ${text(x + 174, 184, Lk.from, { size: 21, weight: 700, fill: "#ffffff", fit: 310 })}
            <path d="M${x + 174} 222 V256 M${x + 164} 246 L${x + 174} 258 L${x + 184} 246" stroke="${ln.color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(x, 266, 348, 76, { stroke: C.line })}
            ${text(x + 174, 312, Lk.what, { size: 22, weight: 680, fill: C.ink, fit: 310 })}
            ${card(x, 360, 348, 200, { stroke: C.line, fill: "#0b1628" })}
            ${text(x + 174, 460, Lk.fix, { size: 20, fill: C.sub, wrap: [310, 6], lh: 1.3 })}`;
        }).join("")}
      `);
    },
  },
};
