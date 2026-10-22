// Checks src/lib/vault/crypto.ts against the vault vectors the Rust tests
// write (bishare-flutter/test/fixtures/vault_vectors.json, copied to
// src/lib/vault/vault-vectors.json). Rust is the canonical implementation, so
// this script never writes: every value must be reproduced here byte for
// byte, every sealed value must open, and the failure cases must fail.
//
// Run from bishare-web (esbuild because the sources use TS-only syntax):
//   npx esbuild tools/vault-vectors.ts --bundle --platform=node --format=esm --log-level=warning | node --input-type=module -
import fs from "node:fs";
import path from "node:path";
import {
  acceptGrant,
  authorization,
  b64u,
  base32Lower,
  dedupeKey,
  dedupeTag,
  deflateRaw,
  deviceIdOf,
  devicePublicKey,
  fromB64u,
  grant,
  grantKeyFromSecret,
  inflateRaw,
  isObjectId,
  isVaultId,
  keyCheck,
  keyFromPhrase,
  linkFromJson,
  linkToJson,
  metaFromJson,
  metaKey,
  pairAuthorization,
  openDeviceName,
  sealDeviceName,
  metaToJson,
  openKeyCopy,
  openLink,
  openMeta,
  openThumbnail,
  parseAuthorization,
  phraseFromKey,
  requestMessage,
  sealKeyCopy,
  sealLink,
  sealMeta,
  sealThumbnail,
  signinNonce,
  signRequest,
  thumbKey,
  VaultError,
  verifyRequest,
  type ObjectMeta,
} from "../src/lib/vault/crypto.ts";

const v = JSON.parse(fs.readFileSync(path.resolve("src/lib/vault/vault-vectors.json"), "utf8"));
const seq = (n: number, start: number) => Uint8Array.from({ length: n }, (_, i) => (start + i) & 0xff);
const enc = new TextEncoder();

let checks = 0;
function same(what: string, got: unknown, want: unknown) {
  checks++;
  const g = got instanceof Uint8Array ? b64u(got) : got;
  if (g !== want) throw new Error(`${what}: got ${JSON.stringify(g)}, want ${JSON.stringify(want)}`);
}
async function fails(what: string, code: string, fn: () => Promise<unknown> | unknown) {
  checks++;
  try {
    await fn();
  } catch (e) {
    if (e instanceof VaultError && e.code === code) return;
    throw new Error(`${what}: threw ${String(e)}, want VaultError ${code}`);
  }
  throw new Error(`${what}: did not throw, want VaultError ${code}`);
}

const vk = fromB64u(v.vaultKey);
const vaultId: string = v.vaultId;
const kMeta = await metaKey(vk);

// ── ids and keys ──
same("vault id from seq(16, 0)", base32Lower(seq(16, 0)), vaultId);
same("isVaultId", isVaultId(vaultId), true);
same("isVaultId rejects upper case", isVaultId(vaultId.toUpperCase()), false);
same("isObjectId", isObjectId(v.file.objectId), true);
same("keyCheck", await keyCheck(vk), v.keyCheck);
same("metaKey", kMeta, v.metaKey);
same("thumbKey", await thumbKey(fromB64u(v.file.fileKey)), v.file.thumbKey);

// ── phrase ──
same("phrase", await phraseFromKey(vk), v.phrase);
same("phrase decodes", await keyFromPhrase(v.phrase), v.vaultKey);
same("phrase decodes when messy", await keyFromPhrase(`  ${(v.phrase as string).toUpperCase().replace(/ /g, "   ")}\n`), v.vaultKey);
const words = (v.phrase as string).split(" ");
await fails("swapped words", "bad_phrase", () => keyFromPhrase([words[1], words[0], ...words.slice(2)].join(" ")));
await fails("23 words", "bad_phrase", () => keyFromPhrase(words.slice(0, 23).join(" ")));
await fails("unknown word", "bad_phrase", () => keyFromPhrase(["zzzz", ...words.slice(1)].join(" ")));

// ── key copy ──
const serverHalf = fromB64u(v.keyCopy.serverHalf);
same("key copy blob", await sealKeyCopy(serverHalf, vaultId, vk, fromB64u(v.keyCopy.nonce)), v.keyCopy.blob);
same("key copy opens", await openKeyCopy(serverHalf, vaultId, fromB64u(v.keyCopy.blob)), v.vaultKey);
const otherVault = base32Lower(seq(16, 1));
await fails("key copy, other vault", "auth_failed", () => openKeyCopy(serverHalf, otherVault, fromB64u(v.keyCopy.blob)));
await fails("key copy, other half", "auth_failed", () => openKeyCopy(seq(32, 0x31), vaultId, fromB64u(v.keyCopy.blob)));
const flippedCopy = fromB64u(v.keyCopy.blob);
flippedCopy[40] ^= 1;
await fails("key copy, flipped bit", "auth_failed", () => openKeyCopy(serverHalf, vaultId, flippedCopy));
const badMagic = fromB64u(v.keyCopy.blob);
badMagic[0] = 0x58;
await fails("key copy, bad magic", "bad_key_copy", () => openKeyCopy(serverHalf, vaultId, badMagic));

// ── device, sign-in nonce, signed request ──
const seed = fromB64u(v.device.seed);
const pub = devicePublicKey(seed);
same("device public key", pub, v.device.publicKey);
same("device id", await deviceIdOf(pub), v.device.deviceId);
same("sign-in nonce", await signinNonce(pub), v.device.signinNonce);
const r = v.request;
const body = enc.encode(r.body);
same("request message", await requestMessage(r.method, r.pathAndQuery, r.ts, body), r.message);
same("signature", await signRequest(seed, r.method, r.pathAndQuery, r.ts, body), r.signature);
same("authorization", await authorization(seed, vaultId, r.method, r.pathAndQuery, r.ts, body), r.authorization);
const parsed = parseAuthorization(r.authorization);
same("parsed vault", parsed.vaultId, vaultId);
same("parsed device", parsed.deviceId, v.device.deviceId);
same("parsed ts", parsed.ts, r.ts);
await verifyRequest(pub, r.method, r.pathAndQuery, parsed.ts, body, parsed.signature);
checks++;
await fails("verify, other method", "bad_signature", () => verifyRequest(pub, "GET", r.pathAndQuery, r.ts, body, r.signature));

// ── a device waiting in a pairing slot (a browser here; Windows and Linux too) ──
const pr = v.pairRequest;
same("pair authorization", await pairAuthorization(seed, pr.slot, pr.method, pr.pathAndQuery, pr.ts, new Uint8Array(0)), pr.authorization);
await fails("verify, other body", "bad_signature", () => verifyRequest(pub, r.method, r.pathAndQuery, r.ts, enc.encode("{}"), r.signature));
await fails("verify, other ts", "bad_signature", () => verifyRequest(pub, r.method, r.pathAndQuery, r.ts + 1, body, r.signature));
await fails("verify, other key", "bad_signature", () => verifyRequest(devicePublicKey(seq(32, 0x61)), r.method, r.pathAndQuery, r.ts, body, r.signature));
await fails("parse junk", "bad_authorization", () => parseAuthorization("Bearer abc"));
await fails("parse v=2", "bad_authorization", () => parseAuthorization(r.authorization.replace("v=1", "v=2")));
await fails("parse duplicate", "bad_authorization", () => parseAuthorization(`${r.authorization},v=1`));

// ── device names ──
{
  const kMeta0 = await metaKey(fromB64u(v.vaultKey));
  const dev = v.device;
  same("device name seals", await sealDeviceName(kMeta0, vaultId, dev.deviceId, dev.name, fromB64u(dev.nameNonce)), dev.encName);
  same("device name opens", await openDeviceName(kMeta0, vaultId, dev.deviceId, dev.encName), dev.name);
  await fails("device name, other device", "auth_failed", () => openDeviceName(kMeta0, vaultId, v.file.objectId, dev.encName));
  await fails("device name, empty", "bad_device_name", () => sealDeviceName(kMeta0, vaultId, dev.deviceId, ""));
  await fails("device name, too long", "bad_device_name", () => sealDeviceName(kMeta0, vaultId, dev.deviceId, "x".repeat(101)));
}

// ── file metadata and thumbnail ──
const f = v.file;
const fileMeta: ObjectMeta = {
  kind: "file",
  name: f.meta.name,
  parent: f.meta.parent,
  mtimeMs: f.meta.mtimeMs,
  size: f.meta.size,
  mime: f.meta.mime,
  fileKey: fromB64u(f.fileKey),
  hash: fromB64u(f.meta.hash),
};
same("file meta JSON", metaToJson(fileMeta), f.metaJson);
same("file enc_meta", await sealMeta(kMeta, vaultId, f.objectId, fileMeta, fromB64u(f.nonce)), f.encMeta);
const openedFile = await openMeta(kMeta, vaultId, f.objectId, f.encMeta);
same("file meta opens", metaToJson(openedFile), f.metaJson);
same("hash of plaintext", b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", fromB64u(f.plaintext)))), f.meta.hash);
await fails("enc_meta, other object", "auth_failed", () => openMeta(kMeta, vaultId, v.dir.objectId, f.encMeta));
await fails("enc_meta, other vault", "auth_failed", () => openMeta(kMeta, otherVault, f.objectId, f.encMeta));
await fails("enc_meta, other key", "auth_failed", async () => openMeta(await metaKey(seq(32, 0x11)), vaultId, f.objectId, f.encMeta));
const flippedMeta = fromB64u(f.encMeta);
flippedMeta[20] ^= 0x80;
await fails("enc_meta, flipped bit", "auth_failed", () => openMeta(kMeta, vaultId, f.objectId, b64u(flippedMeta)));
await fails("enc_meta, too short", "sealed_box_too_short", () => openMeta(kMeta, vaultId, f.objectId, "AAAA"));
same("thumbnail", await sealThumbnail(fromB64u(f.fileKey), vaultId, f.objectId, fromB64u(f.thumbnail), fromB64u(f.thumbNonce)), f.encThumbnail);
same("thumbnail opens", await openThumbnail(fromB64u(f.fileKey), vaultId, f.objectId, fromB64u(f.encThumbnail)), f.thumbnail);
await fails("thumbnail, other object", "auth_failed", () => openThumbnail(fromB64u(f.fileKey), vaultId, v.dir.objectId, fromB64u(f.encThumbnail)));

// ── folder metadata ──
const d = v.dir;
const dirMeta: ObjectMeta = { kind: "dir", name: d.meta.name, parent: d.meta.parent, mtimeMs: d.meta.mtimeMs };
same("dir meta JSON", metaToJson(dirMeta), d.metaJson);
same("dir enc_meta", await sealMeta(kMeta, vaultId, d.objectId, dirMeta, fromB64u(d.nonce)), d.encMeta);
same("dir meta opens", metaToJson(await openMeta(kMeta, vaultId, d.objectId, d.encMeta)), d.metaJson);
same("readers ignore unknown and file-only keys on a folder", metaToJson(metaFromJson('{"v":1,"k":"dir","n":"x","p":null,"m":1,"s":5,"zzz":true}')), '{"v":1,"k":"dir","n":"x","p":null,"m":1}');
for (const bad of [
  '{"v":2,"k":"dir","n":"x","p":null,"m":1}',
  '{"v":1,"k":"link","n":"x","p":null,"m":1}',
  '{"v":1,"k":"dir","n":"","p":null,"m":1}',
  '{"v":1,"k":"dir","n":"a/b","p":null,"m":1}',
  '{"v":1,"k":"dir","n":"x","p":"short","m":1}',
  '{"v":1,"k":"file","n":"x","p":null,"m":1,"s":1,"t":"a/b","fk":"AAAA"}',
  '{"v":1,"k":"file","n":"x","p":null,"m":1,"t":"a/b","fk":"AAAA","h":"AAAA"}',
]) {
  await fails(`bad meta ${bad}`, "bad_meta", () => metaFromJson(bad));
}

// ── dedupe tag ──
const dd = v.dedupe;
const kDedupe = await dedupeKey(vk);
same("dedupe key", kDedupe, dd.dedupeKey);
same("dedupe tag", await dedupeTag(kDedupe, fromB64u(dd.hash)), dd.tag);
checks++;
if ((await dedupeTag(await dedupeKey(seq(32, 0x11)), fromB64u(dd.hash))) === dd.tag) throw new Error("dedupe tag must differ in another vault");

// ── compressed file ──
const cz = v.compressed;
const zMeta = await openMeta(kMeta, vaultId, cz.objectId, cz.encMeta);
same("compressed meta opens with z", metaToJson(zMeta), cz.metaJson);
same("compressed meta seals", await sealMeta(kMeta, vaultId, cz.objectId, zMeta, fromB64u(cz.nonce)), cz.encMeta);
same("Rust's DEFLATE inflates here", await inflateRaw(fromB64u(cz.deflated), zMeta.size!), cz.plaintext);
same("the browser's DEFLATE round-trips", await inflateRaw(await deflateRaw(fromB64u(cz.plaintext)), zMeta.size!), cz.plaintext);
await fails("inflate, one byte short of the sealed size", "bad_compression", () => inflateRaw(fromB64u(cz.deflated), zMeta.size! - 1));
await fails("inflate, more than the sealed size", "bad_compression", () => inflateRaw(fromB64u(cz.deflated), zMeta.size! + 1));
await fails("inflate, not DEFLATE", "bad_compression", () => inflateRaw(enc.encode("not deflate at all"), 10));
await fails("inflate, a bomb stops at the limit", "bad_compression", async () => inflateRaw(await deflateRaw(new Uint8Array(10_000_000)), 1000));
await fails("unknown compression", "bad_meta", () => metaFromJson(cz.metaJson.replace('"z":"deflate"', '"z":"zstd"')));

// ── read exactly as Rust reads (audit 2026-10-21) ──
await fails("meta, a key twice", "bad_meta", () => metaFromJson('{"v":1,"k":"dir","n":"a","n":"b","p":null,"m":1}'));
await fails("meta, a lone surrogate in the name", "bad_meta", () => metaToJson({ kind: "dir", name: "a\uD800", parent: null, mtimeMs: 1 }));
await fails("device name, a lone surrogate", "bad_device_name", () => sealDeviceName(kMeta, vaultId, v.device.deviceId, "\uDC00x"));
{
  const noParent = metaFromJson('{"v":1,"k":"dir","n":"a","m":1}');
  if (noParent.parent !== null) throw new Error("a missing parent is the top of the Drive");
  const nullZ = metaFromJson(cz.metaJson.replace('"z":"deflate"', '"z":null'));
  if (nullZ.compression !== undefined) throw new Error("z null is not compressed");
  for (const bad of ["YQ==", "Y+", "YR", "Y"]) {
    let threw = false;
    try {
      fromB64u(bad);
    } catch {
      threw = true;
    }
    if (!threw) throw new Error(`fromB64u accepted ${bad}`);
  }
  checks += 6;
}

// ── links from Drive ──
{
  const l = v.link;
  const key = fromB64u(l.linkKey);
  const m = await openLink(key, l.linkId, l.manifest);
  same("link manifest opens to the canonical JSON", linkToJson(m), l.manifestJson);
  same("link manifest seals byte for byte", await sealLink(key, l.linkId, linkFromJson(l.manifestJson), fromB64u(l.nonce)), l.manifest);
  same("link file path", m.files[0]!.path, "Trip/" + JSON.parse(v.file.metaJson).n);
  same("link thumbnail flag", m.files[0]!.hasThumb, true);
  same("link compression", m.files[1]!.compression, "deflate");
  await fails("link, other id", "auth_failed", () => openLink(key, v.file.objectId, l.manifest));
  await fails("link, other key", "auth_failed", () => openLink(seq(32, 0x01), l.linkId, l.manifest));
  await fails("link, id not an id", "invalid_object_id", () => openLink(key, "nope", l.manifest));
  for (const bad of ["", "/a", "a/", "a//b", "../a", "a/./b"]) {
    await fails(`link path ${JSON.stringify(bad)}`, "bad_link", () => linkToJson({ ...m, files: [{ ...m.files[0]!, path: bad }, m.files[1]!] }));
  }
  await fails("file link, path is not the name", "bad_link", () => linkToJson({ ...m, kind: "file", files: [m.files[0]!] }));
  await fails("link, a file twice", "bad_link", () => linkToJson({ ...m, files: [m.files[0]!, { ...m.files[1]!, objectId: m.files[0]!.objectId }] }));
  await fails("link, unknown version", "bad_link", () => linkFromJson(l.manifestJson.replace('"v":1', '"v":2')));
  await fails("link, unknown compression", "bad_link", () => linkFromJson(l.manifestJson.replace('"z":"deflate"', '"z":"zstd"')));
  await fails("link, a key twice", "bad_link", () => linkFromJson(l.manifestJson.replace('{"v":1,', '{"v":1,"v":1,')));
}

// ── grant ──
const g = v.grant;
const newKey = grantKeyFromSecret(fromB64u(g.newPriv));
const granter = grantKeyFromSecret(fromB64u(g.granterPriv));
same("new pub", newKey.public, g.newPub);
same("granter pub", granter.public, g.granterPub);
same("grant box", await grant(vk, vaultId, granter, newKey.public, fromB64u(g.nonce)), g.box);
same("grant opens", await acceptGrant(vaultId, newKey, granter.public, fromB64u(g.box), v.keyCheck), v.vaultKey);
await fails("grant, other vault", "auth_failed", () => acceptGrant(otherVault, newKey, granter.public, fromB64u(g.box), v.keyCheck));
await fails("grant, wrong key check", "key_check_mismatch", async () => acceptGrant(vaultId, newKey, granter.public, fromB64u(g.box), await keyCheck(seq(32, 0x11))));
await fails("grant, stranger", "auth_failed", () => acceptGrant(vaultId, grantKeyFromSecret(seq(32, 0x77)), granter.public, fromB64u(g.box), v.keyCheck));
await fails("grant, zero public key", "bad_public_key", () => grant(vk, vaultId, granter, new Uint8Array(32)));

console.log(`vault vectors: OK (${checks} checks, byte-identical to Rust, all failure cases fail)`);
