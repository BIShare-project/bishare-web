import { C, frame, text, logo, card, phone, beam } from "./kit.mjs";

export const ns = "iphoneToAndroid";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${phone(250, 130, { kind: "iphone", label: L.left })}
      ${phone(805, 130, { kind: "android", accent: C.green, label: L.right })}
      ${beam(420, 780, 265)}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Yes/no decision ladder: switching, supported phone, same place. */
  decide: {
    mirror: true,
    w: 1200, h: 800,
    draw: (L) => {
      const steps = [
        { q: L.q1, a: L.a1, color: C.amber },
        { q: L.q2, a: L.a2, color: C.blue },
        { q: L.q3, a: L.a3, color: C.green },
      ];
      const rowH = 170, y0 = 140;
      return frame(1200, 800, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${steps.map((st, n) => {
          const y = y0 + n * rowH;
          return `${card(60, y, 520, 110, { stroke: C.line })}
            ${text(320, y + 62, st.q, { size: 21, weight: 640, fill: "#ffffff", wrap: [470, 2] })}
            <path d="M590 ${y + 55} H700" stroke="${st.color}" stroke-width="3"/>
            <path d="M690 ${y + 45} L702 ${y + 55} L690 ${y + 65}" stroke="${st.color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${text(645, y + 42, L.yes, { size: 16, weight: 700, fill: st.color, fit: 100 })}
            ${card(714, y, 426, 110, { stroke: st.color, fill: "#0f1e36" })}
            ${text(927, y + 62, st.a, { size: 20, weight: 640, fill: "#ffffff", wrap: [390, 2] })}
            <path d="M320 ${y + 112} V${y + rowH - 4}" stroke="${C.dim}" stroke-width="3"/>
            <path d="M310 ${y + rowH - 14} L320 ${y + rowH - 2} L330 ${y + rowH - 14}" stroke="${C.dim}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${text(352, y + 146, L.no, { size: 16, weight: 700, fill: C.dim, anchor: "start", fit: 120 })}`;
        }).join("")}
        ${card(60, y0 + 3 * rowH, 1080, 110, { stroke: C.blue, fill: "#0f1e36" })}
        ${text(600, y0 + 3 * rowH + 62, L.a4, { size: 21, weight: 640, fill: "#ffffff", wrap: [1000, 2] })}
      `);
    },
  },

  /* Moving everything with Transfer to Android. */
  switchTo: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const col = (x, w, title, color, items) => `${card(x, 150, w, 420, { stroke: color, fill: "#0f1e36" })}
        ${text(x + w / 2, 196, title, { size: 22, weight: 700, fill: color === C.green ? C.greenInk : color === C.red ? C.redInk : "#bcd4fb", fit: w - 40 })}
        ${items.map((it, n) => text(x + w / 2, 262 + n * 70, it, { size: 18, fill: C.ink, wrap: [w - 50, 2], lh: 1.25 })).join("")}`;
      return frame(1200, 640, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${col(60, 340, L.needTitle, C.blue, [L.need0, L.need1, L.need2, L.need3])}
        ${col(430, 360, L.movesTitle, C.green, [L.moves0, L.moves1, L.moves2, L.moves3])}
        ${col(820, 320, L.staysTitle, C.red, [L.stays0, L.stays1, L.stays2])}
        ${text(600, 612, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Why photos look wrong on Android, four traps. */
  photos: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const items = [
        { k: "heic", color: C.blue },
        { k: "live", color: C.amber },
        { k: "chat", color: C.red },
        { k: "video", color: C.green },
      ];
      return frame(1200, 640, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${items.map((it, n) => {
          const x = 60 + (n % 2) * 550, y = 140 + Math.floor(n / 2) * 240;
          return `${card(x, y, 530, 220, { stroke: it.color })}
            <circle cx="${x + 40}" cy="${y + 42}" r="8" fill="${it.color}"/>
            ${text(x + 265, y + 52, L[it.k].name, { size: 24, weight: 700, fill: "#ffffff", fit: 420 })}
            ${text(x + 265, y + 108, L[it.k].what, { size: 18, fill: C.sub, wrap: [470, 2], lh: 1.25 })}
            <path d="M${x + 40} ${y + 146} H${x + 490}" stroke="${C.line}"/>
            ${text(x + 265, y + 186, L[it.k].fix, { size: 19, weight: 620, fill: C.ink, wrap: [470, 2], lh: 1.25 })}`;
        }).join("")}
      `);
    },
  },
};
