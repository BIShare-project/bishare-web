import { C, frame, text, logo, card, browser, phone, beam } from "./kit.mjs";

export const ns = "firefoxSendAlt";

/**
 * A key sitting inside a link, centred on (cx, cy). Firefox Send's defining
 * trick was putting the decryption key after the # so it never reached the
 * server, and every replacement on this page is judged on whether it still
 * does that, so the hero draws the key in the address rather than on a disk.
 */
function keyInLink(cx, cy, label) {
  return `<g transform="translate(${cx},${cy})">
    <rect x="-96" y="-26" width="192" height="52" rx="26" fill="#15294a" stroke="${C.green}" stroke-width="3"/>
    <rect x="-80" y="-8" width="60" height="16" rx="8" fill="${C.green}" fill-opacity="0.28"/>
    ${text(-4, 6, "#", { size: 26, weight: 700, fill: C.greenInk })}
    <g transform="translate(34,0)">
      <circle r="11" fill="none" stroke="${C.green}" stroke-width="3.5"/>
      <path d="M10 0 H44 M36 0 V11 M44 0 V13" stroke="${C.green}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </g>
    ${text(0, 60, label, { size: 18, weight: 650, fill: C.greenInk, fit: 250 })}
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
      ${keyInLink(600, 160, L.badge)}
      ${text(600, 540, L.title, { size: 46, weight: 680, fill: "#ffffff", fit: 1080 })}
      ${text(600, 588, L.sub, { size: 23, fill: C.sub, fit: 1060 })}
    `),
  },

  /* The three gaps that ended the service, as bands. */
  why: {
    mirror: true,
    w: 1200, h: 600,
    draw: (L) => {
      const zones = [
        { k: "z1", apps: "z1apps", color: C.red, fill: "#241318", y: 140, state: "noaccount" },
        { k: "z2", apps: "z2apps", color: C.red, fill: "#241318", y: 280, state: "noreport" },
        { k: "z3", apps: "z3apps", color: C.amber, fill: "#221c10", y: 420, state: "noread" },
      ];
      const glyph = (x, cy, z) => {
        const box = `<rect x="${x}" y="${cy - 17}" width="96" height="34" rx="9" fill="${z.color}" fill-opacity="0.16" stroke="${z.color}" stroke-width="2"/>`;
        const slash = `<path d="M${x + 12} ${cy + 13} L${x + 84} ${cy - 13}" stroke="${z.color}" stroke-width="3.5" stroke-linecap="round"/>`;
        if (z.state === "noaccount")
          return `${box}<circle cx="${x + 48}" cy="${cy - 5}" r="7" fill="none" stroke="${z.color}" stroke-width="3"/>
            <path d="M${x + 36} ${cy + 12} a12 12 0 0 1 24 0" fill="none" stroke="${z.color}" stroke-width="3"/>${slash}`;
        if (z.state === "noreport")
          return `${box}<path d="M${x + 34} ${cy - 12} h28 l-5 9 5 9 h-28 z" fill="${z.color}" fill-opacity="0.45"/>
            <path d="M${x + 34} ${cy - 12} V${cy + 13}" stroke="${z.color}" stroke-width="3" stroke-linecap="round"/>${slash}`;
        return `${box}<ellipse cx="${x + 48}" cy="${cy}" rx="18" ry="11" fill="none" stroke="${z.color}" stroke-width="3"/>
          <circle cx="${x + 48}" cy="${cy}" r="4.5" fill="${z.color}"/>${slash}`;
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

  /* Free size per transfer, log scale. A self-hosted instance sits at the top
     because its operator sets the ceiling. */
  limits: {
    mirror: true,
    w: 1200, h: 660,
    draw: (L) => {
      const rows = [
        { k: "sendvis", v: "sendvisv", gb: 2.5, color: C.blue, ink: "#bcd4fb" },
        { k: "oldsend", v: "oldsendv", gb: 2.5, color: C.dim, ink: C.sub },
        { k: "tresorit", v: "tresoritv", gb: 5, color: C.blue, ink: "#bcd4fb" },
        { k: "wormhole", v: "wormholev", gb: 10, color: C.blue, ink: "#bcd4fb" },
        { k: "swiss", v: "swissv", gb: 50, color: C.amber, ink: C.amberInk },
        { k: "bishare", v: "bisharev", gb: 100, color: C.green, ink: C.greenInk },
        { k: "selfhost", v: "selfhostv", gb: 150, color: C.green, ink: C.greenInk },
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
        { k: "b", color: C.green, ink: C.greenInk },
        { k: "c", color: C.blue, ink: "#bcd4fb" },
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
