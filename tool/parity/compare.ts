// Compares what search engines read in two builds of the site. A side is a base URL or a folder of prerendered HTML.
//   npm run parity -- <a> <b> <urls.txt> [--only <regex>] [--engine <a engine>,<b engine>]
// --engine sends x-bs-engine (and x-bs-token from $PARITY_TOKEN) to each URL side, so one Worker can be compared with
// itself, Next against Hono.
import { readFileSync } from "node:fs";
import { type Difference, diff, extract } from "./extract";
import { htmlFile } from "./files";

const [a, b, list, ...flags] = process.argv.slice(2);
if (!a || !b || !list) {
  console.error("usage: parity <url|folder> <url|folder> <urls.txt> [--only <regex>]");
  process.exit(2);
}
const only = flags.includes("--only") ? new RegExp(flags[flags.indexOf("--only") + 1]!) : /./;
const engines = flags.includes("--engine") ? flags[flags.indexOf("--engine") + 1]!.split(",") : [];
const paths = readFileSync(list, "utf8").split("\n").filter((l) => l.startsWith("/") && only.test(l));

async function load(side: string, path: string, engine?: string): Promise<string | null> {
  if (!/^https?:/.test(side)) {
    const f = htmlFile(side, path);
    return f && readFileSync(f, "utf8");
  }
  for (let attempt = 0; ; attempt++) {
    // The cookie stops the language redirect, which is compared by its own tests.
    const locale = /^\/([a-z]{2}(?:-[A-Za-z]+)?)(?:\/|$)/.exec(path)?.[1] ?? "en";
    const res = await fetch(side + path, { redirect: "manual", headers: { cookie: `NEXT_LOCALE=${locale}`, "user-agent": "BIShare-parity/1", ...(engine ? { "x-bs-engine": engine, "x-bs-token": process.env.PARITY_TOKEN ?? "" } : {}) } }).catch((e: unknown) => { if (attempt > 3) throw e; return null; });
    if (res?.status === 200) return res.text();
    if (attempt > 3) return null;
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
}

let same = 0;
let missing = 0;
const bad: [string, Difference[]][] = [];
const queue = [...paths];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      const [x, y] = await Promise.all([load(a, p, engines[0]), load(b, p, engines[1])]);
      if (x === null || y === null) {
        missing++;
        console.log(`MISSING ${p} on ${x === null ? a : ""} ${y === null ? b : ""}`);
        continue;
      }
      const d = diff(extract(x), extract(y));
      if (d.length) bad.push([p, d]);
      else same++;
    }
  }),
);
for (const [p, d] of bad.slice(0, 12)) {
  console.log(`DIFF ${p}`);
  for (const x of d) console.log(`   ${x.field}\n     a: ${x.only[0].slice(0, 4).join(" | ").slice(0, 400)}\n     b: ${x.only[1].slice(0, 4).join(" | ").slice(0, 400)}`);
}
console.log(`${paths.length} URLs: ${same} identical, ${bad.length} different, ${missing} missing`);
process.exit(bad.length || missing ? 1 : 0);
