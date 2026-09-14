import { C, frame, text, logo, card, phone, laptop } from "./kit.mjs";

export const ns = "nearbyShareAlt";

const PURPLE = "#a78bfa";

/* Small glyphs for the hero's destination cards. */
const glyph = {
  mac: (x, y, c) => `<rect x="${x - 26}" y="${y - 20}" width="52" height="34" rx="4" fill="none" stroke="${c}" stroke-width="3"/><path d="M${x - 34} ${y + 20} H${x + 34}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  linux: (x, y, c) => `<rect x="${x - 28}" y="${y - 22}" width="56" height="44" rx="6" fill="none" stroke="${c}" stroke-width="3"/><path d="M${x - 16} ${y - 8} l10 8 l-10 8 M${x + 2} ${y + 10} h14" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  iphone: (x, y, c) => `<rect x="${x - 15}" y="${y - 26}" width="30" height="52" rx="7" fill="none" stroke="${c}" stroke-width="3"/><path d="M${x - 5} ${y - 19} h10" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  windows: (x, y, c) => `<g fill="${c}"><rect x="${x - 22}" y="${y - 22}" width="20" height="20" rx="2"/><rect x="${x + 2}" y="${y - 22}" width="20" height="20" rx="2"/><rect x="${x - 22}" y="${y + 2}" width="20" height="20" rx="2"/><rect x="${x + 2}" y="${y + 2}" width="20" height="20" rx="2"/></g>`,
};

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => {
      const dests = [
        { k: "mac", c: "#bcd4fb" },
        { k: "linux", c: C.amberInk },
        { k: "iphone", c: "#c4b5fd" },
        { k: "windows", c: C.blue },
      ];
      return frame(1200, 630, `
        ${logo(600, 30)}
        ${phone(210, 110, { kind: "android", accent: C.green, label: L.phone })}
        ${dests.map((d, i) => {
          const y = 96 + i * 98;
          return `<path d="M372 245 C 520 245, 560 ${y + 42}, 700 ${y + 42}" stroke="${C.green}" stroke-width="3" fill="none" stroke-dasharray="10 9" stroke-linecap="round" stroke-opacity="0.8"/>
            ${card(708, y, 330, 84, { stroke: C.line, fill: "#0f1e36", r: 16 })}
            ${glyph[d.k](766, y + 42, d.c)}
            ${text(900, y + 51, L[d.k], { size: 27, weight: 650, fill: "#ffffff", fit: 200 })}`;
        }).join("")}
        ${text(600, 548, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
        ${text(600, 596, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
      `);
    },
  },

  /* Six dated steps from Android Beam to AirDrop support. */
  timeline: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cols = [C.dim, C.green, C.blue, C.blue, C.amber, PURPLE];
      return frame(1200, 600, `
        ${text(600, 60, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 98, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        <path d="M70 330 H1130" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
        ${[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 125 + i * 190, up = i % 2 === 0;
          const cy = up ? 140 : 400;
          return `<circle cx="${x}" cy="330" r="10" fill="${cols[i]}"/>
            <path d="M${x} ${up ? 320 : 340} V${up ? cy + 150 : cy}" stroke="${cols[i]}" stroke-width="2" stroke-dasharray="4 5"/>
            ${card(x - 88, cy, 176, 150, { stroke: cols[i], fill: "#0f1e36", r: 14 })}
            ${text(x, cy + 38, L["y" + i], { size: 21, weight: 700, fill: i === 0 ? C.sub : cols[i], fit: 156 })}
            ${text(x, cy + 92, L["e" + i], { size: 19, weight: 600, fill: "#ffffff", wrap: [150, 2], lh: 1.3 })}`;
        }).join("")}
      `);
    },
  },

  /* Platform rows: official status chip, then what fills the gap. */
  reach: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const st = [0, 0, 1, 2, 3, 3];
      const sc = [C.green, C.blue, C.amber, C.red];
      const ink = [C.greenInk, "#bcd4fb", C.amberInk, C.redInk];
      return frame(1200, 600, `
        ${text(600, 60, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 98, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(50, 122, 1100, 440, { stroke: C.line, fill: "#0b1628" })}
        ${text(920, 158, L.fill, { size: 19, weight: 700, fill: C.sub, fit: 380 })}
        ${[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 208 + i * 60, s = st[i];
          return `<path d="M70 ${y - 30} H1130" stroke="${C.line}" stroke-width="1.5"/>
            ${text(250, y + 8, L["p" + i], { size: 22, weight: 650, fill: C.ink, fit: 330, ltr: i === 0 })}
            <rect x="${540 - 125}" y="${y - 21}" width="250" height="42" rx="21" fill="${sc[s]}" fill-opacity="0.13" stroke="${sc[s]}" stroke-width="2"/>
            ${text(540, y + 7, L["s" + s], { size: 18, weight: 650, fill: ink[s], fit: 230 })}
            ${i >= 3 ? text(920, y + 7, L["f" + i], { size: 19, weight: 600, fill: "#ffffff", fit: 390, ltr: true }) : ""}`;
        }).join("")}
      `);
    },
  },

  /* How NearDrop-style clients reach a phone's built-in Quick Share. */
  bridge: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const arrow = (x1, x2, y, col, dash = "") => {
        const dir = x2 > x1 ? 1 : -1;
        return `<path d="M${x1} ${y} H${x2}" stroke="${col}" stroke-width="3.5" fill="none" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ""}/>
          <path d="M${x2 - dir * 14} ${y - 10} L${x2} ${y} L${x2 - dir * 14} ${y + 10}" stroke="${col}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      };
      return frame(1200, 600, `
        ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 94, L.sub, { size: 19, fill: C.sub, fit: 1080, ltr: false })}
        ${phone(70, 128, { kind: "android", accent: C.green })}
        ${text(142, 430, L.phone, { size: 22, weight: 620, fill: C.greenInk, fit: 230 })}
        ${laptop(860, 150, { os: "mac", accent: C.blue })}
        ${text(1010, 400, L.pc, { size: 22, weight: 620, fill: "#bcd4fb", fit: 290 })}
        <g transform="translate(560,160)" fill="none" stroke="${C.blue}" stroke-width="3.5" stroke-linecap="round">
          <path d="M-34 -6 a48 48 0 0 1 68 0"/><path d="M-22 6 a30 30 0 0 1 44 0"/><circle cx="0" cy="18" r="4" fill="${C.blue}"/>
        </g>
        ${text(560, 214, L.wifi, { size: 21, weight: 650, fill: "#bcd4fb", fit: 480 })}
        ${text(560, 262, L.a1, { size: 19, fill: C.ink, fit: 520 })}
        ${arrow(250, 850, 280, C.green)}
        ${text(560, 332, L.a2, { size: 19, fill: C.ink, fit: 520 })}
        ${arrow(850, 250, 350, C.blue)}
        <g transform="translate(300,382)">
          <rect width="44" height="44" rx="6" fill="none" stroke="${C.amber}" stroke-width="3"/>
          <rect x="8" y="8" width="11" height="11" fill="${C.amber}"/><rect x="25" y="8" width="11" height="11" fill="${C.amber}"/><rect x="8" y="25" width="11" height="11" fill="${C.amber}"/><rect x="27" y="27" width="6" height="6" fill="${C.amber}"/>
        </g>
        ${text(590, 412, L.a3, { size: 19, fill: C.amberInk, fit: 470 })}
        ${card(140, 480, 920, 84, { stroke: C.red, fill: "#1f0f14", r: 42 })}
        ${text(300, 529, L.noTitle, { size: 20, weight: 700, fill: C.redInk, fit: 220 })}
        ${[1, 2, 3].map((n) => {
          const x = 440 + (n - 1) * 205;
          return `<rect x="${x}" y="500" width="185" height="44" rx="22" fill="none" stroke="${C.red}" stroke-opacity="0.6" stroke-width="2"/>
            ${text(x + 92, 529, L["n" + n], { size: 18, weight: 600, fill: C.ink, fit: 165 })}`;
        }).join("")}
      `);
    },
  },
};
