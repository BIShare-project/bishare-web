// Uses the transfer tool for real on two builds of the site, the same steps on each, and checks what arrives.
//   node tool/parity/tools-e2e.mjs <receive base> <build A> [build B…] [--only name,name] [--path /]
// The builds must reach an API (local: bishare-api `wrangler dev --local --var CORS_ALLOW_LOOPBACK:true`, the web built
// with NEXT_PUBLIC_API_URL pointing at it). Receiving uses the receive pages of <receive base> (still on Next).
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args.splice(args.indexOf(name), 2)[1] : undefined);
const only = flag("--only")?.split(",");
const path = flag("--path") ?? "/";
// --site https://bishare.app: the pages open under the real site's address (the API accepts only its origins), their
// files still come from the local build. Receive links open on the real site, where those pages are unchanged.
// --local-api keeps the builds on the local API even then (Nearby through the save frame of the real receive host).
const site = flag("--site");
const localApi = args.includes("--local-api") && !!args.splice(args.indexOf("--local-api"), 1);
const LOCAL_API = "http://127.0.0.1:8787";
const API = "https://api.bishare.app";
/** Transfers made on the real API (code → delete token): all are deleted at the end, whatever happened. */
const made = new Map();
const [receiveBase, ...builds] = args;

const dir = join(tmpdir(), `tools-e2e-${process.pid}`);
mkdirSync(dir, { recursive: true });
const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);
function fixture(name, bytes) {
  const file = join(dir, name);
  writeFileSync(file, bytes);
  return { file, name, sha: sha(bytes), size: bytes.length };
}
const FILES = {
  bin: fixture("random-300k.bin", randomBytes(300_000)),
  text: fixture("Résumé 📄 notes.txt", Buffer.from("BIShare e2e — ünïcødé text\n".repeat(200))),
  image: fixture("pixel.png", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64")),
};

const IGNORED = [/cloudflareinsights/, /cdn-cgi\/rum/, /net::ERR_FAILED/];
const browser = await chromium.launch({ args: localApi ? ["--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights"] : [] });
/** Pages of the scenario running now, for screenshots when it fails. */
let live = [];

/** Serves `hosts` from a local build inside this browser context. */
async function serveFrom(ctx, hosts, base) {
  await ctx.route((url) => hosts.includes(url.hostname), async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: base + url.pathname + url.search, maxRedirects: 0 });
    // The local builds talk to the local API; under the real site's address they talk to the real one.
    if (!localApi && /javascript/.test(response.headers()["content-type"] ?? "")) return route.fulfill({ response, body: (await response.text()).replaceAll(LOCAL_API, API) });
    await route.fulfill({ response });
  });
}

async function open(base, { wait = ".studio-shell [role=group] button", init, at = path, ...opts } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, serviceWorkers: "block", ...opts });
  if (site) await serveFrom(ctx, [new URL(site).hostname], base);
  const origin = site ?? base;
  const page = await ctx.newPage();
  if (init) await page.addInitScript(init);
  const errors = [];
  live.push(page);
  page.errors = errors;
  page.on("console", (m) => (page.log ??= []).push(`${m.type()}: ${m.text()}`.slice(0, 300)));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !IGNORED.some((r) => r.test(m.text())) && errors.push(`console: ${m.text()}`));
  page.on("response", (r) => r.status() >= 400 && !IGNORED.some((x) => x.test(r.url())) && errors.push(`http ${r.status()}: ${r.url()}`));
  await page.goto(origin + at, { waitUntil: "networkidle" });
  if (wait) await page.waitForSelector(wait);
  const cookie = page.getByRole("button", { name: "Got it" });
  if (await cookie.count()) await cookie.click();
  return { ctx, page, errors };
}

/** Notes the transfers a page made (it remembers them itself, with their delete tokens). */
async function noteMade(page) {
  const list = await page.evaluate(() => JSON.parse(localStorage.getItem("bishare.web-transfers") ?? "[]")).catch(() => []);
  for (const t of list) if (t.deleteToken) made.set(t.rawCode, t.deleteToken);
}

const tab = (page, re) => page.locator(".studio-shell [role=group] button", { hasText: re });

/** Picks files into the link flow, sets its options, uploads, and returns the links shown. */
async function upload(page, files, { encrypt = null, expiry = null, oneTime = false } = {}) {
  await tab(page, /Link/).click();
  await page.locator('.studio-shell input[type=file]').first().setInputFiles(files.map((f) => f.file));
  for (const f of files) await page.getByText(f.name, { exact: false }).first().waitFor();
  if (expiry) await page.getByRole("radio", { name: `${expiry} hours` }).click();
  if (oneTime) await page.getByRole("switch", { name: /One-time download/ }).click();
  if (encrypt !== null) {
    const sw = page.getByRole("switch", { name: /End-to-end encryption/ });
    if ((await sw.getAttribute("aria-checked")) !== String(encrypt)) await sw.click();
  }
  await page.getByRole("button", { name: /^Upload \d+ files? · Get link$/ }).click();
  await page.getByText("Ready to share").waitFor({ timeout: 60_000 }).catch(async (e) => {
    const shot = join(dir, `fail-${Date.now()}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    throw new Error(`${e.message.split("\n")[0]} — ${shot} — ${(await page.locator(".studio-shell").innerText()).replace(/\s+/g, " ").slice(0, 300)}`);
  });
  await noteMade(page);
  const links = await page.getByRole("textbox", { name: /^Share link for / }).evaluateAll((xs) => xs.map((x) => x.value));
  return links;
}

/** Deletes every uploaded file from the result view; returns how many say "Deleted". */
async function removeAll(page) {
  const n = await page.getByRole("button", { name: "Delete", exact: true }).count();
  for (let i = 0; i < n; i++) {
    await page.getByRole("button", { name: "Delete", exact: true }).first().click();
    await page.getByRole("button", { name: /Confirm delete/ }).first().click();
    await page.waitForTimeout(800);
  }
  return page.getByText("Deleted — link disabled").count();
}

/** Opens a receive link on the receive base and downloads every file; returns name → sha. */
async function receive(link) {
  const url = new URL(link);
  const ctx = await browser.newContext({ acceptDownloads: true });
  // No save dialog in a headless browser: the page downloads through its service worker.
  await ctx.addInitScript(() => { delete window.showSaveFilePicker; delete Window.prototype.showSaveFilePicker; });
  const target = site ? link : receiveBase + url.pathname + url.search + url.hash;
  const page = await ctx.newPage();
  live.push(page);
  await page.goto(target, { waitUntil: "networkidle" });
  const got = {};
  const buttons = page.getByRole("button", { name: /download/i });
  await buttons.first().waitFor({ timeout: 30_000 }).catch(async (e) => {
    throw new Error(`${e.message.split("\n")[0]} — receive page: ${(await page.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 200)}`);
  });
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), buttons.first().click()]);
  const file = join(dir, `got-${Date.now()}-${download.suggestedFilename()}`);
  await download.saveAs(file);
  got[download.suggestedFilename()] = sha(readFileSync(file));
  await ctx.close();
  return got;
}

/** Two tabs of a page whose Nearby tool starts on a click (the embed of the guide pages). */
async function embedPair(base) {
  const a = await open(base, { wait: "h1" });
  const b = await open(base, { wait: "h1" });
  for (const side of [a, b]) {
    await side.page.evaluate(() => { window.showSaveFilePicker = undefined; });
    // The embed shows its tool only after this click.
    const start = side.page.getByRole("button", { name: /^Start (Nearby|sharing) here/ }).first();
    await start.scrollIntoViewIfNeeded();
    await start.click();
  }
  const nameOf = async (side) => {
    const text = side.page.getByText(/^You are /).first();
    await text.waitFor({ timeout: 30_000 });
    return (await text.innerText()).replace(/^You are /, "").trim();
  };
  return { a, b, nameA: await nameOf(a), nameB: await nameOf(b) };
}

/** Two tabs of the same build on Nearby; returns them with their own names. */
async function nearbyPair(base, mode, prepare = () => { delete window.showSaveFilePicker; window.showSaveFilePicker = undefined; }) {
  const a = await open(base);
  const b = await open(base);
  for (const side of [a, b]) {
    // A headless browser cannot answer a save dialog: both builds save through a plain download instead.
    await side.page.evaluate(prepare);
    await tab(side.page, /Nearby/).click();
  }
  if (mode === "code") {
    await a.page.getByRole("button", { name: "Private code" }).click();
    await a.page.getByRole("button", { name: "Create a code" }).click();
    const code = (await a.page.getByText("Room code").locator("xpath=following-sibling::p").innerText()).trim();
    await b.page.getByRole("button", { name: "Private code" }).click();
    await b.page.getByPlaceholder("6-character code").pressSequentially(code);
    await b.page.getByRole("button", { name: "Connect" }).click();
  }
  const nameOf = async (side) => (await side.page.getByText(/^You are /).first().innerText()).replace(/^You are /, "").trim();
  await a.page.getByText(/^You are /).first().waitFor({ timeout: 20_000 });
  await b.page.getByText(/^You are /).first().waitFor({ timeout: 20_000 });
  return { a, b, nameA: await nameOf(a), nameB: await nameOf(b) };
}

/** A sends `files` to B over Nearby; B accepts and saves each. Returns name → sha of what B saved. */
async function nearbySend({ a, b, nameB }, files) {
  // Stage the files (the input beside the drop zone), then send them to B's row.
  await a.page.getByText("Drop files here, or click to choose").waitFor({ timeout: 20_000 });
  await a.page.locator("xpath=//input[@type='file' and following-sibling::div[1][contains(., 'Drop files here')]]").setInputFiles(files.map((f) => f.file));
  await a.page.getByText(`${files.length} ready — now pick a device`).waitFor();
  const alias = nameB.replace(/^\S+\s/, "");
  await a.page.locator("li", { hasText: alias }).getByRole("button", { name: `Send ${files.length}` }).first().click({ timeout: 20_000 }).catch(async (e) => {
    const shot = join(dir, `nearby-fail-${Date.now()}.png`);
    await a.page.screenshot({ path: shot });
    throw new Error(`${e.message.split("\n")[0]} — looking for ${nameB} — ${shot} — ${(await a.page.locator(".studio-shell").innerText()).replace(/\s+/g, " ").slice(0, 400)}`);
  });
  // B answers every prompt (Accept, or Save when the file was staged) until all files have downloaded.
  const got = {};
  const saving = [];
  b.page.on("download", (d) => saving.push((async () => {
    const file = join(dir, `nearby-${Date.now()}-${d.suggestedFilename()}`);
    await d.saveAs(file);
    got[d.suggestedFilename()] = sha(readFileSync(file));
  })()));
  const until = Date.now() + 120_000;
  while (saving.length < files.length && Date.now() < until) {
    for (const name of ["Accept", "Save"]) {
      const button = b.page.getByRole("button", { name, exact: true }).first();
      if (await button.isVisible().catch(() => false)) await button.click().catch(() => {});
    }
    await b.page.waitForTimeout(250);
  }
  await Promise.all(saving);
  if (Object.keys(got).length < files.length) throw new Error(`B saved ${Object.keys(got).length} of ${files.length}`);
  return got;
}

/** Two people in one room: A makes it, B opens its link (cloud) or types its code (local). */
async function roomPair(base, mode) {
  const enter = async (side, name) => side.page.getByLabel("Your name").fill(name);
  const a = await open(base, { wait: "#room-alias", at: "/rooms" });
  await a.page.evaluate(() => { delete window.showSaveFilePicker; window.showSaveFilePicker = undefined; });
  // A name is asked for first.
  await a.page.getByRole("button", { name: mode === "local" ? "Local (P2P)" : "Cloud" }).click();
  await a.page.getByRole("button", { name: "Create a room" }).click();
  const asked = await a.page.getByText("Enter your name first.").count();
  await enter(a, "Ana");
  await a.page.getByRole("button", { name: "Create a room" }).click();
  await a.page.getByText("Room code").waitFor({ timeout: 20_000 });
  const panel = (await a.page.getByText("Room code").locator("xpath=ancestor::*[2]").innerText()).replace(/\s+/g, " ");
  const code = panel.replace(/^Room code/i, "").match(/\b(?!P2P\b|CLOUD\b|LOCAL\b)[A-Z0-9]{4}\b/)[0];
  const b = await open(base, { wait: "#room-alias", at: `/rooms?code=${code}${mode === "local" ? "&mode=local" : ""}` });
  await b.page.evaluate(() => { delete window.showSaveFilePicker; window.showSaveFilePicker = undefined; });
  const prefilled = await b.page.getByRole("textbox", { name: /^Code character / }).evaluateAll((xs) => xs.map((x) => x.value).join(""));
  const pressed = await b.page.getByRole("button", { name: mode === "local" ? "Local (P2P)" : "Cloud" }).getAttribute("aria-pressed");
  await enter(b, "Budi");
  await b.page.getByRole("button", { name: "Join", exact: true }).click();
  await b.page.getByText("Room code").waitFor({ timeout: 20_000 });
  await a.page.getByText("Budi").first().waitFor({ timeout: 30_000 });
  return { a, b, code, asked, prefilled: prefilled === code, pressed };
}

/** A shares a file in the room, B downloads it. */
async function roomShare({ a, b }, f) {
  await b.page.waitForTimeout(1500);
  await a.page.locator("input[type=file]").first().setInputFiles(f.file);
  await b.page.getByText(f.name).first().waitFor({ timeout: 60_000 });
  const [download] = await Promise.all([b.page.waitForEvent("download", { timeout: 60_000 }), b.page.getByRole("button", { name: "Download", exact: true }).first().click()]);
  const file = join(dir, `room-${Date.now()}`);
  await download.saveAs(file);
  return { name: download.suggestedFilename(), ok: sha(readFileSync(file)) === f.sha };
}

const SCENARIOS = {
  async roomCloud(base) {
    const r = await roomPair(base, "cloud");
    const sealed = await r.b.page.getByText("End-to-end encrypted").first().waitFor({ timeout: 20_000 }).then(() => true, () => false);
    const got = await roomShare(r, FILES.text);
    const people = await r.a.page.getByText(/^(Ana|Budi)$/).count();
    await r.a.page.getByRole("button", { name: "Close room" }).click();
    const closed = await r.b.page.getByText("The room was closed.").waitFor({ timeout: 15_000 }).then(() => true, () => false);
    return { asked: r.asked, prefilled: r.prefilled, pressed: r.pressed, sealed, ...got, people, closed, errors: [...r.a.errors, ...r.b.errors] };
  },
  async roomLocal(base) {
    const r = await roomPair(base, "local");
    const got = await roomShare(r, FILES.bin);
    await r.b.page.getByRole("button", { name: "Leave" }).click();
    const back = await r.b.page.locator("#room-alias").waitFor({ timeout: 10_000 }).then(() => true, () => false);
    return { asked: r.asked, prefilled: r.prefilled, pressed: r.pressed, ...got, back, errors: [...r.a.errors, ...r.b.errors] };
  },
  async roomMissing(base) {
    const { page, errors } = await open(base, { wait: "#room-alias", at: "/rooms?code=zzzz" });
    await page.getByLabel("Your name").fill("Ana");
    await page.getByRole("button", { name: "Join", exact: true }).click();
    const said = await page.getByText("Room not found or it has closed.").waitFor({ timeout: 45_000 }).then(() => true, () => false);
    return { said, errors: errors.filter((e) => !/ZZZZ|404/.test(e)) };
  },
  async load(base) {
    const { ctx, page, errors } = await open(base);
    const tabs = await page.$$eval(".studio-shell [role=group] button", (bs) => bs.map((b) => b.textContent.trim().replace(/ · \d+$/, "")));
    await ctx.close();
    return { tabs: tabs.join("|"), errors };
  },
  async tabs(base) {
    const { ctx, page, errors } = await open(base);
    const seen = [];
    for (const re of [/QR Beam/, /Nearby/, /Link/]) {
      await tab(page, re).click();
      await page.waitForTimeout(300);
      seen.push(`${re.source}:${await tab(page, re).getAttribute("aria-pressed")}:${(await page.locator(".studio-shell [aria-live=polite]").first().innerText()).slice(0, 40)}`);
    }
    await ctx.close();
    return { seen: seen.join(" / "), errors };
  },
  async nearbyLocal(base) {
    const pair = await nearbyPair(base, "local");
    const got = await nearbySend(pair, [FILES.bin, FILES.text]);
    const errors = [...pair.a.errors, ...pair.b.errors];
    await pair.a.ctx.close();
    await pair.b.ctx.close();
    return { files: Object.keys(got).sort().join("|"), ok: got[FILES.bin.name] === FILES.bin.sha && got[FILES.text.name] === FILES.text.sha, errors };
  },
  // Chrome's way: the file is staged on disk (OPFS), then saved where the (stand-in) save dialog says.
  async nearbyStaged(base) {
    const pair = await nearbyPair(base, "local", () => {
      window.saved = {};
      window.showSaveFilePicker = async ({ suggestedName }) => {
        const parts = [];
        return { createWritable: async () => ({ write: async (x) => parts.push(x), close: async () => { window.saved[suggestedName] = new Blob(parts); }, abort: async () => {} }) };
      };
    });
    const { a, b, nameB } = pair;
    await a.page.locator("xpath=//input[@type='file' and following-sibling::div[1][contains(., 'Drop files here')]]").setInputFiles(FILES.bin.file);
    await a.page.locator("li", { hasText: nameB.replace(/^\S+\s/, "") }).getByRole("button", { name: "Send 1" }).click();
    await b.page.getByRole("button", { name: "Accept" }).click({ timeout: 30_000 });
    await b.page.getByRole("button", { name: "Save", exact: true }).click({ timeout: 60_000 });
    await b.page.waitForFunction(() => Object.keys(window.saved).length > 0, null, { timeout: 30_000 });
    const [name, data] = await b.page.evaluate(async () => { const [n, f] = Object.entries(window.saved)[0]; return [n, [...new Uint8Array(await f.arrayBuffer())]]; });
    await b.page.waitForTimeout(1500);
    const left = await b.page.evaluate(async () => { const out = []; const walk = async (d) => { for await (const [n, h] of d.entries()) h.kind === "directory" ? await walk(h) : out.push(n); }; await walk(await navigator.storage.getDirectory()); return out.length; });
    return { name, ok: sha(Buffer.from(data)) === FILES.bin.sha, stagedLeft: left, errors: [...a.errors, ...b.errors] };
  },
  async nearbyDecline(base) {
    const pair = await nearbyPair(base, "local");
    const { a, b, nameB } = pair;
    await a.page.locator("xpath=//input[@type='file' and following-sibling::div[1][contains(., 'Drop files here')]]").setInputFiles(FILES.bin.file);
    const row = a.page.locator("li", { hasText: nameB.replace(/^\S+\s/, "") });
    await row.getByRole("button", { name: "Send 1" }).click();
    await b.page.getByRole("button", { name: "Decline" }).click({ timeout: 30_000 });
    await a.page.waitForTimeout(2000);
    return { row: (await row.innerText()).replace(/\s+/g, " ").replace(nameB.replace(/^\S+\s/, ""), "B").replace(/^\S+ /, ""), prompt: await b.page.getByRole("button", { name: "Accept" }).count(), errors: [...a.errors, ...b.errors] };
  },
  // Under bishare.app the save goes through the hidden frame on the receive host.
  async saveBridge(base) {
    const pair = await nearbyPair(base, "local");
    const froms = [];
    pair.b.page.on("download", (d) => froms.push(new URL(d.url().replace(/^blob:/, "")).origin));
    const got = await nearbySend(pair, [FILES.image]);
    return { from: froms.join(), ok: got[FILES.image.name] === FILES.image.sha, errors: [...pair.a.errors, ...pair.b.errors] };
  },
  async linkMulti(base) {
    const { page, errors } = await open(base);
    const links = await upload(page, [FILES.bin, FILES.image], { encrypt: true, expiry: 6 });
    const got = [];
    for (const l of links) got.push(...Object.entries(await receive(l)).map(([n, s]) => (n.endsWith(".zip") ? "zip" : `${n}:${s}`)));
    const deleted = await removeAll(page);
    return { links: links.length, got: got.join(","), deleted, errors };
  },
  async nearbyEmbed(base) {
    const pair = await embedPair(base);
    const got = await nearbySend(pair, [FILES.image]);
    const errors = [...pair.a.errors, ...pair.b.errors];
    return { files: Object.keys(got).join("|"), ok: got[FILES.image.name] === FILES.image.sha, errors };
  },
  async recentUploads(base) {
    const now = Date.now();
    const list = [
      { rawCode: "ABC123", deleteToken: "0".repeat(64), fileName: "Report ünïcødé.pdf", expiresAt: new Date(now + 5 * 3600_000).toISOString(), oneTime: false },
      { rawCode: "DEF456", deleteToken: "1".repeat(64), fileName: "Photo.jpg", expiresAt: new Date(now + 20 * 60_000).toISOString(), oneTime: true },
      { rawCode: "OLD999", deleteToken: "2".repeat(64), fileName: "Gone.zip", expiresAt: new Date(now - 3600_000).toISOString(), oneTime: false },
    ];
    const { page, errors } = await open(base, { init: `if (!sessionStorage.seeded) { sessionStorage.seeded = 1; localStorage.setItem("bishare.web-transfers", ${JSON.stringify(JSON.stringify(list))}); }` });
    const heading = page.getByRole("heading", { name: "Your uploads" });
    await heading.waitFor({ timeout: 10_000 });
    const text = (await heading.locator("xpath=ancestor::div[2]").innerText()).replace(/\s+/g, " ");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("bishare.web-transfers")).map((x) => x.rawCode).join(","));
    await page.getByRole("button", { name: "Copy link for Photo.jpg" }).click();
    await page.getByRole("button", { name: "Delete Photo.jpg" }).click();
    const confirm = await page.getByRole("button", { name: "Confirm delete Photo.jpg" }).innerText().catch(() => "(no confirm)");
    const href = await page.getByRole("link", { name: /Report/ }).getAttribute("href");
    return { text: text.slice(0, 220), stored, confirm, href, errors };
  },
  async nearbyCode(base) {
    const pair = await nearbyPair(base, "code");
    const got = await nearbySend(pair, [FILES.image]);
    const errors = [...pair.a.errors, ...pair.b.errors];
    await pair.a.ctx.close();
    await pair.b.ctx.close();
    return { files: Object.keys(got).join("|"), ok: got[FILES.image.name] === FILES.image.sha, errors };
  },
  async codeTyped(base) {
    const { page, errors } = await open(base);
    const box = (n) => page.getByRole("textbox", { name: `Code character ${n}` });
    await box(1).click();
    // A character outside the alphabet is dropped; Backspace on an empty box goes back one.
    await page.keyboard.type("a!");
    const afterBad = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    const afterBack = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    const values = await page.getByRole("textbox", { name: /^Code character / }).evaluateAll((xs) => xs.map((x) => x.value).join(""));
    await box(1).click();
    await page.keyboard.type("ab3kx9");
    await page.waitForURL(/\/transfer\/[A-Z0-9]{6}$/, { timeout: 15_000 }).catch(() => {});
    return { afterBad, afterBack, values, url: new URL(page.url()).pathname, errors: errors.filter((e) => !/\/transfer\//.test(e)) };
  },
  async codePasted(base) {
    const { page, errors } = await open(base);
    const first = page.getByRole("textbox", { name: /character 1\b/i });
    await first.click();
    await first.evaluate((el) => {
      const data = new DataTransfer();
      data.setData("text", " ab-3k x9 ");
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await page.waitForURL(/\/transfer\/[A-Z0-9]{6}$/, { timeout: 15_000 }).catch(() => {});
    return { url: new URL(page.url()).pathname, errors: errors.filter((e) => !/\/transfer\//.test(e)) };
  },
  async beam(base) {
    const { page, errors } = await open(base);
    // The stream's 3-byte id is random: pin it, so both builds draw the same frames.
    await page.evaluate(() => {
      const real = crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues = (a) => (a.length === 3 ? (a.set([1, 2, 3]), a) : real(a));
    });
    await tab(page, /QR Beam/).click();
    await page.getByRole("button", { name: /Show a file/ }).click();
    const input = page.locator(".studio-shell input[type=file][hidden]:not([multiple])");
    await input.setInputFiles(FILES.text.file);
    await page.getByText(/^Frame \d+ of \d+$/).waitFor();
    const meta = await page.getByText(/KB · \d+ chunks$/).innerText();
    const total = Number(/of (\d+)/.exec(await page.getByText(/^Frame \d+ of \d+$/).innerText())[1]);
    // Slider to the slowest speed: the label follows while dragging, as with React's onChange.
    await page.locator('.studio-shell input[type=range]').fill("3");
    const speed = await page.getByText(/^\d+ fps$/).innerText();
    const frames = new Map();
    const until = Date.now() + (total / 3) * 1000 * 2 + 3000;
    while (frames.size < total && Date.now() < until) {
      const [label, img] = await page.evaluate(() => [document.querySelector(".studio-shell canvas")?.closest(".mt-2")?.querySelector("p")?.textContent, document.querySelector(".studio-shell canvas")?.toDataURL()]);
      if (label && img) frames.set(label, sha(img));
      await page.waitForTimeout(80);
    }
    const tooBig = fixture("too-big.bin", randomBytes(101 * 1024));
    await page.getByRole("button", { name: /Pick another file/ }).waitFor();
    await input.setInputFiles(tooBig.file);
    const error = await page.getByText(/Too large for QR Beam/).innerText().catch(() => "(no error shown)");
    return { meta, total, speed, frames: [...frames].sort().map(([k, v]) => `${k}=${v}`).join(","), error, errors };
  },
  async uploadForm(base) {
    const { page, errors } = await open(base);
    await tab(page, /Link/).click();
    await page.locator(".studio-shell input[type=file]").first().setInputFiles([FILES.bin, FILES.text, FILES.image].map((f) => f.file));
    await page.getByText(FILES.image.name).first().waitFor();
    const listed = await page.getByRole("button", { name: /^Upload \d+ files? · Get link$/ }).innerText();
    const radios = async () => (await page.getByRole("radio").evaluateAll((xs) => xs.map((x) => `${x.textContent.trim()}:${x.getAttribute("aria-checked")}`))).join(",");
    const before = await radios();
    await page.getByRole("radio", { name: "6 hours" }).click();
    const after = await radios();
    const switches = async () => (await page.getByRole("switch").evaluateAll((xs) => xs.map((x) => x.getAttribute("aria-checked")))).join(",");
    const s0 = await switches();
    for (const name of [/One-time download/, /End-to-end encryption/]) await page.getByRole("switch", { name }).click();
    const s1 = await switches();
    await page.getByRole("button", { name: `Remove ${FILES.bin.name}` }).click();
    const afterRemove = await page.getByRole("button", { name: /^Upload \d+ files? · Get link$/ }).innerText();
    // The preview of the picture opens and closes.
    const preview = page.getByRole("button", { name: `Preview of ${FILES.image.name}` });
    let dialog = "(no preview button)";
    if (await preview.count()) {
      await preview.click();
      dialog = await page.getByRole("dialog").innerText().then((x) => x.replace(/\s+/g, " ").slice(0, 120), () => "(no dialog)");
      await page.getByRole("button", { name: "Close preview" }).first().click();
      dialog += ` / closed:${(await page.getByRole("dialog").count()) === 0}`;
    }
    return { listed, before, after, s0, s1, afterRemove, dialog, errors };
  },
  async linkEncrypted(base) {
    const { page, errors } = await open(base);
    const links = await upload(page, [FILES.bin], { encrypt: true, expiry: 6 });
    const got = await receive(links[0]);
    const deleted = await removeAll(page);
    const after = await receive(links[0]).then((g) => Object.keys(g).length, () => 0);
    return { links: links.length, key: /#k=/.test(links[0]), ok: Object.values(got)[0] === FILES.bin.sha, deleted, downloadsAfterDelete: after, errors };
  },
  async linkPlain(base) {
    const { page, errors } = await open(base);
    const links = await upload(page, [FILES.text], { encrypt: false, expiry: 6 });
    const got = await receive(links[0]);
    const deleted = await removeAll(page);
    return { links: links.length, key: /#k=/.test(links[0]), name: Object.keys(got)[0], ok: Object.values(got)[0] === FILES.text.sha, deleted, errors };
  },
  async linkOneTime(base) {
    const { page, errors } = await open(base);
    const links = await upload(page, [FILES.image], { encrypt: true, oneTime: true, expiry: 6 });
    const first = await receive(links[0]);
    const again = await receive(links[0]).then((g) => Object.keys(g).length, () => 0);
    const deleted = await removeAll(page);
    return { links: links.length, ok: Object.values(first)[0] === FILES.image.sha, secondDownloads: again, deleted, errors };
  },
};

const results = {};
for (const [name, run] of Object.entries(SCENARIOS)) {
  if (only && !only.includes(name)) continue;
  for (const base of builds) {
    let r;
    try {
      r = await run(base);
    } catch (e) {
      const shots = [];
      for (const [i, p] of live.entries()) {
        const shot = join(dir, `${name}-${i}-${Date.now()}.png`);
        if (await p.screenshot({ path: shot }).then(() => true, () => false)) {
          shots.push(`${shot} :: ${(await p.locator(".studio-shell").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300)} :: errors ${JSON.stringify(p.errors)} :: log ${JSON.stringify((p.log ?? []).slice(-12))}`);
        }
      }
      r = { failed: String(e.message ?? e).split("\n")[0], shots };
    }
    if (site && !localApi) for (const p of live) await noteMade(p);
    for (const p of live) await p.context().close().catch(() => {});
    live = [];
    (results[name] ??= []).push(r);
    console.log(`${name} ${base}: ${JSON.stringify(r)}`);
  }
  const [x, ...rest] = results[name].map((r) => JSON.stringify({ ...r, errors: undefined }));
  console.log(rest.every((y) => y === x) ? `= ${name}` : `≠ ${name}`);
}
await browser.close();
if (site && !localApi) for (const [code, token] of made) {
  await fetch(`${API}/api/v1/transfer/delete/${code}`, { method: "DELETE", headers: { "X-Delete-Token": token } }).catch(() => {});
  const left = await fetch(`${API}/api/v1/transfer/status/${code}`).then((r) => r.status, (e) => String(e));
  console.log(`cleanup: status ${left}`);
}
