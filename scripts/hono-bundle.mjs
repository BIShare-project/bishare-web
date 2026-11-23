// How the site's components are compiled for Hono, once for the build (hono/jsx, to HTML) and once for the browser
// (hono/jsx/dom, islands). Next, React and the UI libraries are replaced by the shared modules of src/hono; an import of
// anything else from them stops the build, so nothing of them can slip into a page.
import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import { build } from "esbuild";

export const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const hono = (p) => join(SRC, "hono", p);

const BOTH = {
  "framer-motion": hono("shim/motion.tsx"),
  "@base-ui/react/button": hono("shim/base-ui.tsx"),
  "@base-ui/react/input": hono("shim/base-ui.tsx"),
  "@/components/site/vbutton": hono("ui/vbutton.tsx"),
  "@/components/site/motion": hono("ui/motion.tsx"),
  "@/i18n/navigation": hono("ui/link.tsx"),
};
const PAGES_ONLY = {
  "next-intl/server": hono("i18n.ts"),
  "next-intl": hono("i18n.ts"),
  "next/link": hono("shim/next-link.tsx"),
  "next/navigation": hono("shim/next-navigation.ts"),
  "next/dynamic": hono("shim/next-dynamic.tsx"),
  "@/components/intl-scope": hono("shim/intl-scope.tsx"),
  "@/components/site/header": hono("ui/header.tsx"),
  "@/components/site/image-lightbox": hono("ui/image-lightbox.tsx"),
  "@/components/site/article-toc": hono("ui/article-toc.tsx"),
  "@/components/site/youtube-facade": hono("ui/youtube-facade.tsx"),
};
const BROWSER_ONLY = {
  "next-intl": hono("client/i18n.ts"),
  // The page's language, for links.
  [hono("page-locale.ts")]: hono("client/page-locale.ts"),
  [hono("ui/svg-shapes.tsx")]: hono("client/svg-shapes.tsx"),
  "next/dynamic": hono("client/next-dynamic.tsx"),
  "next/navigation": hono("client/next-navigation.ts"),
  "@/components/site/header": hono("client/no-header.ts"),
};
// MDX drops the line break between two one-line rows or cells of a table, which Next's compiler keeps: without it the
// words of two rows join in the text of the page.
const TABLE = new Set(["table", "thead", "tbody", "tr"]);
const LINE_BREAK = { type: "Program", sourceType: "module", comments: [], body: [{ type: "ExpressionStatement", expression: { type: "Literal", value: "\n", raw: '"\\n"' } }] };
function keepTableBreaks() {
  return function visit(node) {
    node.children?.forEach(visit);
    if (!TABLE.has(node.name)) return;
    node.children = node.children.flatMap((c, i, all) => {
      const before = all[i - 1]?.position;
      const apart = before && c.position && before.start.line === before.end.line && c.position.start.line > before.end.line;
      return apart ? [{ type: "mdxTextExpression", value: "", data: { estree: LINE_BREAK } }, c] : [c];
    });
  };
}

/** Client components without behaviour: plain HTML, no island. */
const STATIC = new Set(["src/app/[locale]/(site)/features/more-features.tsx", "src/components/site/feature-card.tsx", "src/components/site/qr-display.tsx", "src/components/site/glow-button.tsx"]);
const FORBIDDEN = /^(react-dom|next(\/|$)|next-intl|radix-ui|@radix-ui|@base-ui|class-variance-authority\/|cmdk|shadcn|@radix)/;

const ICONS = Object.fromEntries([...readFileSync(hono("ui/icons.gen.ts"), "utf8").matchAll(/^  (\w+): '(.*)',$/gm)].map((m) => [m[1], m[2]]));
const isClient = (text) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*["']use client["']/.test(text);

/** The components a client module exports, and whether it has a default export. */
function exportsOf(text) {
  const names = [...text.matchAll(/^export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/gm)].map((m) => m[1]);
  return { components: names.filter((n) => /^[A-Z][a-z]/.test(n)), others: names.filter((n) => !/^[A-Z][a-z]/.test(n)), hasDefault: /^export\s+default\b/m.test(text) };
}

/** @param {{ target: "pages" | "browser", islands?: Set<string> }} o */
function plugin({ target, islands }) {
  const named = { ...BOTH, ...(target === "pages" ? PAGES_ONLY : BROWSER_ONLY) };
  // A module is replaced however it is imported, "@/…" or "./…".
  const table = { ...named };
  for (const [k, v] of Object.entries(named)) if (k.startsWith("@/")) for (const ext of [".tsx", ".ts"]) table[join(SRC, k.slice(2)) + ext] = v;
  const jsx = target === "pages" ? "hono/jsx" : "hono/jsx/dom";
  return {
    name: `hono-${target}`,
    setup(b) {
      b.onResolve({ filter: /.*/ }, async (a) => {
        if (a.pluginData?.skip) return;
        if (a.path.endsWith("?impl")) return { path: a.path.slice(0, -5), suffix: "?impl" };
        if (table[a.path]) return { path: table[a.path] };
        // JSX and React's API come with React's prop meanings (server-props.ts at build time, client/react-props.ts in
        // the browser); the modules that give them import hono/jsx themselves.
        const dir = target === "browser" ? "client/" : "";
        const own = new RegExp(`src/hono/${dir}(jsx-runtime|react)\\.ts$`).test(a.importer ?? "");
        if (!own) {
          if (a.path === "react" || a.path === "hono/jsx" || a.path === "hono/jsx/dom") return { path: hono(`${dir}react.ts`) };
          if (/^(react|hono\/jsx(\/dom)?)\/jsx-(dev-)?runtime$/.test(a.path)) return { path: hono(`${dir}jsx-runtime.ts`) };
        }
        if (a.path === "react") return b.resolve(jsx, { kind: a.kind, resolveDir: ROOT, pluginData: { skip: true } });
        if (a.path === "react/jsx-runtime") return b.resolve(`${jsx}/jsx-runtime`, { kind: a.kind, resolveDir: ROOT, pluginData: { skip: true } });
        if (target === "browser" && /^hono\/jsx(\/jsx-(dev-)?runtime)?$/.test(a.path)) return b.resolve(a.path.replace("hono/jsx", "hono/jsx/dom"), { kind: a.kind, resolveDir: ROOT, pluginData: { skip: true } });
        if (a.path === "lucide-react") return { path: "icons", namespace: "virtual" };
        if (a.path === "next/image") return { path: "image", namespace: "virtual" };
        // Only Next's Worker has a Cloudflare context; src/lib/api.ts falls back to fetch without it.
        if (a.path === "@opennextjs/cloudflare") return { path: "no-cloudflare", namespace: "virtual" };
        if (a.path === "next-intl/routing") return { path: "routing", namespace: "virtual" };
        if (FORBIDDEN.test(a.path)) return { errors: [{ text: `"${a.path}" must not reach a Hono page (imported by ${relative(ROOT, a.importer)})` }] };
        if (a.path.startsWith(".")) {
          const r = await b.resolve(a.path, { kind: a.kind, resolveDir: a.resolveDir, importer: a.importer, pluginData: { skip: true } });
          return table[r.path] ? { path: table[r.path] } : r;
        }
      });
      b.onLoad({ filter: /^icons$/, namespace: "virtual" }, () => ({
        contents: `import { svgIcon } from ${JSON.stringify(hono("ui/svg-icon.tsx"))};\n${Object.entries(ICONS).map(([n, s]) => `export const ${n} = /*#__PURE__*/ svgIcon(${JSON.stringify(s)});`).join("\n")}`,
        resolveDir: ROOT,
      }));
      // next/image with images.unoptimized: a plain lazy <img>.
      b.onLoad({ filter: /^image$/, namespace: "virtual" }, () => ({
        contents: `import { jsx } from "hono/jsx";\nexport default ({ priority, className, ...p }) => jsx("img", { loading: priority ? undefined : "lazy", decoding: "async", ...p, class: className });`,
        resolveDir: ROOT,
      }));
      b.onLoad({ filter: /^no-cloudflare$/, namespace: "virtual" }, () => ({
        contents: 'export function getCloudflareContext() { throw new Error("no Cloudflare context outside Next"); }',
      }));
      b.onLoad({ filter: /^routing$/, namespace: "virtual" }, () => ({ contents: "export const defineRouting = (config) => config;" }));
      // Articles. src/mdx-components.tsx gives headings their ids and links their behaviour, as it does for Next.
      b.onLoad({ filter: /\.mdx$/ }, async (a) => {
        if (target !== "pages") return { errors: [{ text: `${a.path} must not reach the browser` }] };
        const js = await compile(readFileSync(a.path, "utf8"), { jsxImportSource: "hono/jsx", providerImportSource: join(SRC, "mdx-components.tsx"), rehypePlugins: [keepTableBreaks] });
        return { contents: String(js), resolveDir: SRC };
      });
      if (target === "pages") {
        b.onLoad({ filter: /src\/.*\.tsx$/ }, (a) => {
          if (a.suffix === "?impl") return;
          const file = relative(ROOT, a.path);
          const text = readFileSync(a.path, "utf8");
          if (!isClient(text) || STATIC.has(file)) return;
          islands?.add(file);
          const { components, others, hasDefault } = exportsOf(text);
          const id = JSON.stringify(file);
          const impl = JSON.stringify(`${a.path}?impl`);
          return {
            contents: [
              `import { island } from ${JSON.stringify(hono("island.tsx"))};`,
              `import * as M from ${impl};`,
              ...components.map((n) => `export const ${n} = island(${id}, "${n}", M.${n});`),
              ...others.map((n) => `export const ${n} = M.${n};`),
              ...(hasDefault ? [`export default island(${id}, "default", M.default);`] : []),
            ].join("\n"),
            resolveDir: ROOT,
          };
        });
      }
    },
  };
}

const common = (target) => ({
  absWorkingDir: ROOT,
  bundle: true,
  format: "esm",
  jsx: "automatic",
  jsxImportSource: target === "pages" ? "hono/jsx" : "hono/jsx/dom",
  // tsconfig says React; every file here is compiled for Hono.
  tsconfigRaw: { compilerOptions: { jsx: "react-jsx", jsxImportSource: target === "pages" ? "hono/jsx" : "hono/jsx/dom" } },
  alias: { "@": SRC },
  // As Next does: NEXT_PUBLIC_* variables are written into the code, and any other process.env read is undefined.
  define: {
    "process.env": "{}",
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(process.env.NEXT_PUBLIC_API_URL ?? "https://api.bishare.app"),
    ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith("NEXT_PUBLIC_") && k !== "NEXT_PUBLIC_API_URL").map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])),
  },
  logLevel: "warning",
});

/** Compiles the build-time renderer. Returns the client components the pages use. */
export async function bundlePages({ outfile, write = true }) {
  const islands = new Set();
  await build({
    ...common("pages"),
    entryPoints: [hono("build.tsx")],
    outfile,
    write,
    platform: "node",
    target: "node22",
    plugins: [plugin({ target: "pages", islands })],
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    // Only looking for islands: the file that lists them is not written yet.
    ...(write ? {} : { external: ["*assets.gen"] }),
  });
  return [...islands].sort();
}

/** Compiles the browser modules: every file of src/hono/client/*.ts(x) given, and one module per island. */
export async function bundleBrowser({ entries, islands, outdir }) {
  const name = (file) => file.replace(/^src\//, "").replace(/\.tsx$/, "").replace(/[^\w]+/g, "-");
  const points = [...entries.map((f) => ({ in: f, out: f.split("/").pop().replace(/\.tsx?$/, "") })), ...islands.map((f) => ({ in: join(ROOT, f), out: `island-${name(f)}` }))];
  const { metafile } = await build({
    ...common("browser"),
    entryPoints: points,
    outdir,
    entryNames: "[name]-[hash]",
    chunkNames: "chunk-[hash]",
    splitting: true,
    minify: true,
    target: "es2022",
    metafile: true,
    plugins: [plugin({ target: "browser" })],
  });
  const scripts = {};
  const built = {};
  for (const [file, meta] of Object.entries(metafile.outputs)) {
    if (!meta.entryPoint) continue;
    const entry = resolve(ROOT, meta.entryPoint);
    const url = `/_h/${file.split("/").pop()}`;
    const rel = relative(ROOT, entry);
    if (islands.includes(rel)) built[rel] = url;
    else if (entries.includes(entry)) scripts[entry.split("/").pop().replace(/\.tsx?$/, "")] = url;
  }
  return { scripts, islands: built };
}
