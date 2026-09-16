import { C, frame, text, logo, card, browser, phone, beam } from "./kit.mjs";

export const ns = "wormholeAlt";

/**
 * A browser tab with its close button lit up, centred on (cx, cy). Wormhole
 * above 5 GB makes the sender's tab the server, so it cannot be closed until
 * the recipient finishes; the whole page turns on getting that freedom back,
 * so the hero shows the tab being closed while the transfer carries on.
 */
function closableTab(cx, cy, label) {
  return `<g transform="translate(${cx},${cy})">
    <rect x="-74" y="-48" width="148" height="96" rx="12" fill="#15294a" stroke="${C.green}" stroke-opacity="0.9" stroke-width="3"/>
    <path d="M-74 -22 H74" stroke="${C.green}" stroke-opacity="0.45" stroke-width="2"/>
    <circle cx="-58" cy="-35" r="4.5" fill="${C.red}" opacity="0.75"/>
    <circle cx="-42" cy="-35" r="4.5" fill="${C.amber}" opacity="0.75"/>
    <circle cx="-26" cy="-35" r="4.5" fill="${C.green}" opacity="0.75"/>
    <rect x="-52" y="-8" width="104" height="14" rx="7" fill="${C.green}" fill-opacity="0.3"/>
    <rect x="-52" y="14" width="66" height="14" rx="7" fill="${C.green}" fill-opacity="0.18"/>
    <circle cx="58" cy="-35" r="15" fill="${C.green}" fill-opacity="0.22" stroke="${C.green}" stroke-width="2.5"/>
    <path d="M51 -42 L65 -28 M65 -42 L51 -28" stroke="${C.green}" stroke-width="3.5" stroke-linecap="round"/>
    ${text(0, 78, label, { size: 18, weight: 650, fill: C.greenInk, fit: 230 })}
  </g>`;
}

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 44)}
      ${browser(150, 170, { label: L.left })}
      ${beam(470, 800, 300)}
      ${phone(820, 130, { kind: "iphone", label: L.right })}
      ${closableTab(600, 148, L.badge)}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* Three bands: stored below 5 GB, tab-carried above it, no server at all. */
  split: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const zones = [
        { k: "z1", apps: "z1apps", color: C.green, fill: "#0c1f22", y: 140, state: "stored" },
        { k: "z2", apps: "z2apps", color: C.amber, fill: "#221c10", y: 280, state: "tab" },
        { k: "z3", apps: "z3apps", color: C.blue, fill: "#0f1e36", y: 420, state: "direct" },
      ];
      const glyph = (x, cy, z) => {
        if (z.state === "stored")
          return `<rect x="${x}" y="${cy - 17}" width="96" height="34" rx="9" fill="${z.color}" fill-opacity="0.16" stroke="${z.color}" stroke-width="2"/>
            ${[-12, -2, 8].map((dy, n) => `<rect x="${x + 20}" y="${cy + dy}" width="56" height="7" rx="3.5" fill="${z.color}" fill-opacity="${0.6 - n * 0.14}"/>`).join("")}`;
        if (z.state === "tab")
          return `<rect x="${x}" y="${cy - 17}" width="96" height="34" rx="9" fill="${z.color}" fill-opacity="0.16" stroke="${z.color}" stroke-width="2"/>
            <rect x="${x + 14}" y="${cy - 9}" width="30" height="18" rx="4" fill="${z.color}" fill-opacity="0.5"/>
            <rect x="${x + 52}" y="${cy - 9}" width="30" height="18" rx="4" fill="${z.color}" fill-opacity="0.5"/>
            <path d="M${x + 44} ${cy} H${x + 52}" stroke="${z.color}" stroke-width="3"/>`;
        return `<rect x="${x}" y="${cy - 17}" width="96" height="34" rx="9" fill="${z.color}" fill-opacity="0.16" stroke="${z.color}" stroke-width="2" stroke-dasharray="7 6"/>
          <circle cx="${x + 20}" cy="${cy}" r="8" fill="none" stroke="${z.color}" stroke-width="3"/>
          <circle cx="${x + 76}" cy="${cy}" r="8" fill="none" stroke="${z.color}" stroke-width="3"/>
          <path d="M${x + 32} ${cy} H${x + 64}" stroke="${z.color}" stroke-width="3" stroke-linecap="round"/>`;
      };
      return frame(1200, 600, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${zones.map((z) => `${card(100, z.y, 1000, 118, { stroke: z.color, fill: z.fill })}
          ${glyph(130, z.y + 59, z)}
          ${text(620, z.y + 48, L[z.k], { size: 23, weight: 700, fill: "#ffffff", fit: 700 })}
          ${text(620, z.y + 88, L[z.apps], { size: 18, fill: C.ink, fit: 700 })}`).join("")}
        ${text(600, 578, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* Free size per transfer, log scale. Browser-to-browser streaming sits at the
     top of the scale because it names no ceiling. */
  limits: {
    mirror: true,
    w: 1200, h: 660,
    draw: (L) => {
      const rows = [
        { k: "send", v: "sendv", gb: 2.5, color: C.dim, ink: C.sub },
        { k: "proton", v: "protonv", gb: 5, color: C.blue, ink: "#bcd4fb" },
        { k: "tresorit", v: "tresoritv", gb: 5, color: C.blue, ink: "#bcd4fb" },
        { k: "wormhole", v: "wormholev", gb: 10, color: C.amber, ink: C.amberInk },
        { k: "swiss", v: "swissv", gb: 50, color: C.green, ink: C.greenInk },
        { k: "bishare", v: "bisharev", gb: 100, color: C.green, ink: C.greenInk },
        { k: "stream", v: "streamv", gb: 150, color: C.amber, ink: C.amberInk },
      ];
      const x0 = 400, x1 = 1120;
      const px = (gb) => x0 + (Math.log10(gb) / Math.log10(150)) * (x1 - x0);
      return frame(1200, 660, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 128, 1080, 470, { stroke: C.line, fill: "#0b1628" })}
        ${[1, 10, 100].map((g) => `<path d="M${px(g)} 146 V580" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="4 6"/>`).join("")}
        ${rows.map((r, i) => {
          const y = 166 + i * 58;
          const w = Math.max(px(r.gb) - x0, 14);
          // Centred labels only, so the Arabic mirror needs no anchor swap.
          return `${text(230, y + 23, L[r.k], { size: 18, weight: 650, fill: C.ink, fit: 300 })}
            <rect x="${x0}" y="${y}" width="${w}" height="34" rx="8" fill="${r.color}" fill-opacity="0.22" stroke="${r.color}" stroke-width="2"/>
            ${w > 300
              ? text(x0 + w / 2, y + 23, L[r.v], { size: 16, weight: 700, fill: "#ffffff", fit: w - 24, ltr: true })
              : text(x0 + w + 150, y + 23, L[r.v], { size: 16, weight: 600, fill: r.ink, fit: 280, ltr: true })}`;
        }).join("")}
        ${text(600, 634, L.foot, { size: 15, fill: C.dim, fit: 1080 })}
      `);
    },
  },

  /* The job on the left, what fits it on the right. */
  choose: {
    mirror: true,
    w: 1200, h: 620,
    draw: (L) => {
      const rows = [
        { k: "a", color: C.green, ink: C.greenInk },
        { k: "b", color: C.amber, ink: C.amberInk },
        { k: "c", color: C.amber, ink: C.amberInk },
        { k: "d", color: C.blue, ink: "#bcd4fb" },
        { k: "e", color: C.green, ink: C.greenInk },
      ];
      return frame(1200, 620, `
        ${text(600, 64, L.title, { size: 34, weight: 660, fit: 1080 })}
        ${text(600, 102, L.sub, { size: 19, fill: C.sub, fit: 1080 })}
        ${card(60, 128, 1080, 452, { stroke: C.line, fill: "#0b1628" })}
        ${rows.map((r, i) => {
          const y = 172 + i * 86;
          return `${i ? `<path d="M90 ${y - 43} H1110" stroke="${C.line}" stroke-width="1.5"/>` : ""}
            ${text(350, y + 7, L[r.k].need, { size: 21, weight: 640, fill: C.ink, wrap: [430, 2] })}
            <circle cx="620" cy="${y}" r="7" fill="${r.color}"/>
            <path d="M604 ${y} H584 M636 ${y} H656" stroke="${r.color}" stroke-width="2.5" stroke-linecap="round"/>
            ${text(890, y + 7, L[r.k].pick, { size: 20, weight: 700, fill: r.ink, wrap: [400, 2] })}`;
        }).join("")}
      `);
    },
  },
};
