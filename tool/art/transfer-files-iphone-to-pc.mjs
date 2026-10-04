import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "iphoneToPc";

const PURPLE = "#a78bfa";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => {
      // Three stacked documents instead of the photo grid on the photos page.
      const doc = (x, y, color) => `<g transform="translate(${x},${y})">
        <path d="M0 8 a8 8 0 0 1 8 -8 h34 l18 18 v54 a8 8 0 0 1 -8 8 h-44 a8 8 0 0 1 -8 -8 z" fill="#0f1e36" stroke="${color}" stroke-width="2.5"/>
        <path d="M42 0 v12 a6 6 0 0 0 6 6 h12" fill="none" stroke="${color}" stroke-width="2.5"/>
        <path d="M12 38 h36 M12 50 h36 M12 62 h22" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
      </g>`;
      return frame(1200, 630, `
        ${logo(600, 44)}
        ${phone(230, 118, { kind: "iphone", label: L.left })}
        ${laptop(770, 150, { os: "win", accent: C.green, label: L.right })}
        ${beam(400, 780, 240)}
        ${doc(536, 206, C.amber)}
        ${doc(570, 196, C.green)}
        ${doc(604, 186, C.blue)}
        ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
        ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
      `);
    },
  },

  /* Three kinds of content, where each is kept, whether a cable shows it, and the way out. */
  kinds: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const cols = [
        { head: L.c0, lives: L.l0, shown: true, out: L.o0 },
        { head: L.c1, lives: L.l1, shown: false, out: L.o1 },
        { head: L.c2, lives: L.l2, shown: false, out: L.o2 },
      ];
      const pill = (cx, y, s, color) => `<rect x="${cx - 146}" y="${y}" width="292" height="42" rx="21" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="2"/>
        ${text(cx, y + 28, s, { size: 17, weight: 700, fill: color === C.blue ? "#bcd4fb" : color === C.green ? C.greenInk : C.redInk, fit: 272 })}`;
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${cols.map((c, n) => {
          const x = 60 + n * 373, cx = x + 167;
          return `${card(x, 132, 334, 64, { stroke: c.shown ? C.green : C.amber, fill: "#0f1e36" })}
            ${text(cx, 172, c.head, { size: 21, weight: 700, fill: "#ffffff", fit: 300 })}
            ${card(x, 212, 334, 246, { stroke: C.line, fill: "#0b1628" })}
            ${text(cx, 246, L.lives, { size: 16, fill: C.sub, fit: 300 })}
            ${pill(cx, 258, c.lives, C.blue)}
            ${text(cx, 348, L.explorer, { size: 16, fill: C.sub, fit: 300 })}
            ${pill(cx, 360, c.shown ? L.shown : L.hidden, c.shown ? C.green : C.red)}
            ${text(cx, 494, L.out, { size: 16, fill: C.sub, fit: 300 })}
            ${card(x, 506, 334, 56, { stroke: C.green, fill: "#0c1f22" })}
            ${text(cx, 541, c.out, { size: 18, weight: 700, fill: C.greenInk, fit: 310 })}`;
        }).join("")}
      `);
    },
  },

  /* A ladder of three questions, each with a way out to the side. */
  routes: {
    mirror: true,
    w: 1200, h: 640,
    draw: (L) => {
      const qx = 60, qw = 480, rx = 700, rw = 440, h = 72;
      const ys = [132, 262, 392, 522];
      const q = (y, s) => `${card(qx, y, qw, h, { stroke: C.blue, fill: "#0f1e36" })}
        ${text(qx + qw / 2, y + 45, s, { size: 21, weight: 700, fill: "#ffffff", fit: 440 })}`;
      const res = (x, y, w, s, color) => `${card(x, y, w, h, { stroke: color, fill: "#0c1a24" })}
        ${text(x + w / 2, y + 45, s, { size: 20, weight: 700, fill: color === PURPLE ? "#c4b5fd" : color === C.green ? C.greenInk : "#bcd4fb", fit: w - 40 })}`;
      const side = (y, label, color) => `<path d="M${qx + qw} ${y + h / 2} H${rx - 8} M${rx - 20} ${y + h / 2 - 9} L${rx - 7} ${y + h / 2} L${rx - 20} ${y + h / 2 + 9}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${text((qx + qw + rx) / 2, y + h / 2 - 12, label, { size: 15, weight: 600, fill: C.sub, fit: 150 })}`;
      const down = (y, label) => `<path d="M${qx + qw / 2} ${y + h} V${y + 130 - 6} M${qx + qw / 2 - 9} ${y + 130 - 16} L${qx + qw / 2} ${y + 130 - 4} L${qx + qw / 2 + 9} ${y + 130 - 16}" stroke="${C.blue}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="${qx + qw / 2 + 18}" y="${y + h + 16}" width="170" height="28" rx="14" fill="#0b1628" stroke="${C.line}"/>
        ${text(qx + qw / 2 + 103, y + h + 35, label, { size: 15, weight: 600, fill: C.sub, fit: 156 })}`;
      return frame(1200, 640, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${q(ys[0], L.q1)}
        ${side(ys[0], L.no, PURPLE)}
        ${res(rx, ys[0], rw, L.r1, PURPLE)}
        ${down(ys[0], L.yes)}
        ${q(ys[1], L.q2)}
        ${side(ys[1], L.no, C.blue)}
        ${res(rx, ys[1], rw, L.r2, C.blue)}
        ${down(ys[1], L.yes)}
        ${q(ys[2], L.q3)}
        ${side(ys[2], L.yes, C.blue)}
        ${res(rx, ys[2], rw, L.r3, C.blue)}
        ${down(ys[2], L.any)}
        ${res(qx, ys[3], qw, L.r4, C.green)}
      `);
    },
  },
};
