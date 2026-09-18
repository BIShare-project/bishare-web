import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "clipboardSync";

/** A clipboard glyph: the board, the clip, and two ruled lines of "text". */
const clip = (x, y, s = 1, accent = C.blue) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-34" y="-40" width="68" height="84" rx="10" fill="${C.card}" stroke="${accent}" stroke-width="2.5"/>
    <rect x="-16" y="-50" width="32" height="20" rx="6" fill="${C.card}" stroke="${accent}" stroke-width="2.5"/>
    <rect x="-20" y="-14" width="40" height="5" rx="2.5" fill="${accent}" opacity="0.85"/>
    <rect x="-20" y="2" width="28" height="5" rx="2.5" fill="${accent}" opacity="0.55"/>
    <rect x="-20" y="18" width="34" height="5" rx="2.5" fill="${accent}" opacity="0.35"/>
  </g>`;

/** A closed padlock, for "this one wants a sign-in first". */
const lock = (x, y, tone = C.amber) => `
  <g transform="translate(${x} ${y})">
    <rect x="-13" y="-4" width="26" height="22" rx="5" fill="none" stroke="${tone}" stroke-width="2.5"/>
    <path d="M-7 -4 v-7 a7 7 0 0 1 14 0 v7" fill="none" stroke="${tone}" stroke-width="2.5"/>
  </g>`;

/** An open door, for "nothing to sign in to". */
const open = (x, y, tone = C.green) => `
  <g transform="translate(${x} ${y})">
    <rect x="-13" y="-4" width="26" height="22" rx="5" fill="none" stroke="${tone}" stroke-width="2.5"/>
    <path d="M-7 -4 v-7 a7 7 0 0 1 14 0" fill="none" stroke="${tone}" stroke-width="2.5"/>
  </g>`;

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 48)}
      ${phone(150, 170, { kind: "android", label: L.left })}
      ${laptop(800, 176, { os: "win", label: L.right })}
      ${beam(330, 780, 268)}
      ${clip(555, 268, 0.9, C.green)}
      ${text(600, 366, L.wifi, { size: 18, fill: C.greenInk, fit: 520 })}
      ${text(600, 520, L.title, { size: 44, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 570, L.sub, { size: 22, fill: C.sub, fit: 1060 })}
    `),
  },

  /* What each option demands before it will sync anything — the page's angle. */
  gates: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const rows = [
        { who: "Apple", need: L.apple, locked: true },
        { who: "Windows", need: L.ms, locked: true },
        { who: L.keyboard, need: L.kb, locked: true },
        { who: "Pushbullet", need: L.pb, locked: true },
        { who: "KDE Connect", need: L.none, locked: false },
        { who: "BIShare", need: L.bi, locked: false },
      ];
      return frame(1200, 640, `
        ${text(600, 62, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${rows.map((r, i) => {
          const y = 122 + i * 82;
          const tone = r.locked ? C.amber : C.green;
          return `
            ${card(90, y, 1020, 62, { stroke: r.locked ? C.line : "#1d4d33" })}
            ${text(128, y + 39, r.who, { size: 21, weight: 620, anchor: "start", fit: 300 })}
            ${r.locked ? lock(470, y + 20, tone) : open(470, y + 20, tone)}
            ${text(520, y + 39, r.need, { size: 19, fill: r.locked ? C.amberInk : C.greenInk, anchor: "start", fit: 560 })}`;
        }).join("")}
      `);
    },
  },

  /* Which devices each one can actually reach. */
  reach: {
    mirror: true,
    w: 1200, h: 560,
    draw: (L) => {
      const plats = [L.iphone, L.android, L.windows, L.mac, L.linux];
      const rows = [
        { who: "Apple", has: [1, 0, 0, 1, 0] },
        { who: "Windows", has: [0, 0, 1, 0, 0] },
        { who: "Pushbullet", has: [0, 1, 1, 1, 1] },
        // 2 = partial: KDE Connect ships an iOS port, limited by what iOS allows.
        { who: "KDE Connect", has: [2, 1, 1, 1, 1] },
        { who: "BIShare", has: [1, 1, 1, 1, 1] },
      ];
      const x0 = 400, gap = 152;
      return frame(1200, 560, `
        ${text(600, 60, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${plats.map((p, c) => text(x0 + c * gap, 118, p, { size: 17, fill: C.sub, fit: 138 })).join("")}
        ${rows.map((r, i) => {
          const y = 168 + i * 72;
          return `
            ${text(330, y + 6, r.who, { size: 20, weight: 620, anchor: "end", fit: 250 })}
            ${r.has.map((on, c) => {
              const cx = x0 + c * gap;
              if (on === 1) return `<circle cx="${cx}" cy="${y}" r="13" fill="${C.green}" opacity="0.9"/>`;
              if (on === 2) return `<circle cx="${cx}" cy="${y}" r="13" fill="none" stroke="${C.green}" stroke-width="2"/><circle cx="${cx}" cy="${y}" r="5" fill="${C.green}" opacity="0.9"/>`;
              return `<circle cx="${cx}" cy="${y}" r="13" fill="none" stroke="${C.dim}" stroke-width="2"/>`;
            }).join("")}`;
        }).join("")}
        ${text(600, 526, L.foot, { size: 17, fill: C.sub, fit: 1060 })}
      `);
    },
  },
};
