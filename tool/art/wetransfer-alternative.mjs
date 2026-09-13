import { C, frame, text, logo, card, laptop, browser, beam } from "./kit.mjs";

export const ns = "wetransferAlt";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${laptop(110, 150, { os: "mac", label: L.left })}
      ${browser(790, 146, { accent: C.green, label: L.right })}
      ${beam(430, 770, 244)}
      <g transform="translate(572,196)">
        <rect x="0" y="18" width="56" height="44" rx="9" fill="#0f1e36" stroke="${C.green}" stroke-width="3"/>
        <path d="M12 18 V10 a16 16 0 0 1 32 0 V18" fill="none" stroke="${C.green}" stroke-width="3"/>
        <circle cx="28" cy="38" r="5" fill="${C.green}"/>
      </g>
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* How the WeTransfer free allowance runs out: 10 slots or 3 GB in 30 days. */
  quota: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const slots = (x, y, used) => Array.from({ length: 10 }, (_, i) =>
        `<rect x="${x + i * 46}" y="${y}" width="38" height="38" rx="8" fill="${i < used ? C.amber : "#0e1a2e"}" fill-opacity="${i < used ? 0.75 : 1}" stroke="${i < used ? C.amber : C.line}" stroke-width="2"/>`).join("");
      const bar = (x, y, frac, color) => `<rect x="${x}" y="${y}" width="452" height="30" rx="15" fill="#0e1a2e" stroke="${C.line}"/>
        <rect x="${x}" y="${y}" width="${Math.max(30, 452 * frac)}" height="30" rx="15" fill="${color}" fill-opacity="0.75"/>`;
      const row = (y, label, result, used, frac, color) => `${card(60, y, 1080, 150, { stroke: C.line, fill: "#0b1628" })}
        ${text(210, y + 50, label, { size: 22, weight: 700, fill: "#ffffff", fit: 270 })}
        ${text(210, y + 100, result, { size: 17, fill: C.redInk, wrap: [270, 2], lh: 1.2 })}
        ${text(620, y + 30, L.slots, { size: 15, fill: C.sub, fit: 440 })}
        ${slots(386, y + 40, used)}
        ${text(620, y + 100, L.volume, { size: 15, fill: C.sub, fit: 440 })}
        ${bar(390, y + 108, frac, color)}`;
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${row(132, L.caseA, L.caseAres, 1, 1, C.red)}
        ${row(300, L.caseB, L.caseBres, 10, 0.007, C.amber)}
        ${card(300, 476, 600, 56, { stroke: C.amber, fill: "#221c10" })}
        ${text(600, 512, L.expiry, { size: 21, weight: 700, fill: C.amberInk, fit: 560 })}
        ${text(600, 576, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Scatter: free per-transfer size against days kept. */
  map: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L, locale) => {
      const gb = { fr: "Go", ru: "ГБ" }[locale] ?? "GB";
      const x0 = 190, x1 = 1110, y0 = 520, y1 = 150;
      const lx = (d) => x0 + (Math.log(d) / Math.log(30)) * (x1 - x0);
      const ly = (g) => y0 - (Math.log10(g) - Math.log10(1)) / (Math.log10(1000) - Math.log10(1)) * (y0 - y1);
      const pts = [
        { name: "BIShare", d: 1, g: 100, c: C.green, dy: -26 },
        { name: "Wormhole", d: 1, g: 10, c: C.blue, dy: -26 },
        { name: "WeTransfer", d: 3, g: 3, c: C.red, dy: 34 },
        { name: "Filemail · TransferNow", d: 7, g: 5, c: C.dim, dy: 36 },
        { name: "Smash", d: 7, g: 1000, c: C.amber, dy: 36, cap: true },
        { name: "SwissTransfer", d: 15, g: 50, c: "#a78bfa", dy: -26, ext: true },
      ];
      const ticksX = [1, 3, 7, 15, 30];
      const ticksY = [[1, `1 ${gb}`], [10, `10 ${gb}`], [100, `100 ${gb}`], [1000, L.anySize]];
      return frame(1200, 640, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        <g stroke="${C.line}" stroke-width="1.5">
          ${ticksY.map(([g]) => `<path d="M${x0} ${ly(g)} H${x1}"/>`).join("")}
          ${ticksX.map((d) => `<path d="M${lx(d)} ${y1 - 10} V${y0}"/>`).join("")}
        </g>
        ${ticksY.map(([g, s]) => text(x0 - 60, ly(g) + 6, `‎${s}‎`, { size: 16, fill: C.sub, ltr: true, fit: 110 })).join("")}
        ${ticksX.map((d) => text(lx(d), y0 + 30, `‎${d}‎`, { size: 16, fill: C.sub, ltr: true })).join("")}
        ${text((x0 + x1) / 2, y0 + 62, L.xLabel, { size: 17, weight: 600, fill: C.ink, fit: 600 })}
        ${text(x0 - 60, y1 - 30, L.yLabel, { size: 16, weight: 600, fill: C.ink, fit: 220 })}
        <path d="M${lx(15)} ${ly(50)} H${lx(30)}" stroke="#a78bfa" stroke-width="4" stroke-dasharray="8 6" stroke-linecap="round"/>
        ${text((lx(15) + lx(30)) / 2 + 10, ly(50) + 30, L.extend, { size: 14, fill: "#c4b5fd", fit: 220 })}
        ${pts.map((p) => {
          const x = lx(p.d), y = ly(p.g);
          const edge = p.d === 1 ? 70 : 0;
          return `<circle cx="${x}" cy="${y}" r="13" fill="${p.c}" fill-opacity="0.85" stroke="#ffffff" stroke-width="2"/>
            ${text(x + edge, y + p.dy, p.name, { size: 19, weight: 700, fill: "#ffffff", fit: 300 })}
            ${p.cap ? text(x, y + p.dy + 22, L.queue, { size: 14, fill: C.amberInk, fit: 220 }) : ""}`;
        }).join("")}
        ${text(600, 624, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Four jobs, what each needs, and the picks. */
  choose: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cards = [
        { k: "a", color: C.blue },
        { k: "b", color: C.green },
        { k: "c", color: C.amber },
        { k: "d", color: "#a78bfa" },
      ];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${cards.map((c, n) => {
          const x = 60 + (n % 2) * 550, y = 136 + Math.floor(n / 2) * 222;
          const Lk = L[c.k];
          return `${card(x, y, 530, 204, { stroke: c.color, fill: "#0f1e36" })}
            ${text(x + 265, y + 50, Lk.job, { size: 24, weight: 700, fill: "#ffffff", fit: 480 })}
            <rect x="${x + 115}" y="${y + 72}" width="300" height="36" rx="18" fill="${c.color}" fill-opacity="0.16"/>
            ${text(x + 265, y + 97, Lk.need, { size: 17, weight: 700, fill: c.color, fit: 280 })}
            ${text(x + 265, y + 158, Lk.pick, { size: 20, weight: 600, fill: C.ink, wrap: [480, 2], lh: 1.25 })}`;
        }).join("")}
      `);
    },
  },
};
