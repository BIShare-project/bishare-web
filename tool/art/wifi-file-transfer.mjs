import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "wifiTransfer";

/* Three arcs and a dot: the Wi-Fi mark, centred on (cx, cy). */
const wifi = (cx, cy, col, s = 1) => `<g fill="none" stroke="${col}" stroke-width="${5 * s}" stroke-linecap="round">
    <path d="M${cx - 34 * s} ${cy - 14 * s} Q ${cx} ${cy - 46 * s} ${cx + 34 * s} ${cy - 14 * s}"/>
    <path d="M${cx - 22 * s} ${cy - 2 * s} Q ${cx} ${cy - 24 * s} ${cx + 22 * s} ${cy - 2 * s}"/>
    <path d="M${cx - 10 * s} ${cy + 10 * s} Q ${cx} ${cy} ${cx + 10 * s} ${cy + 10 * s}"/>
  </g><circle cx="${cx}" cy="${cy + 20 * s}" r="${5 * s}" fill="${col}"/>`;

const node = (x, y, col) => `<rect x="${x - 17}" y="${y - 24}" width="34" height="48" rx="7" fill="#101d36" stroke="${col}" stroke-width="2.5"/>`;

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 40)}
      ${phone(250, 120, { kind: "android", label: L.left })}
      ${laptop(660, 150, { os: "win", accent: C.green, label: L.right })}
      ${beam(410, 670, 262)}
      ${wifi(540, 150, C.blue, 0.9)}
      ${text(600, 528, L.title, { size: 54, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 578, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* The three things "over Wi-Fi" can mean. */
  paths: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [C.green, C.blue, C.amber];
      const inks = [C.greenInk, "#bcd4fb", C.amberInk];
      const diagram = (x, n) => {
        const a = x + 70, b = x + 270, y = 222, col = cols[n];
        if (n === 0) return `${node(a, y, col)}${node(b, y, col)}
          <rect x="${x + 146}" y="${y - 12}" width="48" height="24" rx="6" fill="#101d36" stroke="${col}" stroke-width="2.5"/>
          ${wifi(x + 170, y - 44, col, 0.5)}
          <path d="M${a + 22} ${y} H${x + 142} M${x + 198} ${y} H${b - 22}" stroke="${col}" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/>`;
        if (n === 1) return `${node(a, y, col)}${node(b, y, col)}
          <path d="M${a + 24} ${y - 8} H${b - 24} M${b - 36} ${y - 18} L${b - 24} ${y - 8} L${b - 36} ${y + 2}" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M${b - 24} ${y + 12} H${a + 24} M${a + 36} ${y + 2} L${a + 24} ${y + 12} L${a + 36} ${y + 22}" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.6"/>`;
        return `${node(a, y + 14, col)}${node(b, y + 14, col)}
          <path d="M${x + 138} ${y - 22} a16 16 0 0 1 28 -12 a20 20 0 0 1 38 6 a14 14 0 0 1 -4 28 h-52 a14 14 0 0 1 -10 -22 z" fill="#1a1508" stroke="${col}" stroke-width="2.5"/>
          <path d="M${a + 10} ${y - 16} Q ${a + 20} ${y - 40} ${x + 132} ${y - 34}" stroke="${col}" stroke-width="3" fill="none" stroke-dasharray="7 6" stroke-linecap="round"/>
          <path d="M${x + 208} ${y - 34} Q ${b - 20} ${y - 40} ${b - 10} ${y - 16}" stroke="${col}" stroke-width="3" fill="none" stroke-dasharray="7 6" stroke-linecap="round"/>`;
      };
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${[0, 1, 2].map((n) => {
          const x = 60 + n * 370;
          return `${card(x, 140, 340, 300, { stroke: cols[n], fill: "#0f1e36" })}
            ${diagram(x, n)}
            ${text(x + 170, 322, L["p" + n], { size: 25, weight: 700, fill: "#ffffff", fit: 300 })}
            ${text(x + 170, 384, L["p" + n + "d"], { size: 19, fill: inks[n], wrap: [290, 3], lh: 1.3 })}`;
        }).join("")}
        ${card(120, 480, 960, 64, { stroke: C.green, fill: "#0d1f17", r: 32 })}
        ${text(600, 520, L.foot, { size: 19, weight: 600, fill: C.greenInk, fit: 900 })}
      `);
    },
  },

  /* Time for 1 GB per link, on a log scale: a longer bar is a longer wait.
     Labels and values sit centred in fixed columns, so the Arabic mirror
     needs no anchor swap and nothing can run into a bar. */
  speed: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const secs = [12, 25, 65, 210, 2700];
      const cols = [C.green, C.green, C.blue, C.amber, C.red];
      const inks = [C.greenInk, C.greenInk, "#bcd4fb", C.amberInk, C.redInk];
      const width = (s) => Math.round(((Math.log10(s) - 0.8) / (3.5 - 0.8)) * 540);
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${[0, 1, 2, 3, 4].map((n) => {
          const y = 144 + n * 76, w = width(secs[n]);
          return `${text(190, y + 28, L["b" + n], { size: 22, weight: 650, fill: "#ffffff", fit: 270 })}
            <rect x="340" y="${y}" width="560" height="40" rx="10" fill="#0f1e36" stroke="${C.line}" stroke-width="1.5"/>
            <rect x="340" y="${y}" width="${w}" height="40" rx="10" fill="${cols[n]}" fill-opacity="0.3" stroke="${cols[n]}" stroke-width="2"/>
            ${text(1040, y + 28, L["b" + n + "v"], { size: 22, weight: 700, fill: inks[n], fit: 250 })}`;
        }).join("")}
        ${text(600, 560, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Situation chooser, six rows. */
  choose: {
    mirror: true,
    w: 1200, h: 860,
    draw: (L) => {
      const ids = ["0", "1", "2", "3", "4", "5"];
      const accent = [C.green, C.blue, C.amber, C.green, C.blue, C.dim];
      return frame(1200, 860, `
        ${text(600, 70, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 108, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${ids.map((i, n) => {
          const y = 144 + n * 116;
          return `
            <circle cx="92" cy="${y + 46}" r="20" fill="${accent[n]}" fill-opacity="0.16" stroke="${accent[n]}" stroke-width="2"/>
            ${text(92, y + 53, String(n + 1), { size: 19, weight: 700, fill: "#ffffff", ltr: true })}
            ${card(128, y, 500, 92)}
            ${text(378, y + 52, L.items[i].q, { size: 20, fill: C.ink, wrap: [460, 2] })}
            <path d="M640 ${y + 46} H700 M690 ${y + 36} L702 ${y + 46} L690 ${y + 56}" stroke="${accent[n]}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(714, y, 426, 92, { stroke: accent[n], fill: "#0f1e36" })}
            ${text(927, y + 52, L.items[i].a, { size: 21, weight: 640, fill: "#ffffff", wrap: [390, 2] })}
          `;
        }).join("")}
      `);
    },
  },
};
