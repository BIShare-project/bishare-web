import { C, frame, text, logo, card, phone, laptop, beam } from "./kit.mjs";

export const ns = "airdropAlt";

const chipRow = (items, x0, y, maxW, color, ink) => {
  // Lays pills left to right, wrapping to the next line; widths estimated
  // from label length and then corrected by data-fit in the browser.
  let x = x0, yy = y, out = "";
  for (const label of items) {
    const w = Math.min(maxW, Math.max(120, label.length * 11 + 40));
    if (x + w > x0 + maxW) { x = x0; yy += 56; }
    out += `<rect x="${x}" y="${yy}" width="${w}" height="42" rx="21" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-opacity="0.55" stroke-width="1.5"/>`;
    out += text(x + w / 2, yy + 28, label, { size: 17, weight: 600, fill: ink, fit: w - 24 });
    x += w + 12;
  }
  return out;
};

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 48)}
      ${phone(200, 140, { kind: "iphone" })}
      ${text(272, 488, L.left, { size: 24, weight: 620, fill: "#bcd4fb", fit: 300 })}
      ${laptop(810, 150, { os: "win", accent: C.green })}
      ${phone(730, 180, { kind: "android", accent: C.green })}
      ${text(930, 488, L.right, { size: 24, weight: 620, fill: C.greenInk, fit: 400 })}
      ${beam(380, 720, 280)}
      ${text(600, 552, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 598, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Who AirDrop reaches after Quick Share's 2026 bridge, and who it still misses. */
  reach: {
    mirror: true,
    w: 1200, h: 700,
    draw: (L) => frame(1200, 700, `
      ${text(600, 66, L.title, { size: 34, weight: 660, fit: 1080 })}
      ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
      ${card(60, 136, 1080, 300, { stroke: C.green, fill: "#0c1f22" })}
      ${text(600, 180, L.yesTitle, { size: 24, weight: 680, fill: C.greenInk, fit: 1000 })}
      ${[L.yes.apple, L.yes.pixel, L.yes.samsung, L.yes.others].map((row, n) =>
        text(600, 232 + n * 52, row, { size: 20, fill: C.ink, fit: 1000, ltr: n > 0 })).join("")}
      ${card(60, 460, 1080, 180, { stroke: C.red, fill: "#221418" })}
      ${text(600, 504, L.noTitle, { size: 24, weight: 680, fill: C.redInk, fit: 1000 })}
      ${text(600, 556, L.no.android, { size: 20, fill: C.ink, fit: 1000 })}
      ${text(600, 604, L.no.rest, { size: 20, fill: C.ink, fit: 1000 })}
      ${text(600, 676, L.note, { size: 16, fill: C.dim, fit: 1080 })}
    `),
  },

  /* Device pair grid: the right route for each pairing. */
  pairs: {
    mirror: true,
    w: 1200, h: 720,
    draw: (L) => {
      const ids = ["0", "1", "2", "3", "4", "5"];
      const accent = [C.green, C.blue, C.blue, C.amber, C.blue, C.green];
      return frame(1200, 720, `
        ${text(600, 66, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${ids.map((i, n) => {
          const col = n % 2, row = Math.floor(n / 2);
          const x = 60 + col * 550, y = 136 + row * 190;
          return `${card(x, y, 530, 170, { stroke: accent[n] })}
            <circle cx="${x + 30}" cy="${y + 30}" r="6" fill="${accent[n]}"/>
            ${text(x + 265, y + 56, L.items[i].pair, { size: 23, weight: 680, fill: "#ffffff", fit: 480 })}
            ${text(x + 265, y + 116, L.items[i].route, { size: 19, fill: C.ink, wrap: [470, 2], lh: 1.3 })}`;
        }).join("")}
      `);
    },
  },

  /* How long a 1 GB video takes on each route. */
  time: {
    mirror: true,
    w: 1200, h: 520,
    draw: (L) => {
      // Seconds for 1 GB; bar length on a square-root scale so 15 s and 3 min both read.
      const rows = [
        { k: "wifi6", s: 14, v: L.wifi6v, color: C.green },
        { k: "wifi5", s: 23, v: L.wifi5v, color: C.blue },
        { k: "link", s: 180, v: L.linkv, color: C.amber },
      ];
      const len = (s) => 60 + Math.sqrt(s / 180) * 560;
      return frame(1200, 520, `
        ${text(600, 66, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, n) => {
          const y = 190 + n * 100;
          return `${text(225, y + 8, L[r.k], { size: 21, weight: 600, fill: C.ink, wrap: [320, 2], lh: 1.2 })}
            <rect x="420" y="${y - 20}" width="620" height="40" rx="20" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="420" y="${y - 20}" width="${len(r.s)}" height="40" rx="20" fill="${r.color}" fill-opacity="0.75"/>
            ${text(1110, y + 8, `‎${r.v}‎`, { size: 22, weight: 680, fill: "#ffffff", ltr: true, fit: 150 })}`;
        }).join("")}
        ${text(600, 490, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },
};
