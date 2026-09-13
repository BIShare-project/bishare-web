import { C, frame, text, logo, card, laptop, beam } from "./kit.mjs";

export const ns = "macToWindows";

const ITEMS = ["0", "1", "2", "3", "4"];
const ACCENTS = [C.amber, C.blue, C.blue, C.green, C.dim];

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 48)}
      ${laptop(120, 190, { os: "mac", label: L.mac })}
      ${laptop(780, 190, { os: "win", accent: C.green, label: L.pc })}
      ${beam(430, 770, 280)}
      ${text(600, 520, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 568, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  flow: {
    mirror: true,
    w: 1200, h: 740,
    draw: (L) => frame(1200, 740, `
      ${text(600, 72, L.title, { size: 36, weight: 660, fit: 1080 })}
      ${text(600, 112, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
      ${ITEMS.map((i, n) => {
        const y = 150 + n * 116;
        return `
          ${card(60, y, 560, 92)}
          ${text(340, y + 52, L.items[i].q, { size: 21, fill: C.ink, wrap: [510, 2] })}
          <path d="M636 ${y + 46} H708" stroke="${ACCENTS[n]}" stroke-width="3" stroke-linecap="round"/>
          <path d="M698 ${y + 36} L712 ${y + 46} L698 ${y + 56}" stroke="${ACCENTS[n]}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          ${card(724, y, 416, 92, { stroke: ACCENTS[n], fill: "#0f1e36" })}
          ${text(932, y + 52, L.items[i].a, { size: 22, weight: 640, fill: "#ffffff", wrap: [370, 2] })}
        `;
      }).join("")}
    `),
  },

  usb: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const colX = [200, 460, 715, 970];
      const rows = [
        { f: "exFAT", mac: "rw", win: "rw", big: "yes" },
        { f: "FAT32", mac: "rw", win: "rw", big: "no" },
        { f: "NTFS", mac: "ro", win: "rw", big: "yes" },
        { f: "APFS", mac: "rw", win: "none", big: "yes" },
      ];
      const chip = (cx, y, kind) => {
        const map = { rw: [C.green, C.greenInk, L.rw], ro: [C.amber, C.amberInk, L.ro], none: [C.red, C.redInk, L.none], yes: [C.green, C.greenInk, L.yes], no: [C.red, C.redInk, L.no] };
        const [stroke, ink, label] = map[kind];
        return `<rect x="${cx - 110}" y="${y - 26}" width="220" height="44" rx="22" fill="${stroke}" fill-opacity="0.12" stroke="${stroke}" stroke-opacity="0.6" stroke-width="1.5"/>${text(cx, y + 3, label, { size: 19, weight: 600, fill: ink, fit: 200 })}`;
      };
      return frame(1200, 600, `
        ${text(600, 68, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${card(60, 110, 1080, 440)}
        ${[L.cols.format, L.cols.mac, L.cols.win, L.cols.big].map((h, n) => text(colX[n], 160, h, { size: 18, weight: 600, fill: C.sub, fit: 230 })).join("")}
        <path d="M60 184 H1140" stroke="${C.line}" stroke-width="2"/>
        ${rows.map((r, n) => {
          const y = 240 + n * 88;
          return `${n ? `<path d="M90 ${y - 44} H1110" stroke="${C.line}" stroke-width="1"/>` : ""}
            ${text(colX[0], y + 6, r.f, { size: 26, weight: 680, fill: n === 0 ? "#ffffff" : C.ink, ltr: true })}
            ${chip(colX[1], y, r.mac)}${chip(colX[2], y, r.win)}${chip(colX[3], y, r.big)}`;
        }).join("")}
      `);
    },
  },

  speed: {
    mirror: true,
    w: 1200, h: 560,
    draw: (L) => {
      const max = 120, x0 = 420, span = 640;
      const bars = [
        { k: "cloud", lo: 5, hi: 7, v: "≈6", color: C.dim },
        { k: "usb", lo: 10, hi: 30, v: "10–30", color: C.amber },
        { k: "wifi5", lo: 40, hi: 50, v: "40–50", color: C.blue },
        { k: "wifi6", lo: 70, hi: 110, v: "70–110", color: C.blue },
        { k: "eth", lo: 105, hi: 112, v: "≈110", color: C.green },
      ];
      return frame(1200, 560, `
        ${text(600, 68, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 106, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${bars.map((b, n) => {
          const y = 170 + n * 76;
          const w = Math.max(10, (b.hi / max) * span), wlo = (b.lo / max) * span;
          return `${text(215, y + 8, L[b.k], { size: 21, weight: 560, fill: C.ink, fit: 330 })}
            <rect x="${x0}" y="${y - 16}" width="${span}" height="32" rx="16" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="${x0}" y="${y - 16}" width="${w}" height="32" rx="16" fill="${b.color}" fill-opacity="0.28"/>
            <rect x="${x0}" y="${y - 16}" width="${Math.max(10, wlo)}" height="32" rx="16" fill="${b.color}" fill-opacity="0.75"/>
            ${text(1120, y + 8, `\u200E${b.v}\u200E`, { size: 21, weight: 650, fill: "#ffffff", ltr: true })}`;
        }).join("")}
        ${text(1120, 146, L.unit, { size: 16, fill: C.dim })}
      `);
    },
  },
};
