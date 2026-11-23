import type { Robots, Sitemap } from "./metadata";

// The text of sitemap.xml and robots.txt, as Next writes it for the same data.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function sitemapXml(entries: Sitemap): string {
  const alternates = entries.some((e) => Object.keys(e.alternates?.languages ?? {}).length > 0);
  let out = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  if (alternates) out += ' xmlns:xhtml="http://www.w3.org/1999/xhtml"';
  out += ">\n";
  for (const e of entries) {
    for (const k of Object.keys(e)) if (!["url", "lastModified", "changeFrequency", "priority", "alternates"].includes(k)) throw new Error(`sitemap: unknown field ${k}`);
    out += `<url>\n<loc>${esc(e.url)}</loc>\n`;
    for (const [lang, href] of Object.entries(e.alternates?.languages ?? {})) out += `<xhtml:link rel="alternate" hreflang="${lang}" href="${esc(String(href))}" />\n`;
    if (e.lastModified) out += `<lastmod>${e.lastModified instanceof Date ? e.lastModified.toISOString() : e.lastModified}</lastmod>\n`;
    if (e.changeFrequency) out += `<changefreq>${e.changeFrequency}</changefreq>\n`;
    if (typeof e.priority === "number") out += `<priority>${e.priority}</priority>\n`;
    out += "</url>\n";
  }
  return `${out}</urlset>\n`;
}

export function robotsTxt(data: Robots): string {
  let out = "";
  for (const rule of [data.rules].flat()) {
    for (const k of Object.keys(rule)) if (!["userAgent", "allow", "disallow"].includes(k)) throw new Error(`robots: unknown field ${k}`);
    for (const agent of [rule.userAgent ?? "*"].flat()) out += `User-Agent: ${agent}\n`;
    for (const p of [rule.allow ?? []].flat()) out += `Allow: ${p}\n`;
    for (const p of [rule.disallow ?? []].flat()) out += `Disallow: ${p}\n`;
    out += "\n";
  }
  for (const s of [data.sitemap ?? []].flat()) out += `Sitemap: ${s}\n`;
  return out;
}
