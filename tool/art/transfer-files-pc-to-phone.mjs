import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "pcToPhone";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${laptop(100, 150, { os: "win", label: L.left })}
      ${beam(430, 770, 250)}
      ${phone(790, 118, { kind: "iphone" })}
      ${phone(955, 138, { kind: "android", accent: C.green })}
      ${text(960, 455, L.right, { size: 24, weight: 620, fill: "#bcd4fb", fit: 300 })}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Built-in routes for the six computer/phone pairings. */
  matrix: {
    mirror: true,
    w: 1200, h: 660,
    draw: (L) => {
      const status = {
        good: { color: C.green, ink: C.greenInk, fill: "#0c1f22" },
        partial: { color: C.amber, ink: C.amberInk, fill: "#221c10" },
        none: { color: C.red, ink: C.redInk, fill: "#221418" },
      };
      const rows = [
        { k: "windows", cells: [["wa", "good"], ["wi", "partial"]] },
        { k: "mac", cells: [["ma", "partial"], ["mi", "good"]] },
        { k: "linux", cells: [["la", "good"], ["li", "none"]] },
      ];
      return frame(1200, 660, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(320, 136, 400, 52, { stroke: C.green, fill: "#0c1f22" })}
        ${text(520, 170, L.android, { size: 21, weight: 700, fill: C.greenInk, fit: 360 })}
        ${card(740, 136, 400, 52, { stroke: C.blue, fill: "#0f1e36" })}
        ${text(940, 170, L.iphone, { size: 21, weight: 700, fill: "#bcd4fb", fit: 360 })}
        ${rows.map((r, n) => {
          const y = 204 + n * 136;
          return `${card(60, y, 244, 122, { stroke: C.line, fill: "#0b1628" })}
            ${text(182, y + 70, L[r.k], { size: 24, weight: 700, fill: "#ffffff", fit: 210 })}
            ${r.cells.map(([key, st], c) => {
              const x = 320 + c * 420;
              const s = status[st];
              return `${card(x, y, 400, 122, { stroke: s.color, fill: s.fill })}
                <rect x="${x + 150}" y="${y + 16}" width="100" height="28" rx="14" fill="${s.color}" fill-opacity="0.16"/>
                ${text(x + 200, y + 36, L[st], { size: 16, weight: 700, fill: s.ink, fit: 90 })}
                ${text(x + 200, y + 82, L[key], { size: 21, weight: 620, fill: C.ink, wrap: [360, 2], lh: 1.2 })}`;
            }).join("")}`;
        }).join("")}
        ${text(600, 634, L.foot, { size: 17, fill: C.sub, fit: 1080 })}
      `);
    },
  },

  /* Largest single file per route, log scale. */
  caps: {
    mirror: true,
    w: 1200, h: 660,
    draw: (L, locale) => {
      const [mb, gb] = { fr: ["Mo", "Go"], ru: ["МБ", "ГБ"] }[locale] ?? ["MB", "GB"];
      const MB = 1, GB = 1024;
      const rows = [
        { k: "email", size: 25 * MB, v: `25 ${mb}`, color: C.dim },
        { k: "phonelink", size: 512 * MB, v: `512 ${mb}`, color: C.amber },
        { k: "chat", size: 2 * GB, v: `2 ${gb}`, color: C.amber },
        { k: "icloud", size: 50 * GB, v: `50 ${gb}`, color: C.blue },
        { k: "link", size: 100 * GB, v: `100 ${gb}`, color: C.green },
        { k: "direct", size: 400 * GB, v: L.noCap, color: C.green, open: true },
      ];
      const x0 = 520, span = 560, lo = Math.log10(10), hi = Math.log10(400 * GB);
      const len = (s) => ((Math.log10(s) - lo) / (hi - lo)) * span;
      return frame(1200, 660, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, n) => {
          const y = 172 + n * 76;
          const w = len(r.size);
          const white = r.color === C.green;
          return `${text(275, y + 7, L[r.k], { size: 20, weight: 600, fill: white ? "#ffffff" : C.ink, wrap: [440, 2], lh: 1.15 })}
            <rect x="${x0}" y="${y - 18}" width="${span}" height="36" rx="18" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="${x0}" y="${y - 18}" width="${w}" height="36" rx="18" fill="${r.color}" fill-opacity="${white ? 0.8 : 0.6}"/>
            ${r.open ? `<path d="M${x0 + span - 30} ${y - 10} L${x0 + span - 14} ${y} L${x0 + span - 30} ${y + 10}" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>` : ""}
            ${w < 170
              ? text(x0 + w + 14, y + 7, `‎${r.v}‎`, { size: 18, weight: 700, fill: C.ink, anchor: "start", ltr: true })
              : r.open
                ? text(x0 + span / 2, y + 7, r.v, { size: 18, weight: 700, fill: "#ffffff", fit: 380 })
                : text(x0 + w - 16, y + 7, `‎${r.v}‎`, { size: 18, weight: 700, fill: "#ffffff", anchor: "end", ltr: true })}`;
        }).join("")}
        ${text(600, 634, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Where the file shows up on each phone. */
  landing: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const col = (x, color, ink, title, items) => `${card(x, 132, 520, 50, { stroke: color, fill: color === C.green ? "#0c1f22" : "#0f1e36" })}
        ${text(x + 260, 165, title, { size: 21, weight: 700, fill: ink, fit: 480 })}
        ${items.map(([route, place], n) => {
          const y = 198 + n * 100;
          return `${card(x, y, 520, 88, { stroke: C.line, fill: "#0b1628" })}
            ${text(x + 260, y + 34, route, { size: 16, fill: C.sub, fit: 480 })}
            ${text(x + 260, y + 66, place, { size: 21, weight: 680, fill: "#ffffff", fit: 480 })}`;
        }).join("")}`;
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${col(60, C.green, C.greenInk, L.androidTitle, [[L.a0, L.a0p], [L.a1, L.a1p], [L.a3, L.a3p], [L.a2, L.a2p]])}
        ${col(620, C.blue, "#bcd4fb", L.iphoneTitle, [[L.i0, L.i0p], [L.i1, L.i1p], [L.i2, L.i2p], [L.i3, L.i3p]])}
      `);
    },
  },
};
