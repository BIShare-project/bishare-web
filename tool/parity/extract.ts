// What a search engine reads in a page, so two builds of the site can be compared whatever their markup looks like.

export interface PageFacts {
  lang: string;
  dir: string;
  title: string;
  canonical: string;
  hreflang: string[];
  meta: string[];
  jsonLd: string[];
  headings: string[];
  links: string[];
  images: string[];
  /** icon, manifest and app icon links. */
  icons: string[];
  text: string;
  /** Every element of the header, main and footer with its attributes, whatever its classes. */
  structure: string[];
}

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(\w+));/gi, (m, hex, dec, name) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(Number(dec)) : (NAMED[name] ?? m)));
const squeeze = (s: string) => s.replace(/[ \t\r\n]+/g, " ").trim();

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.replace(/^<[\w-]+/, "").matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    out[m[1]!.toLowerCase()] = decode(m[2] ?? m[3] ?? m[4]?.replace(/\/$/, "") ?? "");
  }
  return out;
}

const sorted = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sorted) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => [k, sorted(x)])) : v;

/** The text of some markup; only <br> separates words that the markup does not. */
const textOf = (html: string) => squeeze(decode(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "")));

const tags = (html: string, name: string) => [...html.matchAll(new RegExp(`<${name}(?=[\\s/>])(?:"[^"]*"|'[^']*'|[^>"'])*>`, "gi"))].map((m) => attributes(m[0]));

export function extract(html: string): PageFacts {
  const jsonLd = [...html.matchAll(/<script(?=[^>]*type="?application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => JSON.stringify(sorted(JSON.parse(m[1]!))));
  // The table of contents is drawn by script in both builds; one of them leaves an empty placeholder for it.
  const clean = html.replace(/<div data-toc=(?:"[^"]*"|'[^']*'|[^>"'])*><\/div>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|template|svg|noscript)\b[\s\S]*?<\/\1>/gi, "");
  const root = tags(clean, "html")[0] ?? {};
  const meta = tags(clean, "meta");
  const link = tags(clean, "link");
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(clean)?.[1] ?? "";
  const main = /<main\b[^>]*>([\s\S]*)<\/main>/i.exec(body)?.[1] ?? body;
  const rel = (name: string) => link.filter((l) => l.rel === name);
  return {
    lang: root.lang ?? "",
    dir: root.dir ?? "",
    title: textOf(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(clean)?.[1] ?? ""),
    canonical: rel("canonical").map((l) => l.href).join(" "),
    hreflang: rel("alternate").map((l) => `${l.hreflang ?? l.type} ${l.href}`).sort(),
    meta: meta
      .filter((m) => (m.name || m.property) && !["viewport", "next-size-adjust"].includes(m.name ?? ""))
      .map((m) => `${m.name ?? m.property}${m.media ? ` ${m.media}` : ""}=${m.content}`)
      .sort(),
    jsonLd: jsonLd.sort(),
    headings: [...body.matchAll(/<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map((m) => {
      const id = attributes(`<h${m[2]}`).id;
      return `${m[1]!.toLowerCase()}${id ? `#${id}` : ""} ${textOf(m[3]!)}`;
    }),
    links: [...body.matchAll(/<a\b((?:"[^"]*"|'[^']*'|[^>"'])*)>([\s\S]*?)<\/a>/gi)].map((m) => `${attributes(`<a${m[1]}`).href ?? ""} ${textOf(m[2]!)}`),
    images: tags(body, "img").map((i) => `${i.src} ${i.alt ?? ""}`),
    icons: link.filter((l) => ["icon", "apple-touch-icon", "manifest", "author", "preconnect"].includes(l.rel ?? "")).map((l) => `${l.rel} ${l.href} ${l.sizes ?? ""} ${l.type ?? ""}`),
    text: textOf(main),
    structure: ["header", "main", "footer"].flatMap((region) => structureOf(new RegExp(`<${region}\\b[\\s\\S]*</${region}>`, "i").exec(body)?.[0] ?? `(no ${region})`)),
  };
}

// Attributes that only drive looks or behaviour, and Next's own. A style that hides an element is kept.
const IGNORED = /^(class|style|data-nimg|data-swap|data-site-header|data-language|data-theme-toggle|data-menu|data-label-close|data-video|data-title|data-app-bar-close|data-slot|type|aria-hidden|onclick)$/;

function structureOf(html: string): string[] {
  return [...html.matchAll(/<(\/?)([a-z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi)]
    .map((m) => {
      const a = attributes(`<${m[2]}${m[3]}`);
      const hidden = /display:\s*none|visibility:\s*hidden/.test(a.style ?? "") ? " (hidden)" : "";
      const attrs = Object.keys(a).filter((k) => !IGNORED.test(k)).sort().map((k) => `${k}=${a[k] === "true" ? "" : a[k]}`).join(" ");
      return `${m[1]}${m[2]!.toLowerCase()}${attrs ? ` ${attrs}` : ""}${hidden}`;
    });
}

export interface Difference {
  field: keyof PageFacts;
  only: [string[], string[]];
}

export function diff(a: PageFacts, b: PageFacts): Difference[] {
  const out: Difference[] = [];
  for (const field of Object.keys(a) as (keyof PageFacts)[]) {
    const [x, y] = [a[field], b[field]];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (typeof x === "string" || typeof y === "string") {
      const [s, t] = [String(x), String(y)];
      let i = 0;
      while (i < s.length && s[i] === t[i]) i++;
      out.push({ field, only: [[s.slice(Math.max(0, i - 40), i + 120)], [t.slice(Math.max(0, i - 40), i + 120)]] });
    } else {
      const left = [...x];
      const right: string[] = [];
      for (const v of y) {
        const at = left.indexOf(v);
        if (at === -1) right.push(v);
        else left.splice(at, 1);
      }
      out.push({ field, only: left.length || right.length ? [left, right] : [["(order)"], ["(order)"]] });
    }
  }
  return out;
}
