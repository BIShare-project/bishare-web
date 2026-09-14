import { C, frame, text, logo, card, phone, laptop } from "./kit.mjs";

export const ns = "encryptedTransfer";

const PURPLE = "#a78bfa";

const padlock = (cx, cy, col, s = 1) => `
  <g transform="translate(${cx},${cy}) scale(${s})">
    <path d="M-16 -4 v-12 a16 16 0 0 1 32 0 v12" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>
    <rect x="-24" y="-6" width="48" height="38" rx="8" fill="${col}"/>
    <circle cx="0" cy="10" r="5" fill="#0b1628"/>
  </g>`;

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 30)}
      ${laptop(90, 160, { os: "mac", accent: C.blue, label: L.left })}
      ${phone(935, 110, { kind: "iphone", accent: C.green, label: L.right })}
      <path d="M410 250 H500" stroke="${C.blue}" stroke-width="3.5" stroke-dasharray="10 8"/>
      <path d="M700 250 H920" stroke="${C.green}" stroke-width="3.5" stroke-dasharray="10 8"/>
      ${card(500, 170, 200, 170, { stroke: C.line, fill: "#0f1e36", r: 18 })}
      ${text(600, 205, L.server, { size: 20, weight: 650, fill: C.sub, fit: 170 })}
      ${[0, 1, 2, 3].map((i) => `<text x="600" y="${240 + i * 24}" font-size="17" font-family="ui-monospace, Menlo, monospace" fill="${C.dim}" text-anchor="middle">${["9f3a·c1e0·77b2", "0d4e·a9f1·3c68", "b7c2·5e0a·e91d", "4a8f·d23b·06ce"][i]}</text>`).join("")}
      ${padlock(455, 250, C.amber, 0.9)}
      ${padlock(810, 250, C.amber, 0.9)}
      ${text(600, 548, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 596, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Who can read the file under each kind of encryption. */
  levels: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [470, 640, 810, 1010];
      const grid = [
        ["cannot", "can", "can", "can"],
        ["cannot", "cannot", "can", "can"],
        ["cannot", "cannot", "cannot", "can"],
      ];
      const tone = [C.blue, C.amber, C.green];
      const chip = (cx, cy, k) => {
        const good = k === "cannot";
        const col = good ? C.green : C.red;
        const ink = good ? C.greenInk : C.redInk;
        return `<rect x="${cx - 76}" y="${cy - 21}" width="152" height="42" rx="21" fill="${col}" fill-opacity="0.13" stroke="${col}" stroke-width="2"/>
          ${text(cx, cy + 7, L[k], { size: 17, weight: 650, fill: ink, fit: 136 })}`;
      };
      return frame(1200, 600, `
        ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(50, 118, 1100, 440, { stroke: C.line, fill: "#0b1628" })}
        ${text(cols[0], 170, L.colNet, { size: 17, weight: 700, fill: C.sub, wrap: [150, 2], lh: 1.2 })}
        ${text(cols[1], 170, L.colDisk, { size: 17, weight: 700, fill: C.sub, wrap: [150, 2], lh: 1.2 })}
        ${text(cols[2], 170, L.colProvider, { size: 17, weight: 700, fill: C.sub, wrap: [150, 2], lh: 1.2 })}
        ${text(cols[3], 170, L.colEnds, { size: 17, weight: 700, fill: "#ffffff", wrap: [200, 2], lh: 1.2 })}
        ${grid.map((row, i) => {
          const y = 275 + i * 105;
          return `<path d="M70 ${y - 52} H1130" stroke="${C.line}" stroke-width="1.5"/>
            <rect x="80" y="${y - 30}" width="6" height="60" rx="3" fill="${tone[i]}"/>
            ${text(235, y + 8, L["r" + i], { size: 22, weight: 700, fill: "#ffffff", wrap: [270, 2], lh: 1.2 })}
            ${row.map((k, j) => j === 3 ? `<rect x="${cols[3] - 76}" y="${y - 21}" width="152" height="42" rx="21" fill="${C.blue}" fill-opacity="0.13" stroke="${C.blue}" stroke-width="2"/>${text(cols[3], y + 7, L.can, { size: 17, weight: 650, fill: "#bcd4fb", fit: 136 })}` : chip(cols[j], y, k)).join("")}`;
        }).join("")}
      `);
    },
  },

  /* The URL fragment keeps the key in the browser. */
  fragment: {
    mirror: false,
    w: 1200, h: 600,
    draw: (L) => frame(1200, 600, `
      ${text(600, 58, L.title, { size: 32, weight: 660, fit: 1080 })}
      ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
      ${card(70, 150, 1060, 90, { stroke: C.line, fill: "#0b1628", r: 18 })}
      <text x="110" y="208" font-size="30" font-family="ui-monospace, Menlo, monospace" fill="#bcd4fb" direction="ltr">bishare.app/s/aZ81qK</text>
      <text x="530" y="208" font-size="30" font-family="ui-monospace, Menlo, monospace" fill="${C.amberInk}" direction="ltr">#k=q3Vt9…Xa0</text>
      <path d="M110 256 H500" stroke="${C.blue}" stroke-width="4" stroke-linecap="round"/>
      <path d="M530 256 H760" stroke="${C.amber}" stroke-width="4" stroke-linecap="round"/>
      ${text(305, 292, L.sent, { size: 20, weight: 650, fill: "#bcd4fb", fit: 380 })}
      ${text(645, 292, L.kept, { size: 20, weight: 650, fill: C.amberInk, fit: 300 })}
      ${padlock(645, 350, C.amber, 0.8)}
      ${text(645, 410, L.keyLabel, { size: 18, fill: C.sub, fit: 260 })}
      <path d="M305 312 V380" stroke="${C.blue}" stroke-width="3" stroke-dasharray="7 6"/>
      ${card(170, 385, 270, 70, { stroke: C.blue, fill: "#0c1a31", r: 14 })}
      ${[0, 1].map((i) => `<text x="305" y="${413 + i * 26}" font-size="16" font-family="ui-monospace, Menlo, monospace" fill="${C.dim}" text-anchor="middle">${["0x9f3ac1e077b2…", "0x0d4ea9f13c68…"][i]}</text>`).join("")}
      ${text(305, 490, L.stored, { size: 19, weight: 600, fill: C.ink, fit: 400 })}
      ${card(830, 385, 300, 90, { stroke: C.red, fill: "#1f0f14", r: 14 })}
      ${text(980, 436, L.warn, { size: 18, weight: 650, fill: C.redInk, wrap: [270, 2], lh: 1.25 })}
    `),
  },

  /* Hidden versus often-visible metadata. */
  visible: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => frame(1200, 600, `
      ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
      ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
      ${card(60, 130, 460, 420, { stroke: C.green, fill: "#0d2418", r: 22 })}
      ${card(560, 130, 580, 420, { stroke: C.amber, fill: "#1a1508", r: 22 })}
      ${text(290, 180, L.hidden, { size: 26, weight: 700, fill: C.greenInk, fit: 400 })}
      ${text(850, 180, L.shown, { size: 26, weight: 700, fill: C.amberInk, fit: 520 })}
      ${padlock(290, 300, C.green, 1.6)}
      ${text(290, 420, L.h0, { size: 26, weight: 700, fill: "#ffffff", fit: 400 })}
      ${[0, 1, 2, 3].map((i) => {
        const y = 240 + i * 78;
        return `${card(600, y - 30, 500, 60, { stroke: C.line, fill: "#0f1e36", r: 14 })}
          <circle cx="640" cy="${y}" r="10" fill="${C.amber}"/>
          ${text(870, y + 8, L["s" + i], { size: 21, weight: 600, fill: C.ink, fit: 400 })}`;
      }).join("")}
    `),
  },
};
