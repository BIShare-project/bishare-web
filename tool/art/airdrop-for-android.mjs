import { C, frame, text, logo, card, phone } from "./kit.mjs";

export const ns = "airdrop";

const PURPLE = "#a78bfa";

/* Radio arcs above a device, opening upward. */
const waves = (cx, y, color) => [0, 1, 2].map((n) =>
  `<path d="M${cx - 18 - n * 16} ${y - n * 12} Q ${cx} ${y - 22 - n * 22} ${cx + 18 + n * 16} ${y - n * 12}" stroke="${color}" stroke-opacity="${0.85 - n * 0.25}" stroke-width="3" fill="none" stroke-linecap="round"/>`
).join("");

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 30)}
      ${waves(402, 132, C.green)}
      ${waves(797, 132, C.blue)}
      ${phone(330, 150, { kind: "android", accent: C.green, label: L.left })}
      ${phone(725, 150, { kind: "iphone", accent: C.blue, label: L.right })}
      <g fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M494 250 C 560 206, 640 206, 706 250" stroke="${C.green}" stroke-dasharray="9 8"/>
        <path d="M690 238 L707 251 L688 258" stroke="${C.green}"/>
        <path d="M706 330 C 640 374, 560 374, 494 330" stroke="${C.blue}" stroke-dasharray="9 8"/>
        <path d="M510 342 L493 329 L512 322" stroke="${C.blue}"/>
      </g>
      <rect x="566" y="276" width="68" height="28" rx="14" fill="#0f1e36" stroke="${C.line}" stroke-width="2"/>
      <circle cx="586" cy="290" r="5" fill="${C.green}"/><circle cx="614" cy="290" r="5" fill="${C.blue}"/>
      ${text(600, 548, L.title, { size: 50, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 596, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Google's list as four brand cards. */
  phones: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const cards = [
        { k: "g", x: 60, y: 132, color: C.blue },
        { k: "s", x: 620, y: 132, color: C.blueDeep },
        { k: "o", x: 60, y: 340, color: C.green },
        { k: "c", x: 620, y: 340, color: C.amber, dashed: true },
      ];
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${cards.map((c) => {
          const Lc = L[c.k];
          const cx = c.x + 260;
          return `<rect x="${c.x}" y="${c.y}" width="520" height="186" rx="18" fill="${c.dashed ? "#1a1508" : "#0f1e36"}" stroke="${c.color}" stroke-width="2.5" ${c.dashed ? `stroke-dasharray="10 8"` : ""}/>
            <rect x="${cx - 40}" y="${c.y + 18}" width="80" height="6" rx="3" fill="${c.color}" opacity="0.8"/>
            ${text(cx, c.y + (Lc.note ? 62 : 72), Lc.name, { size: 25, weight: 700, fill: "#ffffff", fit: 470 })}
            ${text(cx, c.y + (Lc.note ? 100 : 116), Lc.m1, { size: 19, fill: C.ink, fit: 470 })}
            ${text(cx, c.y + (Lc.note ? 128 : 146), Lc.m2, { size: 19, fill: C.ink, fit: 470 })}
            ${Lc.note ? `<rect x="${cx - 110}" y="${c.y + 142}" width="220" height="32" rx="16" fill="${C.amber}" fill-opacity="0.14" stroke="${C.amber}" stroke-width="1.5"/>
              ${text(cx, c.y + 164, Lc.note, { size: 16, weight: 650, fill: C.amberInk, fit: 200 })}` : ""}`;
        }).join("")}
        ${text(600, 568, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Apple AirDrop settings on the left, what Android sees on the right. */
  modes: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const rows = [
        { k: "r0", ok: false },
        { k: "r1", ok: false },
        { k: "r2", ok: true, timer: true },
        { k: "r3", ok: true },
      ];
      const eye = (cx, cy, ok) => {
        const col = ok ? C.green : C.dim;
        return `<path d="M${cx - 18} ${cy} Q ${cx} ${cy - 16} ${cx + 18} ${cy} Q ${cx} ${cy + 16} ${cx - 18} ${cy} Z" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="${cx}" cy="${cy}" r="5" fill="${col}"/>
          ${ok ? "" : `<path d="M${cx - 16} ${cy + 14} L${cx + 16} ${cy - 14}" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>`}`;
      };
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${rows.map((r, i) => {
          const y = 136 + i * 98;
          const col = r.ok ? C.green : C.dim;
          return `${card(80, y, 600, 76, { stroke: r.ok ? C.blue : C.line, fill: "#0f1e36", r: 38 })}
            <circle cx="126" cy="${y + 38}" r="14" fill="none" stroke="${r.ok ? C.blue : C.dim}" stroke-width="3"/>
            <circle cx="126" cy="${y + 38}" r="5" fill="${r.ok ? C.blue : C.dim}"/>
            ${text(395, y + 46, L[r.k], { size: 23, weight: 650, fill: r.ok ? "#ffffff" : C.sub, fit: 440 })}
            ${r.timer ? `<circle cx="646" cy="${y + 38}" r="15" fill="none" stroke="${C.amber}" stroke-width="2.5"/><path d="M646 ${y + 29} V${y + 38} L653 ${y + 43}" stroke="${C.amber}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : ""}
            <path d="M700 ${y + 38} H790 M778 ${y + 28} L792 ${y + 38} L778 ${y + 48}" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(810, y, 310, 76, { stroke: col, fill: r.ok ? "#0c1f22" : "#0b1628", r: 38 })}
            ${eye(858, y + 38, r.ok)}
            ${text(985, y + 46, r.ok ? L.shown : L.hidden, { size: 22, weight: 650, fill: r.ok ? C.greenInk : C.sub, fit: 200 })}`;
        }).join("")}
        ${text(600, 566, L.foot, { size: 17, fill: C.amberInk, fit: 1080 })}
      `);
    },
  },

  /* Three questions down the left, answers to the right. */
  fallback: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const steps = [
        { q: "q1", a: "a1", color: C.green, y: 128 },
        { q: "q2", a: "a2", color: C.blue, y: 280 },
        { q: "q3", a: "a3", color: PURPLE, y: 432 },
      ];
      return frame(1200, 600, `
        ${text(600, 60, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 96, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${steps.map((s, i) => {
          const mid = s.y + 48;
          return `${card(60, s.y, 580, 96, { stroke: C.line, fill: "#0f1e36" })}
            <circle cx="104" cy="${mid}" r="20" fill="none" stroke="${s.color}" stroke-width="2.5"/>
            ${text(104, mid + 8, String(i + 1), { size: 21, weight: 700, fill: s.color })}
            ${text(370, mid + 8, L[s.q], { size: 22, weight: 650, fill: "#ffffff", fit: 480 })}
            <path d="M652 ${mid} H742 M730 ${mid - 10} L744 ${mid} L730 ${mid + 10}" stroke="${s.color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${text(697, mid - 14, L.yes, { size: 16, weight: 650, fill: s.color, fit: 84 })}
            ${card(760, s.y, 380, 96, { stroke: s.color, fill: "#0b1628" })}
            ${text(950, mid + 8, L[s.a], { size: 21, weight: 650, fill: C.ink, fit: 340 })}
            ${i < 2 ? `<path d="M350 ${s.y + 104} V${s.y + 146} M340 ${s.y + 134} L350 ${s.y + 148} L360 ${s.y + 134}" stroke="${C.dim}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              ${text(420, s.y + 132, L.no, { size: 16, weight: 650, fill: C.sub, fit: 100 })}` : ""}`;
        }).join("")}
      `);
    },
  },
};
