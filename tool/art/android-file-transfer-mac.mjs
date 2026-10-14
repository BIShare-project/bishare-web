import { C, frame, text, logo, card, phone, laptop } from "./kit.mjs";

/* Dashed link with an arrowhead at each end. */
const link2 = (x1, x2, y, col) => `
  <path d="M${x1 + 10} ${y} H${x2 - 10}" stroke="${col}" stroke-width="3.5" stroke-dasharray="10 9" stroke-linecap="round"/>
  <path d="M${x1 + 20} ${y - 9} L${x1 + 8} ${y} L${x1 + 20} ${y + 9}" stroke="${col}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M${x2 - 20} ${y - 9} L${x2 - 8} ${y} L${x2 - 20} ${y + 9}" stroke="${col}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

/**
 * Art for /android-file-transfer-mac: a hero, the state of Google's old app
 * next to what replaced it, and a three-question route chooser.
 * Labels: src/messages/<locale>/androidMac.json → art.
 */
export const ns = "androidMac";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 30)}
      ${phone(150, 110, { kind: "android", accent: C.green, label: L.left })}
      ${link2(305, 470, 245, C.green)}
      ${link2(730, 850, 245, C.blue)}
      ${laptop(840, 150, { os: "mac", accent: C.blue, label: L.right })}
      ${card(470, 190, 260, 110, { stroke: C.line, fill: "#0f1e36", r: 18 })}
      ${text(600, 236, L.wifi, { size: 22, weight: 650, fill: C.greenInk, fit: 230 })}
      ${text(600, 272, L.cable, { size: 18, fill: C.sub, fit: 230 })}
      ${text(600, 540, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 590, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Google's app then and now, beside the routes that replaced it. */
  status: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const lane = (y, head, col, names) => `
        ${card(560, y, 590, 112, { stroke: col, fill: "#0b1628", r: 16 })}
        ${text(690, y + 63, head, { size: 21, weight: 700, fill: col === C.green ? C.greenInk : col === C.amber ? C.amberInk : "#bcd4fb", fit: 220 })}
        ${text(970, y + 63, names, { size: 19, fill: C.ink, wrap: [330, 2], lh: 1.3 })}`;
      return frame(1200, 600, `
        ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 96, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(50, 140, 460, 400, { stroke: C.red, fill: "#1a1220", r: 18 })}
        ${text(280, 190, L.oldName, { size: 24, weight: 700, fill: "#ffffff", fit: 420 })}
        ${text(280, 222, L.oldBy, { size: 16, fill: C.sub, fit: 420 })}
        ${text(280, 278, L.was, { size: 15, fill: C.dim, fit: 420 })}
        ${text(280, 312, L.wasText, { size: 18, fill: C.ink, wrap: [400, 2], lh: 1.3 })}
        ${text(280, 380, L.now, { size: 15, fill: C.dim, fit: 420 })}
        ${text(280, 418, L.nowText, { size: 19, weight: 650, fill: C.redInk, wrap: [400, 2], lh: 1.3 })}
        ${text(280, 500, L.mirror, { size: 16, fill: C.amberInk, wrap: [400, 2], lh: 1.3 })}
        <path d="M518 340 H548" stroke="${C.sub}" stroke-width="3" stroke-linecap="round"/>
        <path d="M538 330 L548 340 L538 350" stroke="${C.sub}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${text(855, 160, L.howLabel, { size: 16, weight: 650, fill: C.sub, fit: 560 })}
        ${lane(178, L.l0, C.blue, L.l0names)}
        ${lane(304, L.l1, C.green, L.l1names)}
        ${lane(430, L.l2, C.amber, L.l2names)}
      `);
    },
  },

  /* Three questions to a route. */
  routes: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const box = (x, y, s, col, strong) => `${card(x, y, 300, 92, { stroke: col, fill: strong ? "#0f1e36" : "#0b1628", r: 16 })}
        ${text(x + 150, y + 52, s, { size: strong ? 19 : 18, weight: strong ? 650 : 400, fill: strong ? C.ink : col === C.green ? C.greenInk : C.amberInk, wrap: [270, 2], lh: 1.25 })}`;
      const arrow = (x1, y1, x2, y2, lab, lx, ly) => `
        <path d="M${x1} ${y1} L${x2} ${y2}" stroke="${C.sub}" stroke-width="2.5" stroke-dasharray="7 6"/>
        <circle cx="${x2}" cy="${y2}" r="4" fill="${C.sub}"/>
        ${text(lx, ly, lab, { size: 15, weight: 650, fill: C.sub, fit: 110 })}`;
      return frame(1200, 640, `
        ${text(600, 58, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 96, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${box(450, 130, L.q1, C.blue, true)}
        ${box(450, 290, L.q2, C.blue, true)}
        ${box(450, 450, L.q3, C.blue, true)}
        ${box(60, 290, L.r1, C.amber)}
        ${box(60, 450, L.r2, C.amber)}
        ${box(840, 370, L.r3, C.green)}
        ${box(840, 530, L.r4, C.green)}
        ${arrow(600, 222, 600, 290, L.yes, 640, 262)}
        ${arrow(600, 382, 600, 450, L.yes, 640, 422)}
        ${arrow(450, 176, 210, 290, L.no, 300, 214)}
        ${arrow(450, 336, 210, 450, L.no, 395, 408)}
        ${arrow(750, 496, 840, 416, L.yes, 790, 440)}
        ${arrow(750, 496, 840, 576, L.no, 790, 560)}
      `);
    },
  },
};
