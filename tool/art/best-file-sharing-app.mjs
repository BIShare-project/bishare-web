import { C, frame, text, logo, card, phone, laptop } from "./kit.mjs";

export const ns = "bestApps";

const at = (x, y, s, body) => `<g transform="translate(${x},${y}) scale(${s})">${body}</g>`;

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      <g fill="none" stroke="${C.blue}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 8">
        <path d="M190 300 Q 600 120 1010 300"/><path d="M330 330 Q 600 230 870 330"/>
      </g>
      ${at(100, 160, 0.78, phone(0, 0, { kind: "iphone" }))}
      ${at(262, 236, 0.66, laptop(0, 0, { os: "mac" }))}
      <circle cx="600" cy="300" r="62" fill="#0f1e36" stroke="${C.blue}" stroke-width="2.5"/>
      ${text(600, 312, L.center, { size: 34, weight: 700, fill: "#ffffff", ltr: true, fit: 110 })}
      ${at(740, 236, 0.66, laptop(0, 0, { os: "win", accent: C.green }))}
      ${at(987, 160, 0.78, phone(0, 0, { kind: "android", accent: C.green }))}
      ${text(600, 440, L.platforms, { size: 21, weight: 600, fill: C.sub, fit: 1000, ltr: true })}
      ${text(600, 520, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 568, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* The six tests every app was judged on. */
  criteria: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const ids = ["0", "1", "2", "3", "4", "5"];
      const glyph = [
        (x, y) => `<g stroke="${C.blue}" stroke-width="3" fill="none"><rect x="${x - 26}" y="${y - 18}" width="22" height="36" rx="5"/><rect x="${x + 2}" y="${y - 12}" width="30" height="22" rx="3"/><path d="M${x - 4} ${y + 22} H${x + 36}"/></g>`,
        (x, y) => `<path d="M${x - 8} ${y - 22} L${x - 22} ${y + 4} H${x} L${x - 8} ${y + 24} L${x + 22} ${y - 6} H${x} Z" fill="${C.amber}" opacity="0.9"/>`,
        (x, y) => `<g stroke="${C.blue}" stroke-width="3" fill="none"><circle cx="${x}" cy="${y}" r="22"/><path d="M${x - 22} ${y} H${x + 22} M${x} ${y - 22} Q ${x + 14} ${y} ${x} ${y + 22} M${x} ${y - 22} Q ${x - 14} ${y} ${x} ${y + 22}"/></g>`,
        (x, y) => `<g stroke="${C.green}" stroke-width="3" fill="none"><rect x="${x - 22}" y="${y - 20}" width="44" height="36" rx="6"/><path d="M${x - 22} ${y - 8} H${x + 22}"/><path d="M${x - 8} ${y + 4} L${x - 2} ${y + 10} L${x + 10} ${y - 2}" stroke-linecap="round"/></g>`,
        (x, y) => `<g stroke="${C.green}" stroke-width="3" fill="none"><rect x="${x - 18}" y="${y - 4}" width="36" height="28" rx="5"/><path d="M${x - 11} ${y - 4} V${y - 12} a11 11 0 0 1 22 0 V${y - 4}"/></g>`,
        (x, y) => `<g stroke="${C.amber}" stroke-width="3" fill="none"><path d="M${x - 20} ${y - 2} L${x - 2} ${y - 20} H${x + 20} V${y + 2} L${x + 2} ${y + 20} Z"/><circle cx="${x + 9}" cy="${y - 9}" r="4"/></g>`,
      ];
      return frame(1200, 640, `
        ${text(600, 66, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${ids.map((i, n) => {
          const col = n % 3, row = Math.floor(n / 3);
          const x = 60 + col * 366, y = 140 + row * 240;
          return `${card(x, y, 348, 220)}
            ${glyph[n](x + 174, y + 56)}
            ${text(x + 174, y + 122, L.items[i].h, { size: 22, weight: 680, fill: "#ffffff", wrap: [300, 2], lh: 1.15 })}
            ${text(x + 174, y + 182, L.items[i].b, { size: 17, fill: C.sub, wrap: [300, 2], lh: 1.25 })}`;
        }).join("")}
      `);
    },
  },

  /* Quadrant: instant on the same Wi-Fi versus reaching someone far away.
     Placement comes straight from table rows r1 and r2 on the page. */
  quadrant: {
    mirror: true,
    w: 1200, h: 760,
    draw: (L) => {
      const x0 = 250, y0 = 150, w = 880, h = 520;
      const chip = (cx, cy, label, color, strong) => {
        const cw = Math.max(150, label.length * 13 + 44);
        return `<rect x="${cx - cw / 2}" y="${cy - 24}" width="${cw}" height="48" rx="24" fill="${color}" fill-opacity="${strong ? 0.28 : 0.12}" stroke="${color}" stroke-width="${strong ? 2.5 : 1.5}"/>${text(cx, cy + 7, label, { size: 20, weight: strong ? 700 : 600, fill: "#ffffff", ltr: true, fit: cw - 24 })}`;
      };
      return frame(1200, 760, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        <rect x="${x0}" y="${y0}" width="${w / 2}" height="${h / 2}" fill="${C.blue}" fill-opacity="0.06"/>
        <rect x="${x0 + w / 2}" y="${y0}" width="${w / 2}" height="${h / 2}" fill="${C.green}" fill-opacity="0.09"/>
        <rect x="${x0 + w / 2}" y="${y0 + h / 2}" width="${w / 2}" height="${h / 2}" fill="${C.amber}" fill-opacity="0.06"/>
        <rect x="${x0}" y="${y0 + h / 2}" width="${w / 2}" height="${h / 2}" fill="#ffffff" fill-opacity="0.015"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="${C.line}" stroke-width="2" rx="6"/>
        <path d="M${x0 + w / 2} ${y0} V${y0 + h} M${x0} ${y0 + h / 2} H${x0 + w}" stroke="${C.line}" stroke-width="2"/>
        ${text(x0 + w * 0.25, y0 + 36, L.qNearOnly, { size: 17, weight: 600, fill: "#bcd4fb", fit: 400 })}
        ${text(x0 + w * 0.75, y0 + 36, L.qBoth, { size: 17, weight: 600, fill: C.greenInk, fit: 400 })}
        ${text(x0 + w * 0.75, y0 + h / 2 + 36, L.qFarOnly, { size: 17, weight: 600, fill: C.amberInk, fit: 400 })}
        ${text(x0 + w * 0.25, y0 + h / 2 + 36, L.qNeither, { size: 17, weight: 600, fill: C.dim, fit: 400 })}
        ${chip(x0 + w * 0.75, y0 + 118, "BIShare", C.green, true)}
        ${chip(x0 + w * 0.75, y0 + 190, "PairDrop", C.green)}
        ${chip(x0 + w * 0.25, y0 + 96, "LocalSend", C.blue)}
        ${chip(x0 + w * 0.25, y0 + 158, "AirDrop", C.blue)}
        ${chip(x0 + w * 0.25, y0 + 220, "Quick Share", C.blue)}
        ${chip(x0 + w * 0.75, y0 + h / 2 + 118, "WeTransfer", C.amber)}
        ${chip(x0 + w * 0.75, y0 + h / 2 + 184, "Wormhole", C.amber)}
        ${text(x0 + w * 0.25, y0 + h * 0.78, L.none, { size: 17, fill: C.dim, wrap: [380, 2] })}
        ${text(x0 + w / 2, y0 + h + 48, L.xAxis, { size: 18, weight: 600, fill: C.sub, fit: 860 })}
        ${text(140, y0 + h * 0.25, L.yTop, { size: 17, weight: 600, fill: C.sub, wrap: [190, 3] })}
        ${text(140, y0 + h * 0.75, L.yBottom, { size: 17, weight: 600, fill: C.dim, wrap: [190, 3] })}
      `);
    },
  },

  /* Situation chooser. */
  choose: {
    mirror: true,
    w: 1200, h: 860,
    draw: (L) => {
      const ids = ["0", "1", "2", "3", "4", "5"];
      const accent = [C.green, C.blue, C.green, C.blue, C.amber, C.dim];
      return frame(1200, 860, `
        ${text(600, 70, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 108, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${ids.map((i, n) => {
          const y = 144 + n * 116;
          return `${card(60, y, 1080, 96, { stroke: C.line })}
            <rect x="60" y="${y}" width="8" height="96" rx="4" fill="${accent[n]}"/>
            ${text(330, y + 55, L.items[i].q, { size: 21, weight: 620, fill: "#ffffff", wrap: [470, 2] })}
            <path d="M600 ${y + 26} V${y + 70}" stroke="${C.line}" stroke-width="2"/>
            ${text(870, y + 55, L.items[i].a, { size: 20, fill: C.ink, wrap: [480, 2] })}`;
        }).join("")}
      `);
    },
  },
};
