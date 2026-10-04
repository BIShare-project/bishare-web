import { C, frame, text, logo, card, laptop, beam } from "./kit.mjs";

export const ns = "toIpad";

const PURPLE = "#a78bfa";

/** Portrait tablet, 230 x 300, label underneath. The kit only has phone and laptop. */
function tablet(x, y, { accent = C.blue, label = "" } = {}) {
  const tile = (tx, ty, color) => `<rect x="${tx}" y="${ty}" width="54" height="54" rx="12" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-opacity="0.6" stroke-width="2"/>`;
  return `<g>
    <rect x="${x}" y="${y}" width="230" height="300" rx="24" fill="#101d36" stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5"/>
    <circle cx="${x + 115}" cy="${y + 12}" r="3.5" fill="#0a1226" stroke="${accent}" stroke-opacity="0.5"/>
    <rect x="${x + 14}" y="${y + 24}" width="202" height="262" rx="12" fill="#15294a"/>
    ${tile(x + 32, y + 46, C.blue)}${tile(x + 88, y + 46, C.amber)}${tile(x + 144, y + 46, C.green)}
    ${tile(x + 32, y + 110, PURPLE)}${tile(x + 88, y + 110, C.blue)}${tile(x + 144, y + 110, C.amber)}
    <rect x="${x + 32}" y="${y + 196}" width="166" height="10" rx="5" fill="${accent}" opacity="0.35"/>
    <rect x="${x + 32}" y="${y + 216}" width="120" height="10" rx="5" fill="${accent}" opacity="0.22"/>
    <rect x="${x + 32}" y="${y + 236}" width="140" height="10" rx="5" fill="${accent}" opacity="0.22"/>
    ${label ? text(x + 115, y + 344, label, { size: 24, weight: 620, fill: accent === C.green ? C.greenInk : "#bcd4fb", fit: 260 }) : ""}
  </g>`;
}

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => {
      const doc = (x, y, color) => `<g transform="translate(${x},${y})">
        <path d="M0 8 a8 8 0 0 1 8 -8 h34 l18 18 v54 a8 8 0 0 1 -8 8 h-44 a8 8 0 0 1 -8 -8 z" fill="#0f1e36" stroke="${color}" stroke-width="2.5"/>
        <path d="M42 0 v12 a6 6 0 0 0 6 6 h12" fill="none" stroke="${color}" stroke-width="2.5"/>
        <path d="M12 38 h36 M12 50 h36 M12 62 h22" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
      </g>`;
      return frame(1200, 630, `
        ${logo(600, 44)}
        ${laptop(120, 200, { os: "win", label: L.left })}
        ${tablet(830, 96, { accent: C.green, label: L.right })}
        ${beam(440, 810, 262)}
        ${doc(556, 226, C.amber)}
        ${doc(590, 216, C.green)}
        ${doc(624, 206, C.blue)}
        ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
        ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
      `);
    },
  },

  /* Three places a file can live on an iPad, and the best way into each. */
  where: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const cols = [
        { head: L.c0, lands: L.l0, way: L.w0, color: C.blue },
        { head: L.c1, lands: L.l1, way: L.w1, color: PURPLE },
        { head: L.c2, lands: L.l2, way: L.w2, color: C.amber },
      ];
      const ink = (c) => (c === C.blue ? "#bcd4fb" : c === PURPLE ? "#c4b5fd" : C.amberInk);
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${cols.map((c, n) => {
          const x = 60 + n * 373, cx = x + 167;
          return `${card(x, 132, 334, 72, { stroke: c.color, fill: "#0f1e36" })}
            ${text(cx, 177, c.head, { size: 21, weight: 700, fill: "#ffffff", fit: 300 })}
            ${card(x, 220, 334, 168, { stroke: C.line, fill: "#0b1628" })}
            ${text(cx, 262, L.lands, { size: 16, fill: C.sub, fit: 300 })}
            <rect x="${cx - 146}" y="${280}" width="292" height="64" rx="32" fill="${c.color}" fill-opacity="0.16" stroke="${c.color}" stroke-width="2"/>
            ${text(cx, 320, c.lands, { size: 21, weight: 700, fill: ink(c.color), fit: 270 })}
            <path d="M${cx} ${394} V${430} M${cx - 9} ${420} L${cx} ${432} L${cx + 9} ${420}" stroke="${C.green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${text(cx, 466, L.way, { size: 16, fill: C.sub, fit: 300 })}
            ${card(x, 482, 334, 84, { stroke: C.green, fill: "#0c1f22" })}
            ${text(cx, 532, c.way, { size: 19, weight: 700, fill: C.greenInk, wrap: [306, 2], lh: 1.15 })}`;
        }).join("")}
      `);
    },
  },

  /* Three questions, each answered by a route to the side; the last answer is straight down. */
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
        ${side(ys[0], L.yes, PURPLE)}
        ${res(rx, ys[0], rw, L.r1, PURPLE)}
        ${down(ys[0], L.no)}
        ${q(ys[1], L.q2)}
        ${side(ys[1], L.yes, C.blue)}
        ${res(rx, ys[1], rw, L.r2, C.blue)}
        ${down(ys[1], L.no)}
        ${q(ys[2], L.q3)}
        ${side(ys[2], L.no, C.blue)}
        ${res(rx, ys[2], rw, L.r3, C.blue)}
        ${down(ys[2], L.yes)}
        ${res(qx, ys[3], qw, L.r4, C.green)}
      `);
    },
  },

  /* Top port speed of each current iPad, Apple's technical specifications, log scale. */
  ports: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const rows = [
        { name: L.m0, mbps: 480, v: L.v0, color: C.amber },
        { name: L.m1, mbps: 10000, v: L.v1, color: C.blue },
        { name: L.m2, mbps: 10000, v: L.v2, color: C.blue },
        { name: L.m3, mbps: 40000, v: L.v3, color: C.green },
      ];
      const x0 = 400, span = 720, lo = Math.log10(100), hi = Math.log10(40000);
      const len = (s) => ((Math.log10(s) - lo) / (hi - lo)) * span;
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, n) => {
          const y = 190 + n * 88;
          const w = len(r.mbps);
          return `${text(215, y + 8, r.name, { size: 22, weight: 650, fill: "#ffffff", fit: 330 })}
            <rect x="${x0}" y="${y - 22}" width="${span}" height="44" rx="22" fill="#0e1a2e" stroke="${C.line}"/>
            <rect x="${x0}" y="${y - 22}" width="${w}" height="44" rx="22" fill="${r.color}" fill-opacity="${r.color === C.green ? 0.8 : 0.6}"/>
            ${w < 330
              ? text(x0 + w + 16, y + 7, `‎${r.v}‎`, { size: 19, weight: 700, fill: C.ink, anchor: "start", ltr: true })
              : text(x0 + w - 18, y + 7, `‎${r.v}‎`, { size: 19, weight: 700, fill: "#ffffff", anchor: "end", ltr: true })}`;
        }).join("")}
        ${card(120, 520, 960, 50, { stroke: C.line, fill: "#0b1628" })}
        ${text(600, 552, L.foot, { size: 17, fill: C.sub, fit: 920 })}
      `);
    },
  },
};
