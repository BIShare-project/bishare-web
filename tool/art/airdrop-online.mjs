import { C, frame, text, logo, card, browser, phone, beam } from "./kit.mjs";

export const ns = "airdropOnline";

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 48)}
      ${phone(180, 130, { label: L.left })}
      ${browser(790, 170, { accent: C.green, label: L.right })}
      ${beam(345, 770, 268)}
      ${text(600, 520, L.title, { size: 52, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 568, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* How it works: the server introduces, the file takes the direct path. */
  flow: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => frame(1200, 620, `
      ${text(600, 62, L.title, { size: 34, weight: 660, fit: 1080 })}
      ${text(600, 100, L.sub, { size: 19, fill: C.sub, fit: 1080 })}

      ${card(450, 134, 300, 96, { stroke: C.amber, fill: "#1a1608" })}
      ${text(600, 174, L.server, { size: 21, weight: 650, fill: C.amberInk, fit: 270 })}
      ${text(600, 206, L.hello, { size: 16, fill: C.sub, fit: 270 })}

      <g fill="none" stroke="${C.amber}" stroke-opacity="0.7" stroke-width="2.5" stroke-dasharray="6 8" stroke-linecap="round">
        <path d="M250 300 Q 300 190 444 184"/>
        <path d="M950 300 Q 900 190 756 184"/>
      </g>

      ${browser(100, 300, { label: L.a })}
      ${browser(800, 300, { accent: C.green, label: L.b })}

      <g fill="none" stroke="url(#a-beam)" stroke-width="5" stroke-linecap="round">
        <path d="M410 398 H790"/>
      </g>
      <path d="M776 384 L792 398 L776 412" stroke="${C.green}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="500" cy="398" r="8" fill="${C.blue}"/><circle cx="600" cy="398" r="8" fill="#93c5fd"/><circle cx="700" cy="398" r="8" fill="${C.green}"/>
      ${text(600, 446, L.direct, { size: 19, weight: 620, fill: C.ink, wrap: [360, 2], lh: 1.2 })}

      ${text(600, 588, L.foot, { size: 16, fill: C.dim, fit: 1080 })}
    `),
  },

  /* Situation chooser, six rows. */
  choose: {
    mirror: true,
    w: 1200, h: 860,
    draw: (L) => {
      const ids = ["0", "1", "2", "3", "4", "5"];
      const accent = [C.green, C.blue, C.blue, C.green, C.amber, C.dim];
      return frame(1200, 860, `
        ${text(600, 70, L.title, { size: 36, weight: 660, fit: 1080 })}
        ${text(600, 108, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${ids.map((i, n) => {
          const y = 144 + n * 116;
          return `
            <circle cx="92" cy="${y + 46}" r="20" fill="${accent[n]}" fill-opacity="0.16" stroke="${accent[n]}" stroke-width="2"/>
            ${text(92, y + 53, String(n + 1), { size: 19, weight: 700, fill: "#ffffff", ltr: true })}
            ${card(128, y, 500, 92)}
            ${text(378, y + 52, L.items[i].q, { size: 20, fill: C.ink, wrap: [460, 2] })}
            <path d="M640 ${y + 46} H700 M690 ${y + 36} L702 ${y + 46} L690 ${y + 56}" stroke="${accent[n]}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${card(714, y, 426, 92, { stroke: accent[n], fill: "#0f1e36" })}
            ${text(927, y + 52, L.items[i].a, { size: 21, weight: 640, fill: "#ffffff", wrap: [390, 2] })}
          `;
        }).join("")}
      `);
    },
  },
};
