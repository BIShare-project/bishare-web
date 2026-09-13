import { C, frame, text, logo, card, phone, beam } from "./kit.mjs";

export const ns = "androidToIphone";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${phone(250, 130, { kind: "android", accent: C.green, label: L.left })}
      ${phone(805, 130, { kind: "iphone", label: L.right })}
      ${beam(420, 780, 265)}
      <g transform="translate(548,213)">
        <rect width="104" height="104" rx="16" fill="#0f1e36" stroke="${C.blue}" stroke-width="2.5"/>
        <g fill="${C.blue}">
          <rect x="16" y="16" width="26" height="26" rx="4"/><rect x="62" y="16" width="26" height="26" rx="4"/><rect x="16" y="62" width="26" height="26" rx="4"/>
          <rect x="62" y="62" width="10" height="10"/><rect x="78" y="70" width="10" height="10"/><rect x="66" y="80" width="8" height="8"/>
        </g>
        <g fill="#0f1e36"><rect x="23" y="23" width="12" height="12"/><rect x="69" y="23" width="12" height="12"/><rect x="23" y="69" width="12" height="12"/></g>
      </g>
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Google's published limits for the Quick Share QR code, as stat tiles. */
  qr: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L, locale) => {
      const gb = { fr: "Go", ru: "ГБ" }[locale] ?? "GB";
      const hours = { de: "24 Std.", id: "24 jam", ru: "24 ч", ar: "24 ساعة", hi: "24 घंटे", ja: "24時間", ko: "24시간", "zh-Hans": "24小时", "zh-Hant": "24小時" }[locale] ?? "24 h";
      const tiles = [
        { v: `10 ${gb}`, k: "t0", color: C.blue },
        { v: new Intl.NumberFormat(`${locale}-u-nu-latn`).format(1000), k: "t1", color: C.blue },
        { v: "20", k: "t2", color: C.blue },
        { v: hours, k: "t3", color: C.amber, rtl: locale === "ar" },
      ];
      const flags = [
        { k: "f0", color: C.green, ok: true },
        { k: "f1", color: C.green, ok: true },
        { k: "f2", color: C.amber, ok: false },
      ];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${tiles.map((t, n) => {
          const x = 60 + n * 275;
          return `${card(x, 140, 255, 190, { stroke: t.color, fill: "#0f1e36" })}
            ${text(x + 127, 222, t.v, { size: 48, weight: 760, fill: "#ffffff", ltr: !t.rtl, fit: 220 })}
            ${text(x + 127, 280, L[t.k], { size: 17, fill: C.sub, wrap: [220, 2], lh: 1.25 })}`;
        }).join("")}
        ${flags.map((f, n) => {
          const y = 370 + n * 64;
          return `${card(60, y, 1080, 50, { stroke: C.line })}
            <circle cx="96" cy="${y + 25}" r="11" fill="${f.color}" fill-opacity="0.2" stroke="${f.color}" stroke-width="2"/>
            ${f.ok ? `<path d="M90 ${y + 25} l4 4 l8 -8" stroke="${f.color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : `<path d="M96 ${y + 18} v8 M96 ${y + 31} v1" stroke="${f.color}" stroke-width="2.5" stroke-linecap="round"/>`}
            ${text(620, y + 32, L[f.k], { size: 19, fill: C.ink, fit: 980 })}`;
        }).join("")}
        ${text(600, 584, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Switching to a new iPhone: two paths in, what comes across, what doesn't. */
  migrate: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const path = (x, color, title, a, b) => `${card(x, 140, 530, 150, { stroke: color, fill: "#0f1e36" })}
        ${text(x + 265, 186, title, { size: 23, weight: 700, fill: "#ffffff", fit: 490 })}
        ${text(x + 265, 228, a, { size: 18, fill: C.ink, fit: 490 })}
        ${text(x + 265, 262, b, { size: 17, fill: C.sub, fit: 490 })}`;
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${path(60, C.green, L.newTitle, L.new1, L.new2)}
        ${path(610, C.blue, L.oldTitle, L.old1, L.old2)}
        ${card(60, 312, 1080, 160, { stroke: C.green, fill: "#0c1f22" })}
        ${text(600, 350, L.movesTitle, { size: 20, weight: 700, fill: C.greenInk, fit: 1000 })}
        ${text(600, 414, L.moves, { size: 18, fill: C.ink, wrap: [1000, 3], lh: 1.4 })}
        ${card(60, 488, 1080, 84, { stroke: C.red, fill: "#221418" })}
        ${text(600, 521, L.manualTitle, { size: 18, weight: 700, fill: C.redInk, fit: 1000 })}
        ${text(600, 554, L.manual, { size: 17, fill: C.ink, fit: 1000 })}
      `);
    },
  },

  /* Where a received file ends up on the iPhone, per route. */
  landing: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const lanes = [
        { k: "a", color: C.green },
        { k: "b", color: C.amber },
        { k: "c", color: C.blue },
      ];
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${lanes.map((ln, n) => {
          const x = 60 + n * 366;
          const Lk = L[ln.k];
          return `${card(x, 140, 348, 96, { stroke: ln.color, fill: "#0f1e36" })}
            ${text(x + 174, 196, Lk.route, { size: 21, weight: 700, fill: "#ffffff", wrap: [310, 2], lh: 1.15 })}
            <path d="M${x + 174} 244 V282 M${x + 164} 272 L${x + 174} 284 L${x + 184} 272" stroke="${ln.color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(x, 292, 348, 96, { stroke: C.line })}
            ${text(x + 174, 348, Lk.place, { size: 21, weight: 640, fill: C.ink, wrap: [310, 2], lh: 1.15 })}
            ${card(x, 406, 348, 170, { stroke: C.line, fill: "#0b1628" })}
            ${text(x + 174, 492, Lk.tip, { size: 17, fill: C.sub, wrap: [310, 5], lh: 1.3 })}`;
        }).join("")}
      `);
    },
  },
};
