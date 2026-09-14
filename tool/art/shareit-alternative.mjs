import { C, frame, text, logo, card, laptop, phone } from "./kit.mjs";

export const ns = "shareitAlt";

const PURPLE = "#a78bfa";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 30)}
      ${phone(300, 110, { kind: "android", accent: C.green, label: L.left })}
      ${laptop(640, 150, { os: "win", accent: C.blue, label: L.right })}
      <path d="M462 250 C 540 214, 600 214, 660 242" stroke="${C.green}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M644 232 L662 243 L648 258" stroke="${C.green}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(150,118)" opacity="0.9">
        <rect width="110" height="56" rx="10" fill="#2a1a08" stroke="${C.amber}" stroke-width="2" stroke-dasharray="6 5"/>
        ${text(55, 37, L.ad, { size: 24, weight: 800, fill: C.amberInk, fit: 90 })}
        <path d="M8 50 L102 6" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g transform="translate(1000,120)" opacity="0.9">
        <rect width="110" height="56" rx="10" fill="#2a1a08" stroke="${C.amber}" stroke-width="2" stroke-dasharray="6 5"/>
        ${text(55, 37, L.ad, { size: 24, weight: 800, fill: C.amberInk, fit: 90 })}
        <path d="M8 50 L102 6" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
      </g>
      ${text(600, 548, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 596, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Google Play labels as a two-column table. */
  labels: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const rows = [
        { n: "SHAREit", ads: "yes", enc: "no" },
        { n: "SHAREit Premium", ads: "no", enc: "no" },
        { n: "Xender", ads: "yes", enc: "yes" },
        { n: "Send Anywhere", ads: "yes", enc: "yes" },
        { n: "LocalSend", ads: "no", enc: "nd" },
      ];
      const chip = (cx, cy, kind, good) => {
        const col = kind === "nd" ? C.dim : good ? C.green : C.red;
        const ink = kind === "nd" ? C.sub : good ? C.greenInk : C.redInk;
        return `<rect x="${cx - 95}" y="${cy - 22}" width="190" height="44" rx="22" fill="${col}" fill-opacity="0.13" stroke="${col}" stroke-width="2"/>
          ${text(cx, cy + 7, L[kind], { size: 19, weight: 650, fill: ink, fit: 170 })}`;
      };
      const c1 = 760, c2 = 1000;
      return frame(1200, 600, `
        ${text(600, 62, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 100, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 124, 1080, 410, { stroke: C.line, fill: "#0b1628" })}
        ${text(c1, 166, L.colAds, { size: 19, weight: 700, fill: "#ffffff", fit: 220 })}
        ${text(c2, 166, L.colEnc, { size: 19, weight: 700, fill: "#ffffff", fit: 220 })}
        ${rows.map((r, i) => {
          const y = 222 + i * 66;
          return `<path d="M80 ${y - 33} H1120" stroke="${C.line}" stroke-width="1.5"/>
            ${text(340, y + 8, r.n, { size: 22, weight: 650, fill: C.ink, fit: 440, ltr: true })}
            ${chip(c1, y, r.ads, r.ads === "no")}
            ${chip(c2, y, r.enc, r.enc === "yes")}`;
        }).join("")}
        ${text(600, 566, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Base APK plus splits, and what happens when only the base is sent. */
  apk: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const pieces = [L.s1, L.s2, L.s3];
      return frame(1200, 600, `
        ${text(600, 62, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 100, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 140, 520, 380, { stroke: C.line, fill: "#0b1628" })}
        ${card(90, 170, 460, 110, { stroke: C.green, fill: "#0c1f22" })}
        ${text(320, 236, L.base, { size: 26, weight: 700, fill: "#ffffff", fit: 420 })}
        ${text(320, 318, L.splits, { size: 20, weight: 650, fill: C.amberInk, fit: 440 })}
        ${pieces.map((p, i) => {
          const x = 90 + i * 158;
          return `<rect x="${x}" y="340" width="144" height="150" rx="12" fill="#1a1508" stroke="${C.amber}" stroke-width="2" stroke-dasharray="7 6"/>
            ${text(x + 72, 422, p, { size: 18, weight: 600, fill: C.ink, wrap: [124, 3], lh: 1.25 })}`;
        }).join("")}
        <path d="M600 330 H700 M688 318 L702 330 L688 342" stroke="${C.blue}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${text(650, 378, L.sent, { size: 15, weight: 600, fill: C.sub, wrap: [104, 3], lh: 1.2 })}
        ${card(720, 160, 420, 150, { stroke: C.green, fill: "#0c1f22" })}
        <circle cx="930" cy="206" r="20" fill="${C.green}" fill-opacity="0.18" stroke="${C.green}" stroke-width="2.5"/>
        <path d="M921 206 l6 6 l12 -13" stroke="${C.green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${text(930, 268, L.ok, { size: 21, weight: 650, fill: C.greenInk, fit: 380 })}
        ${card(720, 350, 420, 150, { stroke: C.amber, fill: "#1a1508" })}
        <path d="M930 378 L952 416 H908 Z" fill="none" stroke="${C.amber}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M930 392 V404 M930 410 V411" stroke="${C.amber}" stroke-width="3" stroke-linecap="round"/>
        ${text(930, 458, L.risk, { size: 21, weight: 650, fill: C.amberInk, fit: 380 })}
        ${text(600, 566, L.foot, { size: 17, fill: C.sub, fit: 1080 })}
      `);
    },
  },

  /* The phone at the centre, five destinations around it. */
  hub: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cx = 600, cy = 300;
      const nodes = [
        { k: 0, x: 50, y: 130, color: C.green },
        { k: 1, x: 820, y: 130, color: C.blue },
        { k: 2, x: 50, y: 350, color: PURPLE },
        { k: 3, x: 820, y: 350, color: C.amber },
        { k: 4, x: 435, y: 470, color: C.blueDeep },
      ];
      return frame(1200, 600, `
        ${text(600, 56, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${nodes.map((n) => `<path d="M${cx} ${cy} L${n.x + 165} ${n.y + 48}" stroke="${n.color}" stroke-opacity="0.55" stroke-width="2.5" stroke-dasharray="7 7"/>`).join("")}
        <circle cx="${cx}" cy="${cy}" r="74" fill="#0f1e36" stroke="${C.green}" stroke-width="3"/>
        ${text(cx, cy + 8, L.center, { size: 20, weight: 700, fill: "#ffffff", wrap: [120, 2] })}
        ${nodes.map((n) => `${card(n.x, n.y, 330, 96, { stroke: n.color, fill: "#0b1628" })}
          ${text(n.x + 165, n.y + 38, L["d" + n.k], { size: 20, weight: 700, fill: "#ffffff", fit: 300 })}
          ${text(n.x + 165, n.y + 72, L["p" + n.k], { size: 17, fill: C.ink, fit: 306 })}`).join("")}
      `);
    },
  },
};
