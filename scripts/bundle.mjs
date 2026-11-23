// Compiles the site's sources, once for rendering pages (hono/jsx, to HTML) and once for the browser (hono/jsx/dom).
// Where a module has a "<name>.browser" beside it, the browser gets that one.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { compile } from "@mdx-js/mdx";
import { build } from "esbuild";

export const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const site = (p) => join(SRC, "site", p);

// MDX drops the line break between two one-line rows or cells of a table: without it the words of two rows join in the
// text of the page.
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

/** A component with behaviour says so in its first line. */
const isIsland = (text) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*"island";/.test(text);

/** The exported components of a module (they become islands), and what else it exports. */
function exportsOf(text) {
  const names = [...text.matchAll(/^export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/gm)].map((m) => m[1]);
  return { components: names.filter((n) => /^[A-Z][a-z]/.test(n)), others: names.filter((n) => !/^[A-Z][a-z]/.test(n)), hasDefault: /^export\s+default\b/m.test(text) };
}

/** The namespaces the pages the Worker renders itself read (src/site/dynamic.tsx). */
const WORKER_MESSAGES = ["chrome", "common", "cookies", "beam", "flows", "nearby", "tool", "stats"];

/** src/i18n/message-files.ts for the Worker: the messages themselves, of those namespaces. */
function workerMessages() {
  const locales = readdirSync(join(SRC, "messages")).filter((l) => statSync(join(SRC, "messages", l)).isDirectory());
  const files = locales.flatMap((l) => WORKER_MESSAGES.map((ns) => [l, ns, join(SRC, "messages", l, `${ns}.json`)])).filter(([, , f]) => existsSync(f));
  return [
    ...files.map(([, , f], i) => `import m${i} from ${JSON.stringify(f)};`),
    `const files = { ${files.map(([l, ns], i) => `"${l}/${ns}": m${i}`).join(", ")} };`,
    `const known = new Set(${JSON.stringify(WORKER_MESSAGES)});`,
    'export function messageFile(locale, ns) { if (!known.has(ns)) throw new Error("messages of " + ns + " are not in the Worker"); return files[locale + "/" + ns] ?? {}; }',
  ].join("\n");
}

/** @param {{ target: "pages" | "browser", islands?: Set<string>, worker?: boolean }} o */
function plugin({ target, islands, worker = false }) {
  return {
    name: `site-${target}`,
    setup(b) {
      if (target === "browser") {
        // "<name>.browser" takes the place of "<name>", except for itself.
        b.onResolve({ filter: /^(@\/|\.)/ }, async (a) => {
          if (a.pluginData?.resolved) return;
          const r = await b.resolve(a.path, { kind: a.kind, resolveDir: a.resolveDir, importer: a.importer, pluginData: { resolved: true } });
          const own = /^(.*\/src\/.*?)(\.tsx?)$/.exec(r.path);
          if (!own || own[1].endsWith(".browser")) return r;
          const browser = [".ts", ".tsx"].map((ext) => `${own[1]}.browser${ext}`).find(existsSync);
          return browser && browser !== a.importer ? { path: browser } : r;
        });
        b.onLoad({ filter: /\.mdx$/ }, (a) => ({ errors: [{ text: `${a.path} must not reach the browser` }] }));
        return;
      }
      b.onLoad({ filter: /\.mdx$/ }, async (a) => {
        const js = await compile(readFileSync(a.path, "utf8"), { jsxImportSource: "@/jsx", providerImportSource: "@/pages/blog/elements", rehypePlugins: [keepTableBreaks] });
        return { contents: String(js), resolveDir: dirname(a.path) };
      });
      if (worker) b.onLoad({ filter: /\/src\/i18n\/message-files\.ts$/ }, () => ({ contents: workerMessages(), resolveDir: ROOT }));
      b.onResolve({ filter: /\?source$/ }, (a) => ({ path: a.path.slice(0, -7), suffix: "?source" }));
      b.onLoad({ filter: /\/src\/.*\.tsx$/ }, (a) => {
        if (a.suffix === "?source") return;
        const text = readFileSync(a.path, "utf8");
        if (!isIsland(text)) return;
        const file = relative(ROOT, a.path);
        islands?.add(file);
        const { components, others, hasDefault } = exportsOf(text);
        const id = JSON.stringify(file);
        return {
          contents: [
            `import { island } from ${JSON.stringify(site("island.tsx"))};`,
            `import * as M from ${JSON.stringify(`${a.path}?source`)};`,
            ...components.map((n) => `export const ${n} = island(${id}, "${n}", M.${n});`),
            ...others.map((n) => `export const ${n} = M.${n};`),
            ...(hasDefault ? [`export default island(${id}, "default", M.default);`] : []),
          ].join("\n"),
          resolveDir: ROOT,
        };
      });
    },
  };
}

const common = {
  absWorkingDir: ROOT,
  bundle: true,
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "@/jsx",
  alias: { "@": SRC },
  define: { "process.env.API_URL": JSON.stringify(process.env.API_URL ?? "https://api.bishare.app"), "process.env.SAVE_BRIDGE_URL": JSON.stringify(process.env.SAVE_BRIDGE_URL ?? "") },
  logLevel: "warning",
};

/** Compiles the program that renders the pages built ahead of time. Returns the islands they use. */
export async function bundlePages({ outfile, write = true }) {
  const islands = new Set();
  await build({
    ...common,
    entryPoints: [site("build.tsx")],
    outfile,
    write,
    platform: "node",
    target: "node26",
    plugins: [plugin({ target: "pages", islands })],
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    // Only looking for islands: the file that lists them is not written yet.
    ...(write ? {} : { external: ["*assets.gen"] }),
  });
  return [...islands].sort();
}

/** Compiles the pages the Worker renders itself (src/site/dynamic.tsx). Returns the islands they use. */
export async function bundleWorker({ outfile, write = true }) {
  const islands = new Set();
  await build({
    ...common,
    entryPoints: [site("dynamic.tsx")],
    outfile,
    write,
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["workerd", "worker", "browser", "import"],
    target: "es2022",
    minify: true,
    external: ["node:async_hooks", ...(write ? [] : ["*assets.gen"])],
    plugins: [plugin({ target: "pages", islands, worker: true })],
  });
  return [...islands].sort();
}

/** Compiles the browser modules: the shared ones given, and one module per island. */
export async function bundleBrowser({ entries, islands, outdir }) {
  const name = (file) => file.replace(/^src\//, "").replace(/\.tsx$/, "").replace(/[^\w]+/g, "-");
  const points = [...entries.map((f) => ({ in: f, out: f.split("/").pop().replace(/\.tsx?$/, "") })), ...islands.map((f) => ({ in: join(ROOT, f), out: `island-${name(f)}` }))];
  const { metafile } = await build({
    ...common,
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
  return { scripts, islands: built, inputs: Object.keys(metafile.inputs) };
}
