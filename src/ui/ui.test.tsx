import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getTranslations } from "@/i18n/translate";
import { withLocale } from "@/i18n/page-context";
import { Button } from "./button";
import { Icon } from "./icon";
import { Link } from "./link";

const json = (locale: string, ns: string) => JSON.parse(readFileSync(`src/messages/${locale}/${ns}.json`, "utf8"));

describe("getTranslations", () => {
  it("reads the page's locale", async () => {
    const t = await withLocale("ja", () => getTranslations("related"));
    expect(t("tryTransfer")).toBe(json("ja", "related").tryTransfer);
  });

  it("falls back to English for a missing key or namespace, like the site does", async () => {
    const t = await withLocale("id", () => getTranslations("related"), () => ({ id: {}, en: { related: { tryTransfer: "Send now", nested: { a: "A" } } } }));
    expect(t("tryTransfer")).toBe("Send now");
    expect(t("nested.a")).toBe("A");
  });

  it("takes a locale of its own, as generateMetadata does", async () => {
    const t = await getTranslations({ locale: "de", namespace: "related" });
    expect(t("heading")).toBe(json("de", "related").heading);
  });

  it("renders rich text as elements", async () => {
    const t = await withLocale("en", () => getTranslations("x"), () => ({ en: { x: { m: "See <b>this</b> & <a>that</a>" } } }));
    const html = String(<p>{t.rich("m", { b: (c: string) => <strong>{c}</strong>, a: (c: string) => <a href="/y">{c}</a> })}</p>);
    expect(html).toBe('<p>See <strong>this</strong> &amp; <a href="/y">that</a></p>');
  });

  it("formats plurals and numbers the way the language writes them", async () => {
    const messages = { x: { n: "{n, plural, one {# file} other {# files}} {size, number}" } };
    const t = await withLocale("de", () => getTranslations("x"), () => ({ de: messages, en: messages }));
    expect(t("n", { n: 2, size: 1234.5 })).toBe("2 files 1.234,5");
  });

  it("fails the build on a missing message instead of printing its key", async () => {
    const t = await withLocale("en", () => getTranslations("related"));
    expect(() => t("no.such.key")).toThrow(/no\.such\.key/);
  });

  it("keeps the locales of concurrent pages apart", async () => {
    const one = (l: string) => withLocale(l, async () => { await new Promise((r) => setTimeout(r, Math.random() * 5)); return (await getTranslations("related"))("heading"); });
    const got = await Promise.all(["en", "ja", "ar", "de"].map(one));
    expect(got).toEqual(["en", "ja", "ar", "de"].map((l) => json(l, "related").heading));
  });
});

describe("Link", () => {
  const href = (locale: string, to: string) => withLocale(locale, async () => /href="([^"]*)"/.exec(String(<Link href={to}>x</Link>))?.[1]);
  it.each([
    ["en", "/faq", "/faq"], ["en", "/", "/"], ["id", "/faq", "/id/faq"], ["id", "/", "/id"], ["zh-Hant", "/faq#a", "/zh-Hant/faq#a"],
    ["id", "/faq?x=1", "/id/faq?x=1"], ["id", "/?x=1", "/id?x=1"], ["id", "#top", "#top"], ["id", "https://a.example/b", "https://a.example/b"], ["id", "mailto:a@b.c", "mailto:a@b.c"],
  ])("in %s sends %s to %s", async (locale, to, want) => expect(await href(locale, to)).toBe(want));
  it("escapes what it is given", async () => expect(await withLocale("en", async () => String(<Link href={'/a"><script>'}>x</Link>))).not.toContain("<script>"));
});

describe("Icon", () => {
  it("is hidden from screen readers unless it has a label", () => {
    expect(String(<Icon name="Check" />)).toContain('aria-hidden="true"');
    const labelled = String(<Icon name="Check" label="Yes" />);
    expect(labelled).toContain('aria-label="Yes"');
    expect(labelled).not.toContain("aria-hidden");
  });
});

describe("Button", () => {
  it("is a link inside the site, a new-tab link outside it, and a button otherwise", async () => {
    await withLocale("id", async () => {
      expect(String(<Button href="/transfer">x</Button>)).toMatch(/^<a href="\/id\/transfer" class="[^"]*btn/);
      expect(String(<Button href="https://a.example">x</Button>)).toMatch(/target="_blank" rel="noopener noreferrer"/);
      expect(String(<Button type="submit">x</Button>)).toMatch(/^<button type="submit"/);
    });
  });
  it("names its look with short classes", async () => {
    await withLocale("en", async () => expect(String(<Button href="/a" variant="secondary" size="lg" class="w-full">x</Button>)).toContain('class="btn btn-secondary btn-lg w-full"'));
  });
});
