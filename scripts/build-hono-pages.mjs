// Renders the Hono pages to HTML: node scripts/build-hono-pages.mjs [out folder]. Run build-hono-assets.mjs first.
//
// The pages are the components Next renders too. Here they are compiled for hono/jsx, and the few modules that belong to
// Next or React are replaced by the shared ones of src/hono. An import of anything else from Next, React or a UI library
// stops the build, so nothing of them can slip into a page.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "esbuild";

const ROOT = resolve(import.meta.dirname, "..");
const out = resolve(process.argv[2] ?? join(ROOT, ".hono/pages"));
const hono = (p) => join(ROOT, "src/hono", p);

const REPLACED = {
  "next-intl/server": hono("i18n.ts"),
  "next-intl": hono("i18n.ts"),
  "@/i18n/navigation": hono("ui/link.tsx"),
  "@/components/site/header": hono("ui/header.tsx"),
  "@/components/site/vbutton": hono("ui/vbutton.tsx"),
  "@/components/site/image-lightbox": hono("ui/image-lightbox.tsx"),
  "@/components/site/youtube-facade": hono("ui/youtube-facade.tsx"),
  "@/components/site/article-toc": hono("ui/article-toc.tsx"),
};
const FORBIDDEN = /^(react(\/|$)|react-dom|next(\/|$)|next-intl|framer-motion|radix-ui|@radix-ui|@base-ui|lucide-react|class-variance-authority|sonner|cmdk|shadcn)/;
const icons = [...readFileSync(hono("ui/icons.gen.ts"), "utf8").matchAll(/^  (\w+):/gm)].map((m) => m[1]);

const plugin = {
  name: "hono-pages",
  setup(b) {
    b.onResolve({ filter: /.*/ }, (a) => {
      if (a.path === "lucide-react") return { path: "icons", namespace: "virtual" };
      if (a.path === "next-intl/routing") return { path: "routing", namespace: "virtual" };
      // use-intl's message engine asks React one thing: is this value an element.
      if (a.path === "react" && a.importer.includes("/node_modules/use-intl/")) return { path: join(ROOT, "node_modules/hono/dist/jsx/index.js") };
      if (a.path === "next/image") return { path: "image", namespace: "virtual" };
      if (REPLACED[a.path]) return { path: REPLACED[a.path] };
      if (FORBIDDEN.test(a.path)) return { errors: [{ text: `"${a.path}" must not reach a Hono page (imported by ${a.importer})` }] };
    });
    b.onLoad({ filter: /^icons$/, namespace: "virtual" }, () => ({
      contents: `import { lucideIcon } from ${JSON.stringify(hono("ui/lucide.tsx"))};\n${icons.map((n) => `export const ${n} = lucideIcon("${n}");`).join("\n")}`,
      resolveDir: ROOT,
    }));
    // next/image with images.unoptimized: a plain lazy <img>.
    b.onLoad({ filter: /^image$/, namespace: "virtual" }, () => ({
      contents: `import { jsx } from "hono/jsx";\nexport default ({ priority, className, ...p }) => jsx("img", { loading: priority ? undefined : "lazy", decoding: "async", ...p, class: className });`,
      resolveDir: ROOT,
    }));
    b.onLoad({ filter: /^routing$/, namespace: "virtual" }, () => ({ contents: "export const defineRouting = (config) => config;" }));
    // Articles are compiled with the blog (not ported yet); a landing page only reads the registry's dates and slugs.
    b.onLoad({ filter: /\.mdx$/ }, (a) => ({ contents: `export default () => { throw new Error(${JSON.stringify(a.path)}); };` }));
    b.onLoad({ filter: /\.tsx?$/ }, (a) => {
      const text = readFileSync(a.path, "utf8");
      if (/^\s*["']use client["']/.test(text)) return { errors: [{ text: `client component ${a.path} must not reach a Hono page` }] };
    });
  },
};

const outfile = join(ROOT, "node_modules/.cache/hono-pages.mjs");
await build({
  absWorkingDir: ROOT,
  entryPoints: [hono("build.tsx")],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  jsx: "automatic",
  jsxImportSource: "hono/jsx",
  alias: { "@": join(ROOT, "src") },
  // tsconfig says React; every file of this bundle is Hono's.
  tsconfigRaw: { compilerOptions: { jsx: "react-jsx", jsxImportSource: "hono/jsx" } },
  plugins: [plugin],
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  logLevel: "warning",
});
const run = spawnSync(process.execPath, [outfile, out], { cwd: ROOT, stdio: "inherit" });
process.exit(run.status ?? 1);
