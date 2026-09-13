import { C, frame, text, logo, card, laptop, phone, beam } from "./kit.mjs";

export const ns = "photosIphonePc";

const PURPLE = "#a78bfa";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => {
      const tiles = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) =>
        `<rect x="${c * 30}" y="${r * 30}" width="24" height="24" rx="5" fill="${[C.blue, C.green, C.amber, PURPLE][(r * 3 + c) % 4]}" fill-opacity="0.8"/>`)).join("");
      return frame(1200, 630, `
        ${logo(600, 44)}
        ${phone(230, 118, { kind: "iphone", label: L.left })}
        ${laptop(770, 150, { os: "win", accent: C.green, label: L.right })}
        ${beam(400, 780, 240)}
        <g transform="translate(556,194)">
          <rect x="-10" y="-10" width="108" height="108" rx="16" fill="#0f1e36" stroke="${C.blue}" stroke-width="2.5"/>
          ${tiles}
        </g>
        ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
        ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
      `);
    },
  },

  /* Three iCloud Photos settings, where the originals sit, and what a cable import gets. */
  originals: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const states = {
        full: { label: L.full, color: C.green },
        preview: { label: L.preview, color: C.amber },
        none: { label: L.none, color: C.dim },
      };
      const cols = [
        { head: L.off, phone: "full", cloud: "none", ok: true },
        { head: L.keep, phone: "full", cloud: "full", ok: true },
        { head: L.optimize, phone: "preview", cloud: "full", ok: false },
      ];
      const pill = (cx, y, s) => `<rect x="${cx - 130}" y="${y}" width="260" height="42" rx="21" fill="${s.color}" fill-opacity="0.16" stroke="${s.color}" stroke-width="2"/>
        ${text(cx, y + 28, s.label, { size: 18, weight: 700, fill: s.color === C.dim ? C.sub : s.color, fit: 240 })}`;
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${cols.map((c, n) => {
          const x = 60 + n * 373, cx = x + 167;
          const res = c.ok ? C.green : C.red;
          return `${card(x, 132, 334, 64, { stroke: n === 2 ? C.amber : C.blue, fill: "#0f1e36" })}
            ${text(cx, 172, c.head, { size: 21, weight: 700, fill: "#ffffff", fit: 300 })}
            ${card(x, 212, 334, 246, { stroke: C.line, fill: "#0b1628" })}
            ${text(cx, 246, L.onPhone, { size: 16, fill: C.sub, fit: 300 })}
            ${pill(cx, 258, states[c.phone])}
            ${text(cx, 348, L.inCloud, { size: 16, fill: C.sub, fit: 300 })}
            ${pill(cx, 360, states[c.cloud])}
            ${text(cx, 494, L.gets, { size: 16, fill: C.sub, fit: 300 })}
            ${card(x, 506, 334, 56, { stroke: res, fill: c.ok ? "#0c1f22" : "#221418" })}
            ${text(cx, 542, c.ok ? L.all : L.partial, { size: 20, weight: 700, fill: c.ok ? C.greenInk : C.redInk, fit: 300 })}
            ${c.ok ? "" : text(cx, 594, L.fix, { size: 16, fill: C.amberInk, fit: 330 })}`;
        }).join("")}
      `);
    },
  },

  /* The Transfer to Mac or PC setting, side by side. */
  formats: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const chip = (cx, y, s, color) => `<rect x="${cx - 58}" y="${y}" width="116" height="40" rx="10" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-width="2"/>
        ${text(cx, y + 27, s, { size: 18, weight: 700, fill: "#ffffff", ltr: true })}`;
      const arrow = (cx, y, color) => `<path d="M${cx - 26} ${y} H${cx + 22} M${cx + 12} ${y - 9} L${cx + 24} ${y} L${cx + 12} ${y + 9}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      const same = (cx, y, color) => `<path d="M${cx - 18} ${y - 5} H${cx + 18} M${cx - 18} ${y + 5} H${cx + 18}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
      const side = (x, color, title, convert, good, bad) => {
        const cx = x + 265;
        const row = (y, label, from, to) => `${text(cx, y, label, { size: 16, fill: C.sub, fit: 440 })}
          ${chip(cx - 110, y + 12, from, color)}
          ${convert ? arrow(cx, y + 32, color) : same(cx, y + 32, color)}
          ${chip(cx + 110, y + 12, to, color)}`;
        return `${card(x, 132, 530, 332, { stroke: color, fill: "#0f1e36" })}
          ${text(cx, 180, title, { size: 28, weight: 720, fill: "#ffffff", fit: 480 })}
          ${row(226, L.photo, "HEIC", convert ? "JPEG" : "HEIC")}
          ${row(312, L.video, "HEVC", convert ? "H.264" : "HEVC")}
          <circle cx="${x + 44}" cy="${404}" r="11" fill="${C.green}" fill-opacity="0.2" stroke="${C.green}" stroke-width="2"/>
          <path d="M${x + 38} 404 l4 4 l8 -8" stroke="${C.green}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          ${text(cx + 12, 411, good, { size: 18, fill: C.ink, fit: 420 })}
          <circle cx="${x + 44}" cy="${440}" r="11" fill="${C.amber}" fill-opacity="0.2" stroke="${C.amber}" stroke-width="2"/>
          <path d="M${x + 44} 434 v7 M${x + 44} 446 v0.5" stroke="${C.amber}" stroke-width="2.5" stroke-linecap="round"/>
          ${text(cx + 12, 447, bad, { size: 18, fill: C.ink, fit: 420 })}`;
      };
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${side(60, C.amber, L.auto, true, L.autoGood, L.autoBad)}
        ${side(610, C.green, L.keep, false, L.keepGood, L.keepBad)}
        ${card(60, 482, 1080, 54, { stroke: C.line, fill: "#0b1628" })}
        ${text(600, 516, L.ext, { size: 18, weight: 600, fill: C.ink, fit: 1040 })}
        ${text(600, 574, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
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
        ${side(ys[0], L.no, C.blue)}
        ${res(rx, ys[0], rw, L.cloud, C.blue)}
        ${down(ys[0], L.yes)}
        ${q(ys[1], L.q2)}
        ${side(ys[1], L.whole, C.green)}
        ${res(rx, ys[1], rw, L.cable, C.green)}
        ${down(ys[1], L.few)}
        ${q(ys[2], L.q3)}
        ${side(ys[2], L.same, C.green)}
        ${res(rx, ys[2], rw, L.wifi, C.green)}
        ${down(ys[2], L.away)}
        ${res(qx, ys[3], qw, L.link, PURPLE)}
      `);
    },
  },
};
