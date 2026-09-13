/**
 * Drawing kit for landing-page art. Every function returns an SVG string.
 *
 * Text is never positioned by guesswork: any <text> carrying data-fit (max
 * width) or data-wrap (max width + max lines) is shrunk or wrapped in the
 * browser by FIT_SCRIPT before the screenshot, so German, Russian, Hindi and
 * CJK labels all land inside their boxes. Everything text-bearing is centred,
 * which keeps Arabic readable without mirroring the whole layout.
 */

export const C = {
  bg0: "#070d1d", bg1: "#101a33", ink: "#e8eefc", sub: "#93a4c8", dim: "#64748b",
  card: "#0e1a2e", line: "#1e2c48", blue: "#60a5fa", blueDeep: "#3b82f6",
  green: "#22c55e", greenInk: "#7fd6a0", amber: "#f59e0b", amberInk: "#fcd34d",
  red: "#ef4444", redInk: "#fca5a5",
};

export const FONT =
  "-apple-system, 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', Arial, 'Hiragino Sans', 'PingFang SC', 'Apple SD Gothic Neo', 'Geeza Pro', 'Kohinoor Devanagari', 'Noto Sans', system-ui, sans-serif";
/* Latin-and-Cyrillic faces come before the CJK ones on purpose: Hiragino
   carries Cyrillic glyphs with full-width spacing, and Chromium picks it up
   for Russian if it is earlier in the stack. */

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Centred text. fit = max width (shrinks); wrap = [maxWidth, maxLines]. */
export function text(x, y, s, { size = 20, weight = 400, fill = C.ink, fit, wrap, lh = 1.25, anchor = "middle", ls, ltr } = {}) {
  const attrs = [
    `x="${x}"`, `y="${y}"`, `font-size="${size}"`, `font-weight="${weight}"`,
    `fill="${fill}"`, `text-anchor="${anchor}"`,
    fit ? `data-fit="${fit}"` : "",
    wrap ? `data-wrap="${wrap[0]}" data-lines="${wrap[1]}" data-lh="${lh}"` : "",
    ls ? `letter-spacing="${ls}"` : "",
    ltr ? `direction="ltr" unicode-bidi="isolate"` : "",
  ].filter(Boolean);
  return `<text ${attrs.join(" ")}>${esc(s)}</text>`;
}

export function frame(w, h, body, { glow = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}">
  <defs>
    <linearGradient id="a-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg0}"/><stop offset="1" stop-color="${C.bg1}"/></linearGradient>
    <radialGradient id="a-glow" cx="0.5" cy="0.4" r="0.65"><stop offset="0" stop-color="#2563eb" stop-opacity="0.24"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></radialGradient>
    <linearGradient id="lb-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3AA0FF"/><stop offset=".5" stop-color="#0A84FF"/><stop offset="1" stop-color="#0B3AD1"/></linearGradient>
    <radialGradient id="lb-glow" cx=".5" cy=".36" r=".72"><stop offset="0" stop-color="#8FD0FF" stop-opacity=".5"/><stop offset="1" stop-color="#8FD0FF" stop-opacity="0"/></radialGradient>
    <linearGradient id="lb-mk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D6E9FF"/></linearGradient>
    <radialGradient id="lb-nd" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#F0FCFF"/><stop offset=".45" stop-color="#22D3EE"/><stop offset="1" stop-color="#0AACD0"/></radialGradient>
    <linearGradient id="a-beam" gradientUnits="userSpaceOnUse" x1="380" y1="0" x2="820" y2="0"><stop offset="0" stop-color="${C.blueDeep}" stop-opacity="0.15"/><stop offset="0.5" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.green}" stop-opacity="0.2"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#a-bg)"/>
  ${glow ? `<rect width="${w}" height="${h}" fill="url(#a-glow)"/>` : ""}
  <g stroke="#ffffff" stroke-opacity="0.035">${gridLines(w, h)}</g>
  ${body}
</svg>`;
}

function gridLines(w, h) {
  let d = "";
  for (let y = 100; y < h; y += 100) d += `M0 ${y}H${w}`;
  for (let x = 100; x < w; x += 100) d += `M${x} 0V${h}`;
  return `<path d="${d}"/>`;
}

/** BIShare mark + wordmark, centred on cx. */
export function logo(cx, y, scale = 1) {
  const s = 0.0664 * scale;
  return `<g transform="translate(${cx - 52 * scale},${y})">
    <g transform="scale(${s})">
      <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#lb-bg)"/>
      <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#lb-glow)"/>
      <rect x="16" y="16" width="480" height="220" rx="112" fill="#FFFFFF" opacity=".07"/>
      <g fill="none" stroke="url(#lb-mk)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round">
        <path d="M217.1 351.5 L351.5 217.1"/><path d="M316.1 223.3 L351.5 217.1 L345.3 252.6"/>
        <path d="M294.9 160.5 L160.5 294.9"/><path d="M195.9 288.7 L160.5 294.9 L166.7 259.5"/>
      </g>
      <circle cx="256" cy="256" r="18" fill="url(#lb-nd)"/>
    </g>
    <text x="${44 * scale}" y="${25 * scale}" fill="#dbe4f6" font-size="${21 * scale}" font-weight="600" text-anchor="start" direction="ltr" unicode-bidi="isolate">BIShare</text>
  </g>`;
}

export function card(x, y, w, h, { stroke = C.line, fill = C.card, r = 16, sw = 2 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

/* ---- devices: each drawn inside a box whose top-left is (x, y) ---- */

export function laptop(x, y, { accent = C.blue, os = "mac", label = "" } = {}) {
  const screen = os === "win"
    ? `<g transform="translate(${x + 118},${y + 58})" fill="${accent}" opacity="0.9"><rect width="30" height="30" rx="2"/><rect x="34" width="30" height="30" rx="2"/><rect y="34" width="30" height="30" rx="2"/><rect x="34" y="34" width="30" height="30" rx="2"/></g>`
    : `<g transform="translate(${x + 150},${y + 90})"><circle r="34" fill="none" stroke="${accent}" stroke-width="6" opacity="0.9"/><circle r="10" fill="${accent}" opacity="0.9"/></g>`;
  return `<g>
    <rect x="${x + 20}" y="${y}" width="260" height="170" rx="14" fill="#101d36" stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5"/>
    <rect x="${x + 34}" y="${y + 14}" width="232" height="142" rx="6" fill="#15294a"/>
    ${screen}
    <path d="M${x} ${y + 182} H${x + 300} L${x + 286} ${y + 196} H${x + 14} Z" fill="#101d36" stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5" stroke-linejoin="round"/>
    ${label ? text(x + 150, y + 240, label, { size: 24, weight: 620, fill: accent === C.green ? C.greenInk : "#bcd4fb", fit: 290 }) : ""}
  </g>`;
}

export function phone(x, y, { accent = C.blue, kind = "iphone", label = "" } = {}) {
  const notch = kind === "iphone"
    ? `<rect x="${x + 46}" y="${y + 13}" width="52" height="13" rx="6.5" fill="#0a1226" stroke="${accent}" stroke-opacity="0.35"/>`
    : `<circle cx="${x + 72}" cy="${y + 20}" r="5" fill="#0a1226" stroke="${accent}" stroke-opacity="0.5"/>`;
  return `<g>
    <rect x="${x}" y="${y}" width="145" height="270" rx="26" fill="#101d36" stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5"/>
    ${notch}
    <rect x="${x + 16}" y="${y + 46}" width="113" height="92" rx="10" fill="#15294a"/>
    <rect x="${x + 16}" y="${y + 154}" width="113" height="10" rx="5" fill="${accent}" opacity="0.35"/>
    <rect x="${x + 16}" y="${y + 174}" width="80" height="10" rx="5" fill="${accent}" opacity="0.22"/>
    ${label ? text(x + 72, y + 318, label, { size: 24, weight: 620, fill: accent === C.green ? C.greenInk : "#bcd4fb", fit: 240 }) : ""}
  </g>`;
}

export function browser(x, y, { accent = C.blue, label = "" } = {}) {
  return `<g>
    <rect x="${x}" y="${y}" width="300" height="196" rx="14" fill="#101d36" stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5"/>
    <path d="M${x} ${y + 36} H${x + 300}" stroke="${accent}" stroke-opacity="0.4" stroke-width="2"/>
    <circle cx="${x + 22}" cy="${y + 18}" r="5" fill="${C.red}" opacity="0.7"/><circle cx="${x + 40}" cy="${y + 18}" r="5" fill="${C.amber}" opacity="0.7"/><circle cx="${x + 58}" cy="${y + 18}" r="5" fill="${C.green}" opacity="0.7"/>
    <rect x="${x + 80}" y="${y + 10}" width="196" height="16" rx="8" fill="#15294a"/>
    <rect x="${x + 70}" y="${y + 64}" width="160" height="96" rx="12" fill="none" stroke="${accent}" stroke-opacity="0.6" stroke-width="2.5" stroke-dasharray="8 7"/>
    <path d="M${x + 150} ${y + 132} V${y + 92} M${x + 136} ${y + 106} L${x + 150} ${y + 92} L${x + 164} ${y + 106}" stroke="${accent}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${label ? text(x + 150, y + 244, label, { size: 24, weight: 620, fill: accent === C.green ? C.greenInk : "#bcd4fb", fit: 290 }) : ""}
  </g>`;
}

/** Dashed double beam between two devices, with packets. */
export function beam(x1, x2, y) {
  const mid = (x1 + x2) / 2;
  return `<g fill="none" stroke="url(#a-beam)" stroke-width="3" stroke-dasharray="12 10" stroke-linecap="round">
    <path d="M${x1} ${y - 14} Q ${mid} ${y - 70} ${x2} ${y - 14}"/>
    <path d="M${x2} ${y + 14} Q ${mid} ${y + 70} ${x1} ${y + 14}"/>
  </g>
  <circle cx="${mid - 90}" cy="${y - 50}" r="7" fill="${C.blue}"/><circle cx="${mid + 60}" cy="${y - 55}" r="6" fill="#93c5fd"/><circle cx="${mid + 20}" cy="${y + 56}" r="7" fill="${C.green}"/>`;
}

/**
 * Runs inside the page before the screenshot: wraps [data-wrap] text into
 * tspans (words, or characters for scripts without spaces) and shrinks
 * [data-fit] / over-long wrapped text until it fits.
 */
export const FIT_SCRIPT = `
(() => {
  const NS = "http://www.w3.org/2000/svg";
  // Japanese and Chinese wrap between characters; Korean wraps at spaces like Latin.
  const noSpaces = (s) => /[\\u3040-\\u30ff\\u3400-\\u9fff\\uff00-\\uffef]/.test(s) && !/[\\uac00-\\ud7af]/.test(s);
  for (const t of document.querySelectorAll("text[data-wrap]")) {
    const max = +t.dataset.wrap, maxLines = +t.dataset.lines, lh = +t.dataset.lh;
    const raw = t.textContent, x = t.getAttribute("x"), y0 = +t.getAttribute("y");
    let size = +t.getAttribute("font-size");
    // CJK breaks between characters, but a Latin word, a number with its
    // unit ("10 GB", "50 Mbps") or a product name must never split.
    const cjk = noSpaces(raw);
    const tokens = cjk
      ? raw.match(/\\d+(?:[.,]\\d+)?\\s?(?:GB|MB\\/s|MB|Mbps|KB|TB)|[A-Za-z0-9][A-Za-z0-9.\\-+\\/]*|\\s+|./gu)
      : raw.split(" ");
    const joiner = cjk ? "" : " ";
    const layout = () => {
      t.textContent = "";
      const probe = document.createElementNS(NS, "tspan");
      t.appendChild(probe);
      const lines = []; let cur = "";
      const OPEN = "（「『【(", CLOSE = "、。，．）」』】)！？：；";
      for (const tok of tokens) {
        const next = cur ? cur + joiner + tok : tok;
        probe.textContent = next;
        if (probe.getComputedTextLength() > max && cur) {
          if (cjk && CLOSE.includes(tok)) { cur = next; continue; } // closers never start a line
          let carry = tok;
          while (cjk && cur.length > 1 && OPEN.includes(cur[cur.length - 1])) { carry = cur[cur.length - 1] + carry; cur = cur.slice(0, -1); } // openers never end one
          lines.push(cur); cur = carry;
        } else cur = next;
      }
      if (cur) lines.push(cur);
      t.textContent = "";
      return lines;
    };
    let lines = layout();
    const widest = () => Math.max(...[...t.children].map((c) => c.getComputedTextLength()), 0);
    for (let guard = 0; guard < 40; guard++) {
      t.textContent = "";
      lines.forEach((l, i) => {
        const s = document.createElementNS(NS, "tspan");
        s.setAttribute("x", x);
        s.setAttribute("y", String(y0 + (i - (lines.length - 1) / 2) * size * lh));
        s.textContent = l;
        t.appendChild(s);
      });
      const orphan = cjk && lines.length > 1 && [...lines[lines.length - 1]].length <= 2;
      if (lines.length <= maxLines && widest() <= max + 1 && !orphan) break;
      size -= 1; t.setAttribute("font-size", size); lines = layout();
    }
  }
  for (const t of document.querySelectorAll("text[data-fit]")) {
    const max = +t.dataset.fit; let size = +t.getAttribute("font-size");
    while (t.getComputedTextLength() > max && size > 9) { size -= 0.5; t.setAttribute("font-size", size); }
  }
})();
`;

/**
 * Right-to-left locales read tables, flows and bar charts from the right, so
 * those images are mirrored as a whole and every <text> is flipped back
 * around its own anchor, which keeps glyphs readable while the layout reads
 * right to left. Runs after FIT_SCRIPT. Heroes are left as drawn.
 */
export const MIRROR_SCRIPT = `
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.querySelector("svg");
  const w = +svg.getAttribute("width");
  const g = document.createElementNS(NS, "g");
  g.setAttribute("transform", "translate(" + w + ",0) scale(-1,1)");
  for (const el of [...svg.childNodes]) if (el.nodeName !== "defs") g.appendChild(el);
  svg.appendChild(g);
  for (const t of g.querySelectorAll("text")) {
    const x = +t.getAttribute("x");
    t.setAttribute("transform", "translate(" + 2 * x + ",0) scale(-1,1)");
  }
})();
`;
