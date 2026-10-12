import { C, frame, text, logo, phone } from "./kit.mjs";

/**
 * The preview image of a receive link (/transfer/<code>): what WhatsApp,
 * Telegram, iMessage and the rest show under the file name when someone
 * pastes a BIShare link. It names no file on purpose: the file name, size and
 * sender are already the preview's title and description, which chat apps set
 * in the reader's own fonts, while an image would need a font for every
 * script a file name can be written in.
 *
 * Run: node tool/landing-art.mjs transfer-share
 */
export const ns = "flows";

/** Only the .jpg is used (og:image), so no .webp is written. */
export const jpgOnly = true;

const doc = (x, y) => `
  <g transform="translate(${x},${y})">
    <path d="M0 16 a16 16 0 0 1 16 -16 H80 L124 44 V150 a16 16 0 0 1 -16 16 H16 a16 16 0 0 1 -16 -16 Z" fill="#13254a" stroke="${C.blue}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M80 0 V30 a14 14 0 0 0 14 14 H124" fill="none" stroke="${C.blue}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="22" y="70" width="80" height="9" rx="4.5" fill="${C.blue}" opacity="0.45"/>
    <rect x="22" y="92" width="62" height="9" rx="4.5" fill="${C.blue}" opacity="0.3"/>
    <rect x="22" y="114" width="72" height="9" rx="4.5" fill="${C.blue}" opacity="0.3"/>
  </g>`;

/* A browser window with a download arrow: the receiver needs nothing else. */
const receiver = (x, y) => `
  <g>
    <rect x="${x}" y="${y}" width="300" height="196" rx="14" fill="#101d36" stroke="${C.green}" stroke-opacity="0.7" stroke-width="2.5"/>
    <path d="M${x} ${y + 36} H${x + 300}" stroke="${C.green}" stroke-opacity="0.4" stroke-width="2"/>
    <circle cx="${x + 22}" cy="${y + 18}" r="5" fill="${C.red}" opacity="0.7"/><circle cx="${x + 40}" cy="${y + 18}" r="5" fill="${C.amber}" opacity="0.7"/><circle cx="${x + 58}" cy="${y + 18}" r="5" fill="${C.green}" opacity="0.7"/>
    <rect x="${x + 80}" y="${y + 10}" width="196" height="16" rx="8" fill="#15294a"/>
    <circle cx="${x + 150}" cy="${y + 112}" r="48" fill="${C.green}" fill-opacity="0.12" stroke="${C.green}" stroke-width="3"/>
    <path d="M${x + 150} ${y + 86} V${y + 130} M${x + 132} ${y + 113} L${x + 150} ${y + 131} L${x + 168} ${y + 113}" stroke="${C.greenInk}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 128} ${y + 146} H${x + 172}" stroke="${C.greenInk}" stroke-width="6" stroke-linecap="round"/>
  </g>`;

const dash = (x1, x2, y, col) =>
  `<path d="M${x1} ${y} H${x2}" stroke="${col}" stroke-width="3.5" stroke-dasharray="10 9" stroke-linecap="round"/>
   <path d="M${x2 - 12} ${y - 9} L${x2} ${y} L${x2 - 12} ${y + 9}" stroke="${col}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

export const images = {
  hero: {
    w: 1200, h: 630,
    draw: (L) => frame(1200, 630, `
      ${logo(600, 36, 1.2)}
      ${phone(228, 110, { kind: "iphone", accent: C.blue })}
      ${dash(392, 522, 245, C.blue)}
      ${doc(538, 162)}
      ${dash(680, 736, 245, C.green)}
      ${receiver(750, 147)}
      ${text(600, 470, L.title, { size: 54, weight: 700, fill: "#ffffff", fit: 1080 })}
      ${text(600, 524, L.sub, { size: 27, fill: C.sub, fit: 1060 })}
      ${text(600, 590, L.tag, { size: 21, weight: 600, fill: "#7fb6ff", fit: 1000 })}
    `),
  },
};
