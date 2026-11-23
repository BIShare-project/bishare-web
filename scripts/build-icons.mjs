// Writes src/hono/ui/icons.gen.ts: the shapes of the lucide icons the site uses. Run after adding an icon:
//   node scripts/build-icons.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lucide from "lucide-react";

const SRC = resolve(import.meta.dirname, "../src");
const names = new Set();
for (const f of readdirSync(SRC, { recursive: true })) {
  if (!/\.tsx?$/.test(f) || f.endsWith(".gen.ts") || f.includes(".test.")) continue;
  const text = readFileSync(join(SRC, f), "utf8");
  for (const [, list] of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"lucide-react"/g)) {
    for (const item of list.split(",")) {
      const name = item.trim().split(" as ")[0].trim();
      if (name && !name.startsWith("type ") && name !== "LucideIcon") names.add(name);
    }
  }
  for (const [, name] of text.matchAll(/<Icon\s[^>]*name="(\w+)"/g)) names.add(name);
}

const lines = [...names].sort().map((name) => {
  if (!lucide[name]) throw new Error(`lucide has no icon ${name}`);
  const svg = renderToStaticMarkup(createElement(lucide[name]));
  const shapes = svg.replace(/^<svg[^>]*>|<\/svg>$/g, "").replace(/><\/\w+>/g, "/>");
  return `  ${name}: '${shapes}',`;
});
const version = JSON.parse(readFileSync(resolve(import.meta.dirname, "../node_modules/lucide-react/package.json"), "utf8")).version;
writeFileSync(
  join(SRC, "hono/ui/icons.gen.ts"),
  `// Written by scripts/build-icons.mjs from lucide ${version} (ISC License, https://lucide.dev/license); do not edit.\nexport const ICONS = {\n${lines.join("\n")}\n} as const;\n`,
);
console.log(`${lines.length} icons`);
