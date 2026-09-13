import { C, frame, text, logo, card, browser, beam } from "./kit.mjs";

export const ns = "snapdropAlt";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 48)}
      ${browser(110, 170, { label: L.left })}
      ${browser(790, 170, { accent: C.green, label: L.right })}
      ${beam(430, 770, 268)}
      ${text(600, 520, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 568, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Then and now: what changed about Snapdrop, row by row. */
  status: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const rows = ["owner", "site", "code", "selfhost"];
      const tone = { owner: [C.dim, C.amber], site: [C.green, C.green], code: [C.green, C.red], selfhost: [C.green, C.green] };
      return frame(1200, 620, `
        ${text(600, 66, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 136, 1080, 440)}
        ${text(230, 186, L.colRow, { size: 17, weight: 600, fill: C.dim, fit: 300 })}
        ${text(585, 186, L.colThen, { size: 19, weight: 650, fill: "#bcd4fb", fit: 330 })}
        ${text(935, 186, L.colNow, { size: 19, weight: 650, fill: "#ffffff", fit: 330 })}
        <path d="M60 210 H1140" stroke="${C.line}" stroke-width="2"/>
        ${rows.map((r, n) => {
          const y = 262 + n * 88;
          const [a, b] = tone[r];
          const pill = (cx, color, label) => `<rect x="${cx - 165}" y="${y - 30}" width="330" height="56" rx="14" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-opacity="0.55" stroke-width="1.5"/>${text(cx, y + 3, label, { size: 18, weight: 600, fill: C.ink, wrap: [300, 2], lh: 1.2 })}`;
          return `${n ? `<path d="M90 ${y - 44} H1110" stroke="${C.line}" stroke-width="1"/>` : ""}
            ${text(230, y + 3, L.rows[r].label, { size: 20, weight: 620, fill: C.ink, wrap: [290, 2], lh: 1.2 })}
            ${pill(585, a, L.rows[r].then)}
            ${pill(935, b, L.rows[r].now)}`;
        }).join("")}
      `);
    },
  },

  /* Situation chooser, six rows. */
  choose: {
    mirror: true,
    w: 1200, h: 860,
    draw: (L) => {
      const ids = ["0", "1", "2", "3", "4", "5"];
      const accent = [C.blue, C.green, C.blue, C.amber, C.blue, C.dim];
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

  /* Where the time goes: tab, installed app, internet link. */
  lanes: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const lanes = [
        { k: "tab", color: C.amber, fill: 0.55 },
        { k: "app", color: C.green, fill: 0.92 },
        { k: "link", color: C.blue, fill: 0.2 },
      ];
      return frame(1200, 600, `
        ${text(600, 66, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${lanes.map((ln, n) => {
          const y = 140 + n * 148;
          return `${card(60, y, 1080, 124)}
            ${text(250, y + 50, L[ln.k].name, { size: 23, weight: 660, fill: "#ffffff", wrap: [340, 2], lh: 1.15 })}
            ${text(250, y + 92, L[ln.k].examples, { size: 16, fill: C.dim, fit: 340 })}
            <rect x="460" y="${y + 30}" width="640" height="18" rx="9" fill="#0a1426" stroke="${C.line}"/>
            <rect x="460" y="${y + 30}" width="${640 * ln.fill}" height="18" rx="9" fill="${ln.color}" fill-opacity="0.8"/>
            ${text(780, y + 88, L[ln.k].note, { size: 18, fill: C.ink, wrap: [620, 2], lh: 1.2 })}`;
        }).join("")}
        ${text(600, 578, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },
};
