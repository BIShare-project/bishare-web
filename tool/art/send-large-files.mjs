import { C, frame, text, logo, card, laptop, browser, beam } from "./kit.mjs";

export const ns = "largeFiles";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 48)}
      ${laptop(110, 180, { os: "mac", label: L.left })}
      ${browser(790, 176, { accent: C.green, label: L.right })}
      ${beam(430, 770, 272)}
      <rect x="520" y="240" width="160" height="64" rx="32" fill="#0f1e36" stroke="${C.blue}" stroke-width="2.5"/>
      ${text(600, 283, "100 GB", { size: 28, weight: 720, fill: "#ffffff", ltr: true })}
      ${text(600, 526, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 574, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Free per-transfer limits on a log scale, from the limits table on the page. */
  limits: {
    mirror: true,
    w: 1200, h: 720,
    draw: (L) => {
      const MB = 1, GB = 1024;
      const rows = [
        { name: "Email", size: 25 * MB, v: "20–25 MB", color: C.dim },
        { name: "Smash", size: 2 * GB, v: L.smashV, color: C.amber },
        { name: "WeTransfer", size: 3 * GB, v: "3 GB", color: C.amber },
        { name: "Filemail · TransferNow · SendBig · TransferXL", size: 5 * GB, v: "5 GB", color: C.amber },
        { name: "SwissTransfer", size: 50 * GB, v: "50 GB", color: C.blue },
        { name: L.bishareLink, size: 100 * GB, v: "100 GB", color: C.green },
        { name: L.bishareNearby, size: 400 * GB, v: L.noLimit, color: C.green, open: true },
      ];
      const x0 = 520, span = 540, lo = Math.log10(10), hi = Math.log10(400 * GB);
      const len = (s) => ((Math.log10(s) - lo) / (hi - lo)) * span;
      return frame(1200, 720, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, n) => {
          const y = 168 + n * 76;
          const w = len(r.size);
          return `${text(275, y + 7, r.name, { size: 20, weight: 600, fill: r.color === C.green ? "#ffffff" : C.ink, wrap: [440, 2], lh: 1.15 })}
            <rect x="${x0}" y="${y - 18}" width="${span}" height="36" rx="18" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="${x0}" y="${y - 18}" width="${w}" height="36" rx="18" fill="${r.color}" fill-opacity="${r.color === C.green ? 0.8 : 0.6}"/>
            ${r.open ? `<path d="M${x0 + span - 30} ${y - 10} L${x0 + span - 14} ${y} L${x0 + span - 30} ${y + 10}" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>` : ""}
            ${w < 170
              ? text(x0 + w + 14, y + 7, `\u200E${r.v}\u200E`, { size: 18, weight: 700, fill: C.ink, anchor: "start", ltr: true })
              : text(x0 + Math.min(w, span - 60) - 16, y + 7, `\u200E${r.v}\u200E`, { size: 18, weight: 700, fill: "#ffffff", anchor: "end", ltr: true })}`;
        }).join("")}
        ${text(600, 700, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* How long 10 GB takes by upload speed, against the nearby route. */
  time: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const rows = [
        { k: "up10", min: 140, v: L.v10, color: C.red },
        { k: "up50", min: 28, v: L.v50, color: C.amber },
        { k: "up100", min: 14, v: L.v100, color: C.amber },
        { k: "up500", min: 3, v: L.v500, color: C.blue },
        { k: "nearby", min: 2.5, v: L.vNear, color: C.green },
      ];
      const len = (m) => 40 + Math.sqrt(m / 140) * 560;
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, n) => {
          const y = 180 + n * 82;
          return `${text(235, y + 7, L[r.k], { size: 20, weight: 600, fill: r.k === "nearby" ? "#ffffff" : C.ink, wrap: [340, 2], lh: 1.15 })}
            <rect x="430" y="${y - 20}" width="600" height="40" rx="20" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="430" y="${y - 20}" width="${len(r.min)}" height="40" rx="20" fill="${r.color}" fill-opacity="0.72"/>
            ${text(1105, y + 8, `‎${r.v}‎`, { size: 21, weight: 700, fill: "#ffffff", ltr: true, fit: 150 })}`;
        }).join("")}
        ${text(600, 596, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Anatomy of a share link: what reaches the server and what never does. */
  link: {
    w: 1200, h: 560,
    draw: (L) => frame(1200, 560, `
      ${text(600, 66, L.title, { size: 34, weight: 660, fit: 1080 })}
      ${text(600, 104, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
      <g direction="ltr">
        <rect x="90" y="170" width="1020" height="84" rx="16" fill="#0a1426" stroke="${C.line}" stroke-width="2"/>
        <rect x="104" y="184" width="596" height="56" rx="10" fill="${C.blue}" fill-opacity="0.16" stroke="${C.blue}" stroke-width="2"/>
        <rect x="712" y="184" width="384" height="56" rx="10" fill="${C.green}" fill-opacity="0.16" stroke="${C.green}" stroke-width="2"/>
      </g>
      ${text(402, 222, "bishare.app/transfer/7KQ2XM", { size: 27, weight: 650, fill: "#dbeafe", ltr: true })}
      ${text(904, 222, "#k=Xn4…pQ", { size: 27, weight: 650, fill: "#dcfce7", ltr: true })}
      <path d="M402 256 V300" stroke="${C.blue}" stroke-width="2.5"/><path d="M904 256 V300" stroke="${C.green}" stroke-width="2.5"/>
      ${card(104, 300, 596, 170, { stroke: C.blue, fill: "#0f1e36" })}
      ${text(402, 350, L.serverTitle, { size: 23, weight: 680, fill: "#bcd4fb", fit: 540 })}
      ${text(402, 412, L.serverBody, { size: 18, fill: C.ink, wrap: [530, 3], lh: 1.3 })}
      ${card(712, 300, 384, 170, { stroke: C.green, fill: "#0c1f22" })}
      ${text(904, 350, L.keyTitle, { size: 23, weight: 680, fill: C.greenInk, fit: 340 })}
      ${text(904, 412, L.keyBody, { size: 18, fill: C.ink, wrap: [330, 3], lh: 1.3 })}
      ${text(600, 520, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
    `),
  },
};
