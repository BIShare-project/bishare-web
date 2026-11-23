// The site on your machine: npm run dev, then http://localhost:8788. Saving a file under src/ or public/ builds it again.
import { spawn, spawnSync } from "node:child_process";
import { watch } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
function build() {
  for (const step of ["build-assets.mjs", "build-pages.mjs"]) {
    const r = spawnSync(process.execPath, [join(ROOT, "scripts", step)], { cwd: ROOT, stdio: "inherit" });
    if (r.status) return console.error(`✗ ${step} failed; the last good build stays`);
  }
}
build();

const api = process.env.API_URL ? ["--var", `API_URL:${process.env.API_URL}`] : [];
const worker = spawn("npx", ["wrangler", "dev", "--port", process.env.PORT ?? "8788", ...api, ...process.argv.slice(2)], { cwd: ROOT, stdio: "inherit" });
process.on("exit", () => worker.kill());

let timer;
for (const dir of ["src", "public"]) {
  watch(join(ROOT, dir), { recursive: true }, (_, f) => {
    if (!f || f.endsWith(".gen.ts") || f.includes(".test.") || f.startsWith("_h")) return;
    clearTimeout(timer);
    timer = setTimeout(build, 300);
  });
}
