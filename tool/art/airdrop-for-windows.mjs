import { C, frame, text, logo, card, phone, laptop, beam } from "./kit.mjs";

export const ns = "airdropWindows";

const at = (x, y, s, body) => `<g transform="translate(${x},${y}) scale(${s})">${body}</g>`;

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${at(90, 210, 0.66, laptop(0, 0, { os: "mac" }))}
      ${at(250, 140, 0.8, phone(0, 0, { kind: "iphone" }))}
      ${text(260, 416, L.left, { size: 24, weight: 620, fill: "#bcd4fb", fit: 360 })}
      ${laptop(790, 176, { os: "win", accent: C.green, label: L.right })}
      ${beam(420, 780, 280)}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Phone Link's iPhone file transfer next to BIShare, requirement by requirement. */
  compare: {
    mirror: true,
    w: 1200, h: 720,
    draw: (L) => {
      const rows = ["windows", "account", "pairing", "devices", "receiver"];
      return frame(1200, 720, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${text(230, 168, L.colNeed, { size: 17, weight: 600, fill: C.dim, fit: 300 })}
        ${text(590, 168, L.colPhoneLink, { size: 21, weight: 680, fill: "#bcd4fb", fit: 360 })}
        ${text(950, 168, L.colBishare, { size: 21, weight: 680, fill: C.greenInk, fit: 360 })}
        ${rows.map((r, n) => {
          const y = 196 + n * 96;
          return `${card(60, y, 1080, 82)}
            ${text(230, y + 48, L.rows[r].need, { size: 19, weight: 620, fill: "#ffffff", wrap: [300, 2], lh: 1.2 })}
            <circle cx="${418}" cy="${y + 41}" r="11" fill="${C.amber}" fill-opacity="0.2" stroke="${C.amber}" stroke-width="2"/>
            ${text(606, y + 48, L.rows[r].pl, { size: 18, fill: C.ink, wrap: [330, 2], lh: 1.2 })}
            <circle cx="${778}" cy="${y + 41}" r="11" fill="${C.green}" fill-opacity="0.2" stroke="${C.green}" stroke-width="2"/>
            <path d="M${772} ${y + 41} l4 4 l8 -8" stroke="${C.green}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            ${text(966, y + 48, L.rows[r].bi, { size: 18, fill: C.ink, wrap: [330, 2], lh: 1.2 })}`;
        }).join("")}
        ${text(600, 700, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Measured phone-to-PC throughput per link, with what 1 GB takes. */
  speed: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const rows = [
        { k: "g24", hi: 8, lo: 3, t: L.t24, color: C.red },
        { k: "wifi5", hi: 50, lo: 40, t: L.t5, color: C.blue },
        { k: "mixed", hi: 70, lo: 50, t: L.tMixed, color: C.blue },
        { k: "wifi6", hi: 110, lo: 70, t: L.t6, color: C.green },
        { k: "eth", hi: 112, lo: 106, t: L.tEth, color: C.green },
      ];
      const x0 = 470, span = 460, len = (v) => Math.max(14, (v / 115) * span);
      return frame(1200, 640, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${text(700, 150, L.colSpeed, { size: 16, weight: 600, fill: C.dim, fit: 440 })}
        ${text(1060, 150, L.colTime, { size: 16, weight: 600, fill: C.dim, fit: 200 })}
        ${rows.map((r, n) => {
          const y = 200 + n * 82;
          return `${text(250, y + 7, L[r.k], { size: 19, weight: 600, fill: C.ink, wrap: [380, 2], lh: 1.15 })}
            <rect x="${x0}" y="${y - 18}" width="${span}" height="36" rx="18" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="${x0}" y="${y - 18}" width="${len(r.hi)}" height="36" rx="18" fill="${r.color}" fill-opacity="0.3"/>
            <rect x="${x0}" y="${y - 18}" width="${len(r.lo)}" height="36" rx="18" fill="${r.color}" fill-opacity="0.8"/>
            ${text(x0 + span - 16, y + 7, `‎${r.lo === r.hi - 6 ? "≈ " + 110 : r.lo + "–" + r.hi} MB/s‎`, { size: 16, weight: 650, fill: "#ffffff", anchor: "end", ltr: true })}
            ${text(1060, y + 7, `\u200E${r.t}\u200E`, { size: 19, weight: 680, fill: "#ffffff", fit: 200, ltr: true })}`;
        }).join("")}
        ${text(600, 624, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },
};
