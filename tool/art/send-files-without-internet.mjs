import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "offlineTransfer";

const PURPLE = "#a78bfa";

/* A cloud outline with a slash through it, centred on (cx, cy). */
function noCloud(cx, cy, label) {
  return `<g transform="translate(${cx},${cy})">
    <path d="M-70 20 a26 26 0 0 1 8 -50 a36 36 0 0 1 68 -18 a30 30 0 0 1 56 20 a24 24 0 0 1 -6 48 Z"
      fill="#15122a" stroke="${C.red}" stroke-opacity="0.9" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-62 26 L66 -52" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
    ${text(0, 58, label, { size: 18, weight: 650, fill: C.redInk, fit: 200 })}
  </g>`;
}

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${phone(230, 150, { kind: "android", accent: C.green, label: L.left })}
      ${beam(400, 780, 290)}
      ${laptop(800, 180, { os: "win", label: L.right })}
      ${noCloud(600, 150, L.cloud)}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Three situations as nested bands, widest at the bottom. */
  modes: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const zones = [
        { k: "z1", apps: "z1apps", color: C.green, y: 140 },
        { k: "z2", apps: "z2apps", color: C.blue, y: 280 },
        { k: "z3", apps: "z3apps", color: PURPLE, y: 420 },
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

  /* Five device pairs stacked as rows: pair on one side, route on the other. */
  pairs: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const rows = [
        { k: "a", color: C.blue },
        { k: "b", color: C.green },
        { k: "c", color: C.amber },
        { k: "d", color: PURPLE },
        { k: "e", color: C.blue },
      ];
      return frame(1200, 640, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, i) => {
          const y = 134 + i * 96;
          const Lr = L[r.k];
          return `${card(60, y, 430, 78, { stroke: r.color, fill: "#0f1e36" })}
            ${text(275, y + 47, Lr.need, { size: 21, weight: 700, fill: "#ffffff", fit: 390 })}
            <path d="M502 ${y + 39} H622 M610 ${y + 29} L624 ${y + 39} L610 ${y + 49}" stroke="${r.color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(638, y, 502, 78, { stroke: C.line, fill: "#0b1628" })}
            ${text(889, y + 47, Lr.pick, { size: 19, weight: 600, fill: C.ink, fit: 460 })}`;
        }).join("")}
      `);
    },
  },

  /* Speed ladder, log scale: six routes as horizontal bars. */
  speed: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      // MB/s values plotted on log10 between 0.1 and 300.
      const rows = [
        { k: "bt", v: "btv", mbs: 0.3, color: C.red, ink: C.redInk },
        { k: "wifi24", v: "wifi24v", mbs: 5, color: C.amber, ink: C.amberInk },
        { k: "usb2", v: "usb2v", mbs: 35, color: C.blue, ink: "#bcd4fb" },
        { k: "wifi5", v: "wifi5v", mbs: 45, color: C.blue, ink: "#bcd4fb" },
        { k: "wifi6", v: "wifi6v", mbs: 90, color: C.green, ink: C.greenInk },
        { k: "usb3", v: "usb3v", mbs: 150, color: C.green, ink: C.greenInk },
      ];
      const x0 = 400, x1 = 1120;
      const px = (mbs) => x0 + ((Math.log10(mbs) - Math.log10(0.1)) / (Math.log10(300) - Math.log10(0.1))) * (x1 - x0);
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 128, 1080, 430, { stroke: C.line, fill: "#0b1628" })}
        ${[0.1, 1, 10, 100].map((m) => `<path d="M${px(m)} 146 V540" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="4 6"/>`).join("")}
        ${rows.map((r, i) => {
          const y = 168 + i * 62;
          const w = Math.max(px(r.mbs) - x0, 14);
          // Centred labels only: a centred <text> survives the Arabic mirror
          // without anchor juggling (see transfer-files-between-computers).
          return `${text(230, y + 24, L[r.k], { size: 19, weight: 650, fill: C.ink, fit: 300 })}
            <rect x="${x0}" y="${y}" width="${w}" height="36" rx="8" fill="${r.color}" fill-opacity="0.22" stroke="${r.color}" stroke-width="2"/>
            ${w > 300
              ? text(x0 + w / 2, y + 24, L[r.v], { size: 16, weight: 700, fill: "#ffffff", fit: w - 24, ltr: true })
              : text(x0 + w + 150, y + 24, L[r.v], { size: 16, weight: 600, fill: r.ink, fit: 280, ltr: true })}`;
        }).join("")}
        ${text(600, 596, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },
};
