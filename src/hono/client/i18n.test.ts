import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import { format, setMessages, useTranslations } from "./i18n";

const LOCALES = readdirSync("src/messages").filter((l) => !l.includes("."));
const strings = (v: unknown, path: string[] = []): [string, string][] =>
  typeof v === "string" ? [[path.join("."), v]] : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => strings(x, [...path, k])) : [];

describe("island messages", () => {
  // The engine of the rest of the site is the reference, for every message there is.
  it.each(LOCALES)("formats every message of %s as use-intl does", (locale) => {
    setMessages(locale, {});
    let n = 0;
    for (const f of readdirSync(join("src/messages", locale))) {
      const messages = JSON.parse(readFileSync(join("src/messages", locale, f), "utf8"));
      for (const [key, message] of strings(messages)) {
        if (/<\w+>/.test(message)) continue; // compared below, tags need functions
        const names = [...message.matchAll(/\{\s*(\w+)\s*(,)?/g)].map((m) => ({ name: m[1]!, number: m[2] !== undefined }));
        for (const num of names.some((x) => x.number) ? [0, 1, 2, 5, 21, 1234] : [7]) {
          const values = Object.fromEntries(names.map((x) => [x.name, x.number ? num : "V"]));
          const want = createTranslator({ locale, messages: { m: message }, onError: (e: Error) => { throw e; } } as never)("m" as never, values as never);
          expect(format(message, values).join(""), `${locale}/${f} ${key} (${num})`).toBe(want);
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(1000);
  });

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
});
