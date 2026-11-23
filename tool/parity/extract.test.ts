import { describe, expect, it } from "vitest";
import { diff, extract } from "./extract";

const page = (o: Partial<Record<"title" | "canonical" | "lang" | "ld" | "body" | "robots" | "link", string>> = {}) => `<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charSet="utf-8"/>
<title>${o.title ?? "A &amp; B"}</title><meta name="description" content="D &quot;q&quot;"/>${o.robots ?? ""}
<link rel="canonical" href="${o.canonical ?? "https://bishare.app/x"}"/>
<link rel="alternate" hrefLang="${o.lang ?? "id"}" href="https://bishare.app/id/x"/><meta property="og:title" content="T"/></head>
<body><script type="application/ld+json">${o.ld ?? '{"@type":"FAQPage","a":[1,2]}'}</script><script>self.__next_f.push(["<h1>no</h1>"])</script>
<main>${o.body ?? '<h1>Hi<!-- --> there</h1><h2 id="s">One</h2><p>Some   text<br/>here</p><a href="/faq">F</a><a href="https://x.example/">out</a><img src="/a.webp" alt="Alt"/><svg><title>no</title></svg>'}</main>
<template><a href="/hidden">h</a></template></body></html>`;

describe("extract", () => {
  it("reads what search engines read", () => {
    expect(extract(page())).toMatchObject({
      lang: "en", dir: "ltr", title: "A & B", canonical: "https://bishare.app/x", hreflang: ["id https://bishare.app/id/x"],
      meta: ['description=D "q"', "og:title=T"], jsonLd: ['{"@type":"FAQPage","a":[1,2]}'], headings: ["h1 Hi there", "h2#s One"],
      links: ["/faq F", "https://x.example/ out"], images: ["/a.webp Alt"], text: "Hi thereOneSome text hereFout",
    });
  });
  it("ignores attribute case, order, quoting and JSON-LD key order", () => {
    const a = page({ ld: '{"a":[1,2],"@type":"FAQPage"}' }).replace("charSet", "charset").replace("hrefLang", "hreflang").replace('<link rel="canonical" href="https://bishare.app/x"/>', "<link href=https://bishare.app/x rel=canonical>").replaceAll("&quot;", "&#34;");
    expect(diff(extract(page()), extract(a))).toEqual([]);
  });
  it.each([
    ["title", page({ title: "Other" })], ["canonical", page({ canonical: "https://bishare.app/y" })], ["hreflang", page({ lang: "de" })], ["jsonLd", page({ ld: '{"@type":"FAQPage","a":[2,1]}' })],
    ["meta", page({ robots: '<meta name="robots" content="noindex"/>' })], ["headings", page().replace("<h2", "<h3").replace("</h2>", "</h3>")], ["links", page().replace('"/faq"', '"/about"')],
    ["images", page().replace('alt="Alt"', 'alt=""')], ["text", page().replace("Some", "Any")], ["lang", page().replace('lang="en"', 'lang="de"')], ["dir", page().replace('dir="ltr"', 'dir="rtl"')],
  ])("reports a changed %s", (field, other) => {
    expect(diff(extract(page()), extract(other)).map((d) => d.field)).toContain(field);
  });
  it("reports any changed attribute or element, but not looks", () => {
    const fields = (h: string) => diff(extract(page()), extract(h)).map((d) => d.field);
    expect(fields(page().replace('<a href="/faq"', '<a rel="nofollow" href="/faq"'))).toEqual(["structure"]);
    expect(fields(page().replace('<p>', '<p lang="de">'))).toEqual(["structure"]);
    expect(fields(page().replace("<p>", "<div>").replace("</p>", "</div>"))).toEqual(["structure"]);
    expect(fields(page().replace("<p>", '<p style="display:none">'))).toEqual(["structure"]);
    expect(fields(page().replace("<p>", '<p class="x" style="color:red">'))).toEqual([]);
    expect(fields(page().replace("</head>", '<link rel="icon" href="/f.ico"/></head>'))).toEqual(["icons"]);
  });
  it("reports a repeated or lost link", () => {
    expect(diff(extract(page()), extract(page().replace('<a href="/faq">F</a>', '<a href="/faq">F</a><a href="/faq">F</a>'))).map((d) => d.field)).toContain("links");
  });
});
