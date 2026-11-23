import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { format } from "./format";
import { setMessages, useTranslations } from "./translate.browser";

const LOCALES = readdirSync("src/messages").filter((l) => !l.includes("."));
const strings = (v: unknown, path: string[] = []): [string, string][] =>
  typeof v === "string" ? [[path.join("."), v]] : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => strings(x, [...path, k])) : [];

describe("messages", () => {
  it.each(LOCALES)("formats every message of %s", (locale) => {
    for (const f of readdirSync(join("src/messages", locale))) {
      for (const [key, message] of strings(JSON.parse(readFileSync(join("src/messages", locale, f), "utf8")))) {
        const names = [...message.matchAll(/\{\s*(\w+)/g)].map((m) => m[1]!);
        const values = Object.fromEntries([...names.map((x) => [x, 5]), ...[...message.matchAll(/<(\w+)>/g)].map((m) => [m[1], (c: unknown[]) => c.join("")])]);
        const out = format(locale, message, values).join("");
        expect(out, `${locale}/${f} ${key}`).not.toMatch(/\{\s*\w+\s*[,}]|plural,/);
      }
    }
  });

  // What use-intl 4.13.6, the engine before this one, made of them.
  const files = "{n, plural, =0 {none} one {# file} other {# files}}";
  const ru = "{n, plural, one {# файл} few {# файла} many {# файлов} other {# файла}}";
  it.each<[string, string, Record<string, unknown>, string]>([
    ["en", "Hello {name}", { name: "Ana" }, "Hello Ana"],
    ["en", files, { n: 0 }, "none"],
    ["en", files, { n: 1 }, "1 file"],
    ["en", files, { n: 1234 }, "1,234 files"],
    ["de", "{size, number}", { size: 1234.5 }, "1.234,5"],
    ["ru", ru, { n: 21 }, "21 файл"],
    ["ru", ru, { n: 2 }, "2 файла"],
    ["ru", ru, { n: 5 }, "5 файлов"],
    ["fr", files, { n: 0 }, "none"],
    ["fr", "{n, plural, one {# a} other {# b}}", { n: 0 }, "0 a"],
    ["ar", "{n, plural, two {اثنان} few {# قليل} other {# كثير}}", { n: 2 }, "اثنان"],
    ["en", "{who, select, me {You} other {{who}}} sent it", { who: "Bo" }, "Bo sent it"],
    ["en", "It''s '{'literal'}' and don't", {}, "It's {literal} and don't"],
    ["en", "# {n}", { n: 3 }, "# 3"],
  ])("in %s makes %s of %o %s", (locale, message, values, want) => expect(format(locale, message, values).join("")).toBe(want));

  it("keeps the pieces of rich text in order", () => {
    setMessages("en", { x: { m: "See <b>this {n}</b> &amp; <a>that</a>." } });
    expect(useTranslations("x").rich("m", { n: 3, b: (c: unknown[]) => ["b", c], a: (c: unknown[]) => ["a", c] })).toEqual(["See ", ["b", ["this 3"]], " &amp; ", ["a", ["that"]], "."]);
  });
  it("reads nested keys, raw values and absence", () => {
    setMessages("en", { y: { a: { b: "B" }, list: [1] } });
    const t = useTranslations("y.a");
    expect(t("b")).toBe("B");
    expect(useTranslations("y").raw("list")).toEqual([1]);
    expect(t.has("zz")).toBe(false);
  });

  it("gives the same translator every time, so an effect that depends on it runs once", () => {
    expect(useTranslations("tool")).toBe(useTranslations("tool"));
    expect(useTranslations("tool")).not.toBe(useTranslations("flows"));
  });

  it("follows the messages of the page", () => {
    setMessages("en", { zz: { a: "one" } });
    expect(useTranslations("zz")("a")).toBe("one");
    setMessages("en", { zz: { a: "two" } });
    expect(useTranslations("zz")("a")).toBe("two");
  });
});
