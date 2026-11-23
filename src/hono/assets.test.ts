import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ASSETS } from "./assets.gen";

const pub = (p: string) => join(process.cwd(), "public", p);

describe("Hono static assets", () => {
  it("has a content-hashed stylesheet that exists", () => {
    expect(ASSETS.css).toMatch(/^\/_h\/site-[0-9a-f]{8}\.css$/);
    expect(existsSync(pub(ASSETS.css))).toBe(true);
  });

  it("serves every script and preloaded font it names", () => {
    for (const p of [...Object.values(ASSETS.scripts), ...ASSETS.fonts]) expect(existsSync(pub(p)), p).toBe(true);
    expect(ASSETS.fonts.length).toBeGreaterThan(0);
  });

  it("serves every font file the stylesheet names", () => {
    const urls = [...readFileSync(pub(ASSETS.css), "utf8").matchAll(/url\((\/_h\/fonts\/[^)]+)\)/g)].map((m) => m[1]!);
    expect(urls.length).toBeGreaterThan(10);
    for (const u of urls) expect(existsSync(pub(u)), u).toBe(true);
  });

  it("defines the font variables next/font defined and forbids motion", () => {
    const css = readFileSync(pub(ASSETS.css), "utf8");
    expect(css).toContain("--font-sans:");
    expect(css).toContain("--font-mono-plex:");
    expect(css).toMatch(/animation:none!important/);
    expect(css).toMatch(/transition:none!important/);
  });

  it("keeps the utility classes a landing page uses", () => {
    const css = readFileSync(pub(ASSETS.css), "utf8");
    for (const c of [".min-h-screen", ".bg-background", ".antialiased"]) expect(css).toContain(c);
  });
});
