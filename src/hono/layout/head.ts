import type { Metadata } from "next";
import { siteMetadata, THEME_COLORS } from "@/lib/site-shell";
import { ASSETS } from "../assets.gen";

// The <head> Next writes for the same metadata. A field this file does not know stops the build: it must be written
// here, never dropped.

const esc = (s: unknown) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function known(what: string, value: object, keys: string[]) {
  for (const k of Object.keys(value)) if (!keys.includes(k) && (value as Record<string, unknown>)[k] !== undefined) throw new Error(`head: unknown ${what} field "${k}"`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Next's metadata types are wide unions; known() guards what is read
type Loose = any;

export function renderHead(page: Metadata, locale: string): string {
  const site: Loose = siteMetadata(locale);
  const m: Loose = { ...site, ...page };
  known("metadata", m, ["metadataBase", "title", "description", "manifest", "appleWebApp", "alternates", "icons", "openGraph", "twitter", "verification", "other", "robots", "keywords", "authors"]);
  const abs = (u: string) => new URL(u, m.metadataBase).href.replace(/^(https:\/\/[^/]+)\/$/, "$1");
  const out: string[] = [];
  const meta = (name: string, content: unknown, attr = "name") => {
    if (content !== undefined && content !== null && content !== "") out.push(`<meta ${attr}="${name}" content="${esc(content)}">`);
  };
  const link = (attrs: Record<string, string | undefined>) =>
    out.push(`<link ${Object.entries(attrs).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}="${esc(v)}"`).join(" ")}>`);

  const title: string =
    typeof page.title === "string" ? site.title.template.replace("%s", page.title) : page.title ? ((page.title as Loose).absolute ?? (page.title as Loose).default) : site.title.default;
  if (!title) throw new Error("head: no title");

  out.push('<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">');
  for (const f of ASSETS.fonts) link({ rel: "preload", href: f, as: "font", type: "font/woff2", crossorigin: "" });
  link({ rel: "stylesheet", href: ASSETS.css });
  link({ rel: "preconnect", href: "https://api.bishare.app" });
  for (const c of THEME_COLORS) out.push(`<meta name="theme-color" content="${c.color}" media="${c.media}">`);
  out.push(`<title>${esc(title)}</title>`);
  meta("description", m.description);
  for (const a of [m.authors ?? []].flat()) {
    known("author", a, ["name", "url"]);
    if (a.url) link({ rel: "author", href: String(a.url) });
    meta("author", a.name);
  }
  if (m.manifest) link({ rel: "manifest", href: m.manifest });
  if (m.keywords) meta("keywords", [m.keywords].flat().join(","));
  if (m.robots) {
    if (typeof m.robots === "string") meta("robots", m.robots);
    else {
      known("robots", m.robots, ["index", "follow"]);
      meta("robots", [m.robots.index === undefined ? null : m.robots.index ? "index" : "noindex", m.robots.follow === undefined ? null : m.robots.follow ? "follow" : "nofollow"].filter(Boolean).join(", "));
    }
  }
  for (const [k, v] of Object.entries(m.other ?? {})) meta(k, v);

  if (m.alternates) {
    known("alternates", m.alternates, ["canonical", "languages", "types"]);
    if (m.alternates.canonical) link({ rel: "canonical", href: abs(m.alternates.canonical) });
    for (const [lang, href] of Object.entries(m.alternates.languages ?? {})) link({ rel: "alternate", hreflang: lang, href: abs(String(href)) });
    for (const [type, href] of Object.entries(m.alternates.types ?? {})) link({ rel: "alternate", type, href: abs(String(href)) });
  }
  if (m.verification) {
    known("verification", m.verification, ["other"]);
    for (const [k, v] of Object.entries(m.verification.other ?? {})) meta(k, v);
  }
  if (m.appleWebApp) {
    known("appleWebApp", m.appleWebApp, ["capable", "title", "statusBarStyle"]);
    if (m.appleWebApp.capable) meta("mobile-web-app-capable", "yes");
    meta("apple-mobile-web-app-title", m.appleWebApp.title);
    meta("apple-mobile-web-app-status-bar-style", m.appleWebApp.statusBarStyle);
  }

  const og = m.openGraph;
  if (og) {
    known("openGraph", og, ["title", "description", "url", "type", "siteName", "images", "publishedTime", "modifiedTime", "authors", "section", "tags", "locale"]);
    const p = (name: string, v: unknown) => meta(name, v, "property");
    p("og:title", og.title);
    p("og:description", og.description);
    p("og:url", og.url && abs(og.url));
    p("og:site_name", og.siteName);
    p("og:locale", og.locale);
    for (const i of [og.images ?? []].flat()) image("og", i, p, abs);
    p("og:type", og.type);
    if (og.type === "article") {
      p("article:published_time", og.publishedTime);
      p("article:modified_time", og.modifiedTime);
      for (const a of [og.authors ?? []].flat()) p("article:author", a);
      p("article:section", og.section);
      for (const t of [og.tags ?? []].flat()) p("article:tag", t);
    }
  }
  const tw = m.twitter;
  if (tw) {
    known("twitter", tw, ["card", "title", "description", "images", "site", "creator"]);
    meta("twitter:card", tw.card);
    meta("twitter:site", tw.site);
    meta("twitter:creator", tw.creator);
    meta("twitter:title", tw.title);
    meta("twitter:description", tw.description);
    for (const i of [tw.images ?? []].flat()) image("twitter", i, meta, abs);
  }

  if (m.icons) {
    known("icons", m.icons, ["icon", "apple"]);
    for (const i of [m.icons.icon ?? []].flat()) link({ rel: "icon", href: i.url, sizes: i.sizes, type: i.type });
    for (const i of [m.icons.apple ?? []].flat()) link({ rel: "apple-touch-icon", href: typeof i === "string" ? i : i.url });
  }
  return out.join("");
}

function image(prefix: string, i: Loose, put: (name: string, v: unknown) => void, abs: (u: string) => string) {
  if (typeof i === "string") return put(`${prefix}:image`, abs(i));
  known(`${prefix} image`, i, ["url", "width", "height", "alt", "type"]);
  put(`${prefix}:image`, abs(String(i.url)));
  put(`${prefix}:image:type`, i.type);
  put(`${prefix}:image:width`, i.width);
  put(`${prefix}:image:height`, i.height);
  put(`${prefix}:image:alt`, i.alt);
}
