// Uses the web Drive on two builds, the same steps on each, over a vault that lives in this process (sealed for real):
//   node tool/parity/drive-e2e.mjs <build A> <build B> <out folder> [--only name,name]
// Every step leaves a screenshot of each build; the ones that differ are listed with the number of pixels.
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const only = args.includes("--only") ? args.splice(args.indexOf("--only"), 2)[1].split(",") : null;
const [baseA, baseB, out] = args;
mkdirSync(out, { recursive: true });
const ROOT = resolve(import.meta.dirname, "../..");
const lib = join(ROOT, "node_modules/.cache/drive-e2e-vault.mjs");
await build({
  stdin: { contents: 'export * from "./src/lib/vault/crypto"; export { EncryptedSource, importKey } from "./src/lib/e2e/crypto";', resolveDir: ROOT, loader: "ts" },
  bundle: true, format: "esm", platform: "node", alias: { "@": join(ROOT, "src") }, outfile: lib, logLevel: "error",
});
const V = await import(lib);

const API = "http://127.0.0.1:8787";
const R2 = "https://test.r2.cloudflarestorage.com";
const NOW = Date.parse("2026-11-20T10:00:00Z");
const DAY = 86_400_000;
const sha = (b) => createHash("sha256").update(b).digest();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC", "base64");

/** The same vault for every run: ids and keys come from counters. */
async function makeVault() {
  let n = 0;
  const bytes = (len) => { n++; return new Uint8Array(sha(Buffer.from(`drive-e2e-${n}`))).slice(0, len); };
  const id = () => V.b64u(bytes(16));
  const vaultKey = bytes(32);
  const kMeta = await V.metaKey(vaultKey);
  const vaultId = V.base32Lower(bytes(16)).slice(0, 26);
  const v = { vaultId, vaultKey, kMeta, objects: new Map(), blobs: new Map(), uploads: new Map(), links: [], seq: 0, devices: [], slots: new Map(), log: [] };
  v.put = async (meta, data, at = NOW - 3 * DAY, extra = {}) => {
    const objectId = id();
    let blobId = null, size = null;
    if (data) {
      meta = { mtimeMs: at, parent: null, kind: "file", ...meta, size: data.length, fileKey: bytes(32), hash: new Uint8Array(sha(data)) };
      const src = new V.EncryptedSource(new File([data], meta.name), await V.importKey(meta.fileKey), bytes(4));
      const box = await src.slice(0, src.size);
      blobId = id();
      v.blobs.set(blobId, Buffer.from(box instanceof Blob ? await box.arrayBuffer() : box));
      size = v.blobs.get(blobId).length;
    } else meta = { mtimeMs: at, parent: null, kind: "dir", ...meta };
    v.objects.set(objectId, { id: objectId, encMeta: await V.sealMeta(kMeta, vaultId, objectId, meta, bytes(12)), blobId, size, hasThumb: false, seq: ++v.seq, createdAt: at, trashedAt: null, deleted: false, ...extra });
    return objectId;
  };
  const device = async (kind, name, at, client = null) => {
    const seed = bytes(32);
    const publicKey = V.devicePublicKey(seed);
    const did = await V.deviceIdOf(publicKey);
    v.devices.push({ id: did, publicKey: V.b64u(publicKey), status: "active", kind, client, idleLimitMs: kind === "web" ? 30 * DAY : null, encName: await V.sealDeviceName(kMeta, vaultId, did, name, bytes(12)), addedBy: did, addedAt: at, revokedAt: null, lastSeenAt: NOW - 3600_000, seq: ++v.seq });
    return { seed, did };
  };
  await device("app", "Maya's iPhone", NOW - 40 * DAY);
  await device("web", "Chrome on Windows", NOW - 9 * DAY, "browser");
  const docs = await v.put({ name: "Documents" });
  const trips = await v.put({ name: "Trips ünïcødé" });
  await v.put({ name: "Lisbon", parent: trips });
  await v.put({ name: "Report.pdf", mime: "application/pdf", parent: docs }, Buffer.from("%PDF-1.4 fake report"), NOW - 2 * DAY);
  await v.put({ name: "notes.md", mime: "text/markdown" }, Buffer.from("# Hello\n\nSome **bold** text, `code` and [a link](https://example.com).\n\n- one\n- two\n"), NOW - DAY);
  await v.put({ name: "script.ts", mime: "text/plain" }, Buffer.from('const x: number = 1; // a comment\nexport function hi() { return "there"; }\n'), NOW - 5 * DAY);
  await v.put({ name: "picture.png", mime: "image/png" }, PNG, NOW - 3600_000);
  await v.put({ name: "holiday.png", mime: "image/png", parent: trips }, PNG, NOW - 20 * DAY);
  await v.put({ name: "song.mp3", mime: "audio/mpeg" }, Buffer.alloc(40_000, 7), NOW - 8 * DAY);
  await v.put({ name: "archive.zip", mime: "application/zip" }, Buffer.alloc(120_000, 9), NOW - 15 * DAY);
  for (let i = 1; i <= 6; i++) await v.put({ name: `file ${i}.txt`, mime: "text/plain" }, Buffer.from(`text ${i}`), NOW - i * DAY);
  await v.put({ name: "old.txt", mime: "text/plain" }, Buffer.from("old"), NOW - 60 * DAY, { trashedAt: NOW - 28 * DAY });
  v.nameOf = async (o) => V.openMeta(kMeta, vaultId, o.id, o.encMeta);
  return v;
}

const ok = (data) => ({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", date: new Date(NOW).toUTCString(), "access-control-expose-headers": "etag,date" }, body: JSON.stringify({ success: true, data }) });

async function answer(v, method, path, body) {
  const p = path.replace(`/api/v1/vault/${v.vaultId}`, "");
  if (path === "/api/v1/vault/web-pair") {
    v.slots.set("slot1", body);
    return ok({ slot: "slot1", code: "K7Q49MZD", expiresAt: NOW + 290_000 });
  }
  if (/web-pair\/slots\/slot1\/box$/.test(path)) {
    if (!v.approve) return ok({ ready: false });
    const s = v.slots.get("slot1");
    const mine = V.newGrantKey();
    const pub = V.fromB64u(s.devicePub);
    const did = await V.deviceIdOf(pub);
    if (!v.devices.some((d) => d.id === did)) v.devices.push({ id: did, publicKey: s.devicePub, status: "active", kind: "web", client: "browser", idleLimitMs: s.stay ? 30 * DAY : DAY, encName: await V.sealDeviceName(v.kMeta, v.vaultId, did, s.name), addedBy: did, addedAt: NOW, revokedAt: null, lastSeenAt: NOW, seq: ++v.seq });
    v.me = did;
    return ok({ ready: true, vaultId: v.vaultId, deviceId: did, granterPub: V.b64u(mine.public), box: V.b64u(await V.grant(v.vaultKey, v.vaultId, mine, V.fromB64u(s.boxPub))) });
  }
  if (/web-pair\/slots/.test(path)) return ok({});
  if (p === "" && method === "GET") {
    const used = [...v.objects.values()].reduce((a, o) => a + (o.size ?? 0), 0) + 3_000_000_000;
    return ok({ vaultId: v.vaultId, region: "apac", plan: "free", state: "active", quotaBytes: 5_000_000_000, usedBytes: used, reservedBytes: 0, seq: v.seq, keyCheck: await V.keyCheck(v.vaultKey), expiresAt: null, device: v.devices.at(-1), devices: v.devices, identities: [{ provider: "apple", linkedAt: NOW - 40 * DAY }] });
  }
  if (p.startsWith("/changes")) {
    const since = Number(/since=(\d+)/.exec(p)[1]);
    return ok({ seq: v.seq, resync: false, more: false, objects: [...v.objects.values()].filter((o) => o.seq > since).map((o) => ({ ...o, encMeta: o.deleted ? null : o.encMeta })), devices: v.devices });
  }
  if (p === "/ops") {
    const results = body.ops.map((op) => {
      const o = v.objects.get(op.objectId);
      if (op.type === "mkdir") v.objects.set(op.objectId, { id: op.objectId, encMeta: op.encMeta, blobId: null, size: null, hasThumb: false, seq: ++v.seq, createdAt: NOW, trashedAt: null, deleted: false });
      else if (op.type === "link") v.objects.set(op.objectId, { id: op.objectId, encMeta: op.encMeta, blobId: op.blobId, size: 1, hasThumb: false, seq: ++v.seq, createdAt: NOW, trashedAt: null, deleted: false });
      else if (op.type === "meta") Object.assign(o, { encMeta: op.encMeta, seq: ++v.seq });
      else Object.assign(o, { trash: { trashedAt: NOW }, restore: { trashedAt: null }, delete: { deleted: true } }[op.type], { seq: ++v.seq });
      return { ok: true, seq: v.seq };
    });
    return ok({ seq: v.seq, results });
  }
  if (p === "/uploads") {
    const uploadId = `u${v.uploads.size + 1}`;
    const blobId = V.b64u(randomBytes(16));
    v.uploads.set(uploadId, { blobId });
    return ok({ uploadId, blobId, size: body.size, multipart: false, parts: 1, partSize: body.size, expiresAt: NOW + DAY, url: `${R2}/${blobId}` });
  }
  const done = /^\/uploads\/(\w+)\/complete$/.exec(p);
  if (done) {
    const { blobId } = v.uploads.get(done[1]);
    v.objects.set(body.objectId, { id: body.objectId, encMeta: body.encMeta, blobId, size: v.blobs.get(blobId)?.length ?? 0, hasThumb: false, seq: ++v.seq, createdAt: NOW, trashedAt: null, deleted: false });
    return ok({});
  }
  if (p === "/downloads") return ok({ expiresIn: 600, items: body.objectIds.map((objectId) => { const o = v.objects.get(objectId); return o?.blobId ? { objectId, url: `${R2}/${o.blobId}`, size: o.size } : { objectId, missing: true }; }) });
  if (p === "/links" && method === "GET") return ok({ links: v.links });
  if (p === "/links") {
    const l = { id: body.linkId, encKey: body.encKey, kind: body.kind, root: body.objectIds[0], objects: body.objectIds.length, createdAt: NOW, updatedAt: NOW, expiresAt: body.days ? NOW + body.days * DAY : null, opens: 0, lastOpenedAt: null };
    v.links.unshift(l);
    return ok(l);
  }
  if (/^\/links\//.test(p) && method === "DELETE") { v.links = v.links.filter((l) => !p.endsWith(l.id)); return ok({}); }
  if (/^\/devices\//.test(p)) { const d = v.devices.find((x) => p.endsWith(x.id)); Object.assign(d, { status: "revoked" }); return ok(d); }
  if (/\/thumb$/.test(p)) return ok({});
  v.log.push(`UNANSWERED ${method} ${path}`);
  return { status: 404, contentType: "application/json", body: '{"success":false,"error":{"code":"NOT_FOUND"}}' };
}

let current;
const browser = await chromium.launch();
async function open(base, { path = "", theme = "light", size = { width: 1280, height: 860 }, approve = true, locale = "en" } = {}) {
  const v = await makeVault();
  v.approve = approve;
  const ctx = await browser.newContext({ viewport: size, colorScheme: theme, reducedMotion: "reduce", acceptDownloads: true, timezoneId: "UTC", locale: "en-US" });
  await ctx.addInitScript(() => { delete window.showSaveFilePicker; delete Window.prototype.showSaveFilePicker; });
  const page = await ctx.newPage();
  current = page;
  page.errors = [];
  page.on("console", (m) => /DBG/.test(m.text()) && console.log(m.text()));
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("console", (m) => /Content Security Policy|Content-Security-Policy/i.test(m.text()) && page.errors.push(`CSP ${m.text().slice(0, 160)}`));
  await page.clock.setFixedTime(NOW);
  await ctx.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    const url = new URL(req.url());
    const k = `${req.method()} ${url.pathname.replace(v.vaultId, "V")}`;
    (v.count ??= {})[k] = (v.count[k] ?? 0) + 1;
    if (v.count[k] === 400) { console.log("too many", base, JSON.stringify(v.count)); await ctx.close(); return; }
    const raw = req.postDataBuffer();
    let body = null;
    try { body = raw ? JSON.parse(raw.toString()) : null; } catch { body = raw; }
    await route.fulfill(await answer(v, req.method(), url.pathname + url.search, body));
  });
  await ctx.route(`${R2}/**`, async (route) => {
    const req = route.request();
    const blobId = new URL(req.url()).pathname.slice(1);
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "etag,content-length" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (req.method() === "PUT") { v.blobs.set(blobId, req.postDataBuffer()); return route.fulfill({ status: 200, headers: { ...headers, etag: '"x"' } }); }
    const data = v.blobs.get(blobId);
    const range = /bytes=(\d+)-(\d*)/.exec(req.headers().range ?? "");
    if (!range) return route.fulfill({ status: 200, headers, body: data });
    const end = range[2] ? Number(range[2]) + 1 : data.length;
    return route.fulfill({ status: 206, headers: { ...headers, "content-range": `bytes ${range[1]}-${end - 1}/${data.length}` }, body: data.subarray(Number(range[1]), end) });
  });
  await page.routeWebSocket(/\/ws\?/, (ws) => { ws.onMessage(() => {}); });
  await page.goto(`${base}${locale === "en" ? "" : `/${locale}`}/drive${path}`, { waitUntil: "load" });
  if (approve && path !== "/delete-account") await page.locator("header:visible").first().waitFor().catch(async (e) => { writeFileSync(join(out, "open-failed.png"), await page.screenshot()); throw new Error(`${e.message.split("\n")[0]} ${page.url()} ${JSON.stringify(page.errors)} ${(await page.locator("body").innerText()).slice(0, 200)}`); });
  return { page, ctx, v };
}
const ready = async (page) => { await page.waitForTimeout(3600); await page.evaluate(() => document.fonts.ready); };

const shots = new Map();
async function shot(side, name, page, opts = {}) {
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);
  const file = join(out, `${name.replace(/[^\w-]+/g, "_")}-${side}.png`);
  writeFileSync(file, await page.screenshot({ animations: "disabled", caret: "hide", ...opts }));
  if (!shots.has(name)) shots.set(name, {});
  shots.get(name)[side] = file;
}

const row = (page, name) => page.locator("tr, li, [role=row], a, button, div").filter({ hasText: new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).last();
const names = async (v) => (await Promise.all([...v.objects.values()].filter((o) => !o.deleted).map(async (o) => `${(await v.nameOf(o)).name}${o.trashedAt ? " (trash)" : ""}`))).sort();

const SCENARIOS = {
  async signin(base, side) {
    for (const theme of ["light", "dark"]) for (const [k, size] of [["desk", { width: 1280, height: 860 }], ["phone", { width: 390, height: 844 }]]) {
      const { page, ctx } = await open(base, { approve: false, theme, size });
      await page.getByText("K7Q4 · 9MZD").waitFor();
      await page.locator("svg[role=img], main svg").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().width > 150).forEach((x) => (x.style.visibility = "hidden")));
      await shot(side, `signin ${theme} ${k}`, page);
      if (k === "desk" && theme === "light") { await page.getByRole("switch").click(); await page.waitForTimeout(500); await page.locator("main svg").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().width > 150).forEach((x) => (x.style.visibility = "hidden"))); await shot(side, "signin stay", page); }
      await ctx.close();
    }
    return {};
  },
  async pages(base, side) {
    const errors = [];
    for (const theme of ["light", "dark"]) {
      for (const p of ["", "/files", "/recent", "/photos", "/links", "/devices", "/trash", "/storage", "/security"]) {
        const { page, ctx } = await open(base, { path: p, theme });
        await ready(page);
        await shot(side, `page ${p || "/"} ${theme}`, page, { fullPage: true });
        errors.push(...page.errors.map((e) => `${p}: ${e}`));
        await ctx.close();
      }
    }
    for (const [p, locale] of [["", "ar"], ["/files", "ar"], ["/files", "ja"], ["", "en"], ["/files", "en"], ["/devices", "en"]]) {
      const { page, ctx } = await open(base, { path: p, locale, size: { width: 390, height: 844 } });
      await ready(page);
      await shot(side, `phone ${locale} ${p || "/"}`, page, { fullPage: true });
      await ctx.close();
    }
    return { errors };
  },
  async deleteAccount(base, side) {
    const { page, ctx } = await open(base, { path: "/delete-account" });
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(800);
    await shot(side, "delete account", page, { fullPage: true });
    const title = await page.title();
    await ctx.close();
    return { title };
  },
  async navigate(base) {
    const { page, ctx } = await open(base);
    await ready(page);
    const seen = [];
    for (const l of ["Files", "Recent", "Photos", "Devices", "Trash", "Storage", "Security"]) {
      await page.getByRole("navigation", { name: "Drive" }).getByRole("link", { name: l }).first().click();
      await page.waitForTimeout(500);
      seen.push(`${new URL(page.url()).pathname.replace(/^\/drive/, "")}|${await page.title()}`);
    }
    await page.goBack();
    await page.waitForTimeout(500);
    seen.push(`back ${new URL(page.url()).pathname}`);
    await page.reload();
    await ready(page);
    const still = await page.getByRole("navigation", { name: "Drive" }).count();
    const errors = page.errors;
    await ctx.close();
    return { seen, still, errors };
  },
  async menus(base, side) {
    const { page, ctx } = await open(base, { path: "/files" });
    await ready(page);
    await page.getByRole("button", { name: "New", exact: true }).first().click();
    await page.getByRole("menu").waitFor();
    await shot(side, "menu new", page);
    await page.keyboard.press("ArrowDown");
    const first = await page.evaluate(() => document.activeElement.textContent.trim());
    await page.keyboard.press("End");
    const last = await page.evaluate(() => document.activeElement.textContent.trim());
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    const closed = await page.getByRole("menu").count();
    const focus = await page.evaluate(() => document.activeElement.textContent.trim());
    await page.getByText("notes.md").first().click({ button: "right" });
    await page.getByRole("menu").waitFor();
    const items = (await page.getByRole("menuitem").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    await shot(side, "menu context", page);
    await page.mouse.click(1200, 800);
    await page.waitForTimeout(250);
    const closed2 = await page.getByRole("menu").count();
    await page.getByRole("combobox").first().click();
    await page.getByRole("listbox").waitFor();
    const options = await page.getByRole("option").allInnerTexts();
    await shot(side, "select kind", page);
    await page.getByRole("option", { name: /photos|images|media/i }).first().click();
    await page.waitForTimeout(400);
    const value = await page.getByRole("combobox").first().innerText();
    await shot(side, "files filtered", page);
    const errors = page.errors;
    await ctx.close();
    return { first, last, closed, focus, items, closed2, options, value, errors };
  },
  async files(base, side) {
    const { page, ctx, v } = await open(base, { path: "/files" });
    await ready(page);
    // A new folder, by the menu and a dialog.
    await page.getByRole("button", { name: "New", exact: true }).first().click();
    await page.getByRole("menuitem", { name: "New folder" }).click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(250);
    const focused = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
    await page.keyboard.type("a/b");
    await page.waitForTimeout(150);
    await shot(side, "dialog bad name", page);
    const blocked = await page.getByRole("dialog").getByRole("button", { name: "Create" }).isDisabled();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Made here");
    await page.keyboard.press("Enter");
    await page.getByText("Made here").first().waitFor();
    await page.waitForTimeout(500);
    const dialogs = await page.getByRole("dialog").count();
    // Rename.
    await page.getByText("file 1.txt").first().click({ button: "right" });
    await page.getByRole("menuitem", { name: /Rename/ }).click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(250);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("renamed ü.txt");
    await page.keyboard.press("Enter");
    await page.getByText("renamed ü.txt").first().waitFor();
    // Trash, and undo from the message.
    await page.getByText("file 2.txt").first().click({ button: "right" });
    await page.getByRole("menuitem", { name: /trash/i }).click();
    await page.waitForTimeout(500);
    if (await page.getByRole("dialog").count()) await page.getByRole("dialog").getByRole("button").last().click();
    await page.waitForTimeout(700);
    await shot(side, "toast trash", page);
    const inTrash = (await names(v)).filter((x) => x.includes("trash"));
    const undo = page.getByRole("button", { name: /undo/i });
    const hasUndo = await undo.count();
    if (hasUndo) { await undo.first().click(); await page.waitForTimeout(900); }
    const after = await names(v);
    const errors = page.errors;
    await ctx.close();
    return { focused, blocked, dialogs, inTrash, hasUndo, after, log: v.log, errors };
  },
  async upload(base, side) {
    const { page, ctx, v } = await open(base, { path: "/files" });
    await ready(page);
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "New", exact: true }).first().click();
    await page.getByRole("menuitem", { name: /Upload files/ }).or(page.getByRole("menuitem", { name: /^Upload/ })).first().click();
    const data = Buffer.from("uploaded bytes ".repeat(5000));
    await (await chooser).setFiles([{ name: "Ünïcode up.txt", mimeType: "text/plain", buffer: data }]);
    await page.getByText("Ünïcode up.txt").first().waitFor();
    await page.waitForTimeout(4500);
    await shot(side, "upload tray", page);
    const o = [...v.objects.values()].at(-1);
    const meta = await v.nameOf(o);
    const good = Buffer.from(meta.hash).equals(sha(data)) && meta.size === data.length;
    const errors = page.errors;
    await ctx.close();
    return { name: meta.name, mime: meta.mime, good, log: v.log, errors };
  },
  async remount(base) {
    // Run by name (--only remount): not part of the comparison of looks.
    const { page, ctx } = await open(base, { path: "/files" });
    await ready(page);
    const id = () => page.locator("tr", { hasText: "notes.md" }).evaluate((el) => (el.dataset.k ??= String(Math.random()).slice(2, 7)));
    const a = await id();
    await page.getByRole("checkbox", { name: /file 1\.txt/ }).click({ force: true });
    await page.waitForTimeout(300);
    const b = await id();
    await page.locator("tr", { hasText: "file 3.txt" }).click({ position: { x: 600, y: 10 } });
    await page.waitForTimeout(300);
    const c = await id();
    await page.getByRole("button", { name: "notes.md" }).click();
    await page.getByRole("dialog").waitFor();
    const d = await id().catch(() => "gone");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const e = await id();
    await ctx.close();
    // The row stays the same element through selection and the viewer: a double-click needs both presses on one.
    return { kept: [b, c, d, e].every((x) => x === a) };
  },
  async viewer(base, side) {
    const { page, ctx, v } = await open(base, { path: "/files" });
    await ready(page);
    const out = {};
    for (const f of ["notes.md", "script.ts", "picture.png", "archive.zip"]) {
      await page.getByText(f).first().dblclick();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(2200);
      await shot(side, `viewer ${f}`, page);
      out[f] = (await page.getByRole("dialog").innerText()).replace(/\s+/g, " ").slice(0, 120);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      out[`${f} closed`] = await page.getByRole("dialog").count();
    }
    out.errors = page.errors; out.log = v.log;
    await ctx.close();
    return out;
  },
  async reopen(base) {
    const { page, ctx } = await open(base, { path: "/files" });
    await ready(page);
    await page.getByText("notes.md").first().dblclick();
    await page.getByRole("dialog").first().waitFor();
    await page.waitForTimeout(2000);
    const before = await page.evaluate(() => [document.activeElement.tagName, document.activeElement.getAttribute("role"), document.querySelectorAll("[role=dialog]").length]);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => [document.activeElement.tagName, document.querySelectorAll("[role=dialog]").length, document.querySelectorAll("[data-slot=sheet-overlay]").length, getComputedStyle(document.body).pointerEvents]);
    const focus = after.shift();
    const r = { before, after, errors: page.errors };
    await ctx.close();
    return r;
  },
  async download(base) {
    const { page, ctx, v } = await open(base, { path: "/files" });
    await ready(page);
    await page.getByText("notes.md").first().click({ button: "right" });
    const [d] = await Promise.all([page.waitForEvent("download", { timeout: 20_000 }), page.getByRole("menuitem", { name: /^Download/ }).click()]);
    const body = readFileSync(await d.path());
    const r = { name: d.suggestedFilename(), starts: body.toString().slice(0, 7), size: body.length, log: v.log, errors: page.errors };
    await ctx.close();
    return r;
  },
  async palette(base, side) {
    const { page, ctx } = await open(base);
    await ready(page);
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(300);
    await shot(side, "palette", page);
    await page.keyboard.type("repo");
    await page.waitForTimeout(300);
    const items = (await page.locator(":is([cmdk-item],[data-command-item])").allInnerTexts()).map((t) => t.replace(/\s+/g, " "));
    const chosen = await page.locator(':is([cmdk-item],[data-command-item])[data-selected="true"]').innerText();
    await shot(side, "palette search", page);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("zzzz");
    await page.waitForTimeout(250);
    const empty = await page.locator(":is([cmdk-empty],[data-command-empty])").count();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("trash");
    await page.waitForTimeout(250);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(700);
    const url = new URL(page.url()).pathname;
    const errors = page.errors;
    await ctx.close();
    return { items, chosen: chosen.replace(/\s+/g, " "), empty, url, dialogs: 0, errors };
  },
  async shareLink(base, side) {
    const { page, ctx, v } = await open(base, { path: "/files" });
    await ready(page);
    await page.getByText("notes.md").first().click({ button: "right" });
    await page.getByRole("menuitem", { name: /link/i }).first().click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(400);
    await shot(side, "link dialog", page);
    await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await page.waitForTimeout(1200);
    const made = v.links.map((l) => `${l.kind} ${l.objects} ${l.expiresAt ? Math.round((l.expiresAt - NOW) / DAY) : 0}`);
    const url = await page.getByRole("dialog").locator("input").first().inputValue().catch(() => "");
    await shot(side, "link made", page, { mask: [page.getByRole("dialog").locator("input").first(), page.locator("dialog canvas, [role=dialog] svg")] });
    await page.keyboard.press("Escape");
    const errors = page.errors;
    await ctx.close();
    return { made, url: url.replace(/\/d\/.*/, "/d/…"), key: /#/.test(url), log: v.log, errors };
  },
  async keyboard(base) {
    const { page, ctx } = await open(base, { path: "/files" });
    await ready(page);
    // Focus stays inside a dialog.
    await page.getByRole("button", { name: "New", exact: true }).first().click();
    await page.getByRole("menuitem", { name: "New folder" }).click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(250);
    const inside = [];
    for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); inside.push(await page.evaluate(() => !!document.activeElement.closest("[role=dialog]"))); }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const gone = await page.getByRole("dialog").count();
    const body = await page.evaluate(() => getComputedStyle(document.body).pointerEvents);
    await page.getByRole("button", { name: "Theme" }).or(page.getByRole("button", { name: /theme|dark/i })).first().click().catch(() => {});
    await page.waitForTimeout(200);
    const theme = await page.evaluate(() => document.documentElement.dataset.driveTheme);
    const errors = page.errors;
    await ctx.close();
    return { inside: inside.every(Boolean), gone, body, theme, errors };
  },
  async tooltip(base, side) {
    const { page, ctx } = await open(base, { path: "/files" });
    await ready(page);
    const b = page.getByRole("button", { name: /details/i }).first();
    await b.hover();
    await page.getByRole("tooltip").first().waitFor({ timeout: 4000 });
    const text = await page.getByRole("tooltip").first().innerText();
    await page.waitForTimeout(250);
    writeFileSync(join(out, `tooltip-${side}.png`), await page.screenshot({ animations: "disabled" }));
    shots.set("tooltip", { ...(shots.get("tooltip") ?? {}), [side]: join(out, `tooltip-${side}.png`) });
    await ctx.close();
    return { text };
  },
  async devices(base, side) {
    const { page, ctx, v } = await open(base, { path: "/devices" });
    await ready(page);
    const boxes = page.getByRole("checkbox");
    await boxes.first().click();
    await page.waitForTimeout(300);
    await shot(side, "devices selected", page);
    const state = await boxes.evaluateAll((xs) => xs.map((x) => x.getAttribute("aria-checked")));
    await page.getByRole("button", { name: /remove/i }).first().click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(300);
    const focus = await page.evaluate(() => document.activeElement.textContent.trim());
    await shot(side, "devices confirm", page);
    await page.getByRole("dialog").getByRole("button").last().click();
    await page.waitForTimeout(900);
    const left = v.devices.map((d) => d.status);
    const errors = page.errors;
    await ctx.close();
    return { state, focus, left, errors };
  },
  async lock(base) {
    const { page, ctx, v } = await open(base);
    await ready(page);
    v.approve = false;
    await page.getByRole("button", { name: /Chrome on/ }).first().click();
    await page.getByRole("menuitem", { name: /Lock/ }).click();
    await page.waitForTimeout(600);
    if (await page.getByRole("dialog").count()) await page.getByRole("dialog").getByRole("button").last().click();
    v.approve = false;
    await page.waitForTimeout(1500);
    const signed = await page.getByText("K7Q4 · 9MZD").count();
    const left = await page.evaluate(() => [sessionStorage.length, localStorage.getItem("bishare-drive-theme")]);
    await ctx.close();
    return { signed, stored: left[0] };
  },
};

const judge = await (await browser.newContext()).newPage();
async function differ(a, b) {
  const u = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
  return judge.evaluate(async ([x, y]) => {
    const d = async (s) => { const i = new Image(); i.src = s; await i.decode(); const c = new OffscreenCanvas(i.width, i.height).getContext("2d"); c.drawImage(i, 0, 0); return c.getImageData(0, 0, i.width, i.height); };
    const [p, q] = [await d(x), await d(y)];
    if (p.width !== q.width || p.height !== q.height) return `size ${p.width}x${p.height} vs ${q.width}x${q.height}`;
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0;
    for (let i = 0; i < p.data.length; i += 4) if ([0, 1, 2].some((k) => Math.abs(p.data[i + k] - q.data[i + k]) > 2)) { n++; const px = (i / 4) % p.width, py = Math.floor(i / 4 / p.width); x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    return n ? `${n} px in ${x0},${y0}–${x1},${y1}` : "";
  }, [u(a), u(b)]);
}

for (const [name, run] of Object.entries(SCENARIOS)) {
  if (only && !only.includes(name)) continue;
  const res = {};
  for (const [side, base] of [["a", baseA], ["b", baseB]]) {
    try { res[side] = await run(base, side); } catch (e) { await current?.screenshot({ path: join(out, `failed-${name}-${side}.png`) }).catch(() => {}); res[side] = { failed: e.message.split("\n").slice(0, 4).join(" "), errors: current?.errors }; }
  }
  const [x, y] = [JSON.stringify(res.a), JSON.stringify(res.b)];
  console.log(x === y ? `= ${name} ${x.slice(0, 500)}` : `≠ ${name}\n   a ${x.slice(0, 1200)}\n   b ${y.slice(0, 1200)}`);
}
let same = 0;
for (const [name, s] of shots) {
  if (!s.a || !s.b) { console.log(`?? ${name}: one side only`); continue; }
  const d = await differ(s.a, s.b);
  if (d) console.log(`≠ shot ${name}: ${d}`); else same++;
}
console.log(`shots: ${same} of ${shots.size} same`);
await browser.close();
