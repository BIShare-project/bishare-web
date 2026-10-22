// Vault (BIShare Drive) keys, envelopes and signatures — the browser's copy of
// VAULT-SPEC.md (bishare-flutter/rust/bishare-protocol/VAULT-SPEC.md). The
// Rust module in that crate is the canonical implementation; the vectors it
// writes (vault-vectors.json next to this file) are checked against this code
// by tools/vault-vectors.ts, so a change that breaks either side fails there.
//
// WebCrypto does HKDF, AES-GCM and SHA-256; @noble/curves does Ed25519 and
// X25519. Nothing here returns plaintext from a failed authentication.
import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { BIP39_ENGLISH } from "./bip39-english";

const enc = new TextEncoder();
// Fatal, and a BOM is kept (not dropped): bytes that are not UTF-8 are
// refused, and a name reads exactly as Rust and the app read it.
const dec = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

export const KEY_SIZE = 32;
export const NONCE_SIZE = 12;
export const TAG_SIZE = 16;
export const ID_SIZE = 16;
export const VAULT_ID_LEN = 26;
export const SHORT_ID_LEN = 22;
export const KEY_COPY_SIZE = 4 + 1 + NONCE_SIZE + KEY_SIZE + TAG_SIZE;
export const META_VERSION = 1;
export const AUTH_SCHEME = "BIShare-Vault";
export const REQUEST_WINDOW_SECS = 300;
export const DEDUPE_TAG_SIZE = 16;

const KEY_COPY_MAGIC = [0x42, 0x53, 0x56, 0x4b]; // "BSVK"
const KEY_COPY_VERSION = 1;
const ZERO_SALT = new Uint8Array(32);
const INFO_KID = "bishare-vault-kid-v1";
const INFO_META = "bishare-vault-meta-v1";
const INFO_BACKUP = "bishare-vault-backup-v1";
const INFO_THUMB = "bishare-vault-thumb-v1";
const INFO_GRANT = "bishare-vault-grant-v1";
const INFO_DEDUPE = "bishare-vault-dedupe-v1";
const AAD_META = "bishare-vault-meta-v1";
const AAD_THUMB = "bishare-vault-thumb-v1";
const AAD_DEVICE = "bishare-vault-device-v1";
/** Longest device name a writer emits, in characters (VAULT-SPEC "Device names"). */
export const DEVICE_NAME_MAX = 100;
const REQ_PREFIX = "bishare-vault-req-v1";
const NONCE_PREFIX = "bishare-vault-nonce-v1";
const PHRASE_WORDS = 24;

export type VaultErrorCode =
  | "invalid_key"
  | "invalid_vault_id"
  | "invalid_object_id"
  | "sealed_box_too_short"
  | "auth_failed"
  | "bad_key_copy"
  | "bad_public_key"
  | "bad_phrase"
  | "bad_meta"
  | "bad_device_name"
  | "bad_signature"
  | "bad_authorization"
  | "key_check_mismatch"
  | "bad_compression";

export class VaultError extends Error {
  constructor(
    public readonly code: VaultErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "VaultError";
  }
}

// ── encoding ────────────────────────────────────────────────────────────────

export function b64u(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Strict: the URL alphabet only, no padding, and only the one spelling that
 * encodes these bytes (the last character's spare bits zero), as Rust and the
 * app read it. Throws on anything else.
 */
export function fromB64u(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) throw new TypeError("not base64url");
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  if (b64u(out) !== s) throw new TypeError("not canonical base64url");
  return out;
}

/** A lone UTF-16 surrogate: not text Rust can hold. */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** The keys of a flat JSON object, in order (the text already parsed as JSON). */
function topLevelKeys(json: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  let expectKey = false;
  for (let i = 0; i < json.length; i++) {
    const c = json[i];
    if (c === '"') {
      let j = i + 1;
      while (json[j] !== '"') j += json[j] === "\\" ? 2 : 1;
      if (depth === 1 && expectKey) keys.push(JSON.parse(json.slice(i, j + 1)) as string);
      expectKey = false;
      i = j;
    } else if (c === "{" || c === "[") {
      depth++;
      expectKey = c === "{" && depth === 1;
    } else if (c === "}" || c === "]") {
      depth--;
    } else if (c === "," && depth === 1) {
      expectKey = true;
    }
  }
  return keys;
}

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function buf(u8: Uint8Array): ArrayBuffer {
  return u8.byteOffset === 0 && u8.byteLength === u8.buffer.byteLength
    ? (u8.buffer as ArrayBuffer)
    : (u8.slice().buffer as ArrayBuffer);
}

function random(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function equal(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Lowercase RFC 4648 base32 without padding — the text form of a vault id. */
export function base32Lower(bytes: Uint8Array): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let out = "";
  let acc = 0;
  let bits = 0;
  for (const b of bytes) {
    acc = ((acc << 8) | b) >>> 0;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(acc >>> bits) & 31];
    }
  }
  if (bits > 0) out += alphabet[(acc << (5 - bits)) & 31];
  return out;
}

export function isVaultId(s: string): boolean {
  return /^[a-z2-7]{26}$/.test(s);
}

export function isObjectId(s: string): boolean {
  if (s.length !== SHORT_ID_LEN || !/^[A-Za-z0-9_-]+$/.test(s)) return false;
  try {
    return fromB64u(s).length === ID_SIZE;
  } catch {
    return false;
  }
}

function checkIds(vaultId: string, objectId: string): void {
  if (!isVaultId(vaultId)) throw new VaultError("invalid_vault_id");
  if (!isObjectId(objectId)) throw new VaultError("invalid_object_id");
}

function key32(k: Uint8Array): Uint8Array {
  if (k.length !== KEY_SIZE) throw new VaultError("invalid_key");
  return k;
}

// ── primitives ──────────────────────────────────────────────────────────────

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buf(data)));
}

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: string, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(enc.encode(info)) },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

/** nonce ‖ AES-256-GCM(key, nonce, plain, aad) — the "box" of the spec. */
async function seal(key: Uint8Array, plain: Uint8Array, aad: Uint8Array, nonce = random(NONCE_SIZE)): Promise<Uint8Array> {
  if (nonce.length !== NONCE_SIZE) throw new VaultError("invalid_key", "nonce must be 12 bytes");
  const k = await crypto.subtle.importKey("raw", buf(key32(key)), "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(nonce), additionalData: buf(aad) }, k, buf(plain)));
  return concat(nonce, ct);
}

async function open(key: Uint8Array, box: Uint8Array, aad: Uint8Array): Promise<Uint8Array> {
  if (box.length < NONCE_SIZE + TAG_SIZE) throw new VaultError("sealed_box_too_short");
  const k = await crypto.subtle.importKey("raw", buf(key32(key)), "AES-GCM", false, ["decrypt"]);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf(box.subarray(0, NONCE_SIZE)), additionalData: buf(aad) }, k, buf(box.subarray(NONCE_SIZE))),
    );
  } catch {
    throw new VaultError("auth_failed");
  }
}

// ── vault key ───────────────────────────────────────────────────────────────

export function generateVaultKey(): Uint8Array {
  return random(KEY_SIZE);
}

export function generateFileKey(): Uint8Array {
  return random(KEY_SIZE);
}

export function generateObjectId(): string {
  return b64u(random(ID_SIZE));
}

/** What the server knows about VK, and what a received VK is checked against. */
export async function keyCheck(vaultKey: Uint8Array): Promise<string> {
  return b64u(await hkdf(key32(vaultKey), ZERO_SALT, INFO_KID, 16));
}

export async function metaKey(vaultKey: Uint8Array): Promise<Uint8Array> {
  return hkdf(key32(vaultKey), ZERO_SALT, INFO_META, KEY_SIZE);
}

export async function thumbKey(fileKey: Uint8Array): Promise<Uint8Array> {
  return hkdf(key32(fileKey), ZERO_SALT, INFO_THUMB, KEY_SIZE);
}

/** `K_dedupe`: keys the dedupe tag; it never leaves the device. */
export async function dedupeKey(vaultKey: Uint8Array): Promise<Uint8Array> {
  return hkdf(key32(vaultKey), ZERO_SALT, INFO_DEDUPE, KEY_SIZE);
}

/** b64u(HMAC-SHA256(K_dedupe, h)[0..16)): same content in the same vault, same tag. */
export async function dedupeTag(dedupeKey: Uint8Array, plaintextHash: Uint8Array): Promise<string> {
  if (plaintextHash.length !== 32) throw new VaultError("invalid_key", "hash must be 32 bytes");
  const k = await crypto.subtle.importKey("raw", buf(key32(dedupeKey)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, buf(plaintextHash)));
  return b64u(mac.slice(0, DEDUPE_TAG_SIZE));
}

// ── compression ───────────────────────────────────────────────────────────────

/** Bytes handed to a (de)compressor at a time: it inflates one write at a time, so a small write keeps the limit check close. */
const PIPE_SLICE = 64 * 1024;

async function pipeAll(stream: TransformStream<Uint8Array, Uint8Array>, data: Uint8Array, limit: number): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void (async () => {
    for (let i = 0; i < data.length; i += PIPE_SLICE) await writer.write(data.subarray(i, i + PIPE_SLICE));
    await writer.close();
  })().catch(() => {});
  const reader = stream.readable.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel().catch(() => {});
      throw new VaultError("bad_compression", "more bytes than the sealed size");
    }
    parts.push(value);
  }
  return concat(...parts);
}

/** Raw DEFLATE (RFC 1951) of a whole buffer, as the browser's encoder writes it. */
export async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  return pipeAll(new CompressionStream("deflate-raw") as unknown as TransformStream<Uint8Array, Uint8Array>, data, Number.MAX_SAFE_INTEGER);
}

/** Inflate raw DEFLATE to exactly `expectedLen` bytes (the sealed `s`); never more. */
export async function inflateRaw(data: Uint8Array, expectedLen: number): Promise<Uint8Array> {
  let out: Uint8Array;
  try {
    out = await pipeAll(new DecompressionStream("deflate-raw") as unknown as TransformStream<Uint8Array, Uint8Array>, data, expectedLen);
  } catch (e) {
    if (e instanceof VaultError) throw e;
    throw new VaultError("bad_compression", "not a raw DEFLATE stream");
  }
  if (out.length !== expectedLen) throw new VaultError("bad_compression", "fewer bytes than the sealed size");
  return out;
}

// ── the recovery phrase (BIP-39, English, 24 words) ─────────────────────────

const WORD_INDEX = new Map(BIP39_ENGLISH.map((w, i) => [w, i] as const));

/** The 24 lowercase words that encode VK, separated by single spaces. */
export async function phraseFromKey(vaultKey: Uint8Array): Promise<string> {
  key32(vaultKey);
  const check = (await sha256(vaultKey))[0]; // 256 bits of entropy → 8 checksum bits
  const bits: number[] = [];
  for (const b of vaultKey) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  for (let i = 7; i >= 0; i--) bits.push((check >> i) & 1);
  const words: string[] = [];
  for (let w = 0; w < PHRASE_WORDS; w++) {
    let index = 0;
    for (let i = 0; i < 11; i++) index = (index << 1) | bits[w * 11 + i];
    words.push(BIP39_ENGLISH[index]);
  }
  return words.join(" ");
}

/**
 * VK from a phrase as a person typed it. Case, extra spaces and Unicode
 * compatibility forms are forgiven; a wrong word, count or checksum is not.
 */
export async function keyFromPhrase(phrase: string): Promise<Uint8Array> {
  const words = phrase.normalize("NFKD").toLowerCase().trim().split(/\s+/);
  if (words.length !== PHRASE_WORDS) throw new VaultError("bad_phrase");
  const bits: number[] = [];
  for (const w of words) {
    const index = WORD_INDEX.get(w);
    if (index === undefined) throw new VaultError("bad_phrase");
    for (let i = 10; i >= 0; i--) bits.push((index >> i) & 1);
  }
  const key = new Uint8Array(KEY_SIZE);
  for (let i = 0; i < KEY_SIZE * 8; i++) key[i >> 3] = (key[i >> 3] << 1) | bits[i];
  let check = 0;
  for (let i = KEY_SIZE * 8; i < bits.length; i++) check = (check << 1) | bits[i];
  if (check !== (await sha256(key))[0]) throw new VaultError("bad_phrase");
  return key;
}

// ── key copy ────────────────────────────────────────────────────────────────

async function backupKey(serverHalf: Uint8Array): Promise<Uint8Array> {
  return hkdf(key32(serverHalf), ZERO_SALT, INFO_BACKUP, KEY_SIZE);
}

/** The 65-byte copy of VK kept in the person's own account. `nonce` is fixed only by tests. */
export async function sealKeyCopy(serverHalf: Uint8Array, vaultId: string, vaultKey: Uint8Array, nonce?: Uint8Array): Promise<Uint8Array> {
  if (!isVaultId(vaultId)) throw new VaultError("invalid_vault_id");
  const box = await seal(await backupKey(serverHalf), key32(vaultKey), enc.encode(vaultId), nonce);
  return concat(Uint8Array.from([...KEY_COPY_MAGIC, KEY_COPY_VERSION]), box);
}

/** VK from a key copy. The caller still compares keyCheck() of it with the server's value. */
export async function openKeyCopy(serverHalf: Uint8Array, vaultId: string, keyCopy: Uint8Array): Promise<Uint8Array> {
  if (!isVaultId(vaultId)) throw new VaultError("invalid_vault_id");
  if (keyCopy.length !== KEY_COPY_SIZE || KEY_COPY_MAGIC.some((b, i) => keyCopy[i] !== b) || keyCopy[4] !== KEY_COPY_VERSION) {
    throw new VaultError("bad_key_copy");
  }
  const key = await open(await backupKey(serverHalf), keyCopy.subarray(5), enc.encode(vaultId));
  if (key.length !== KEY_SIZE) throw new VaultError("bad_key_copy");
  return key;
}

// ── object metadata ─────────────────────────────────────────────────────────

export interface ObjectMeta {
  kind: "file" | "dir";
  /** As typed; never empty, no "/", no U+0000. */
  name: string;
  /** The parent object id, or null at the root. */
  parent: string | null;
  /** Modification time, Unix milliseconds. */
  mtimeMs: number;
  /** Plaintext size in bytes (files). */
  size?: number;
  /** MIME type (files). */
  mime?: string;
  /** The BSE2 key for the file's bytes (files). */
  fileKey?: Uint8Array;
  /** SHA-256 of the plaintext (files). */
  hash?: Uint8Array;
  /** "deflate" when the blob holds the bytes compressed (files); size and hash stay those of the file. */
  compression?: "deflate";
}

function validateMeta(m: ObjectMeta): void {
  if (!m.name) throw new VaultError("bad_meta", "empty name");
  if (LONE_SURROGATE.test(m.name)) throw new VaultError("bad_meta", "name is not text");
  if (m.name.includes("/") || m.name.includes("\0")) throw new VaultError("bad_meta", "name contains / or NUL");
  if (m.parent !== null && !isObjectId(m.parent)) throw new VaultError("bad_meta", "parent is not an object id");
  if (!Number.isInteger(m.mtimeMs)) throw new VaultError("bad_meta", "mtime is not an integer");
  if (m.kind === "file") {
    if (m.size === undefined || !Number.isInteger(m.size) || m.size < 0) throw new VaultError("bad_meta", "file without size");
    if (!m.mime) throw new VaultError("bad_meta", "file without mime type");
    if (m.fileKey?.length !== KEY_SIZE) throw new VaultError("bad_meta", "file without file key");
    if (m.hash?.length !== 32) throw new VaultError("bad_meta", "file without hash");
    if (m.compression !== undefined && m.compression !== "deflate") throw new VaultError("bad_meta", "unknown compression");
  } else if (m.kind !== "dir") {
    throw new VaultError("bad_meta", "unknown kind");
  }
}

/** The canonical JSON of the spec: this key order, no whitespace, file-only keys dropped for a folder. */
export function metaToJson(m: ObjectMeta): string {
  validateMeta(m);
  const wire: Record<string, unknown> = { v: META_VERSION, k: m.kind, n: m.name, p: m.parent, m: m.mtimeMs };
  if (m.kind === "file") {
    wire.s = m.size;
    wire.t = m.mime;
    wire.fk = b64u(m.fileKey!);
    wire.h = b64u(m.hash!);
    if (m.compression) wire.z = m.compression;
  }
  return JSON.stringify(wire);
}

/** Reads any JSON serialization; unknown keys are ignored, but an unknown `z` is refused. */
export function metaFromJson(json: string): ObjectMeta {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new VaultError("bad_meta", "not JSON");
  }
  if (j === null || typeof j !== "object" || Array.isArray(j)) throw new VaultError("bad_meta", "not an object");
  // JSON.parse keeps the last of two equal keys; Rust refuses the object.
  const keys = topLevelKeys(json);
  if (new Set(keys).size !== keys.length) throw new VaultError("bad_meta", "a key appears twice");
  if (j.v !== META_VERSION) throw new VaultError("bad_meta", "unknown version");
  if (j.k !== "file" && j.k !== "dir") throw new VaultError("bad_meta", "unknown kind");
  if (typeof j.n !== "string") throw new VaultError("bad_meta", "name is not a string");
  // An absent parent is the top of the Drive, as in Rust.
  if (j.p === undefined) j.p = null;
  if (j.p !== null && typeof j.p !== "string") throw new VaultError("bad_meta", "parent is not a string");
  if (typeof j.m !== "number") throw new VaultError("bad_meta", "mtime is not a number");
  const key32field = (v: unknown, what: string): Uint8Array | undefined => {
    if (v === undefined) return undefined;
    if (typeof v !== "string") throw new VaultError("bad_meta", `${what} is not a string`);
    let bytes: Uint8Array;
    try {
      bytes = fromB64u(v);
    } catch {
      throw new VaultError("bad_meta", `${what} is not base64url`);
    }
    if (bytes.length !== 32) throw new VaultError("bad_meta", `${what} is not 32 bytes`);
    return bytes;
  };
  const file = j.k === "file";
  const meta: ObjectMeta = { kind: j.k, name: j.n, parent: j.p, mtimeMs: j.m };
  if (file) {
    if (j.s !== undefined) {
      if (typeof j.s !== "number") throw new VaultError("bad_meta", "size is not a number");
      meta.size = j.s;
    }
    if (j.t !== undefined) {
      if (typeof j.t !== "string") throw new VaultError("bad_meta", "mime is not a string");
      meta.mime = j.t;
    }
    meta.fileKey = key32field(j.fk, "file key");
    meta.hash = key32field(j.h, "hash");
    // Absent or null: stored as is (Rust reads null the same way).
    if (j.z !== undefined && j.z !== null) {
      if (j.z !== "deflate") throw new VaultError("bad_meta", "unknown compression");
      meta.compression = "deflate";
    }
  }
  validateMeta(meta);
  return meta;
}

function metaAad(vaultId: string, objectId: string): Uint8Array {
  checkIds(vaultId, objectId);
  return enc.encode(`${AAD_META}|${vaultId}|${objectId}`);
}

function thumbAad(vaultId: string, objectId: string): Uint8Array {
  checkIds(vaultId, objectId);
  return enc.encode(`${AAD_THUMB}|${vaultId}|${objectId}`);
}

/** enc_meta for one object. `nonce` is fixed only by tests. */
export async function sealMeta(kMeta: Uint8Array, vaultId: string, objectId: string, meta: ObjectMeta, nonce?: Uint8Array): Promise<string> {
  const aad = metaAad(vaultId, objectId);
  return b64u(await seal(kMeta, enc.encode(metaToJson(meta)), aad, nonce));
}

export async function openMeta(kMeta: Uint8Array, vaultId: string, objectId: string, encMeta: string): Promise<ObjectMeta> {
  const aad = metaAad(vaultId, objectId);
  let box: Uint8Array;
  try {
    box = fromB64u(encMeta);
  } catch {
    throw new VaultError("sealed_box_too_short");
  }
  const plain = await open(kMeta, box, aad);
  let json: string;
  try {
    json = dec.decode(plain);
  } catch {
    throw new VaultError("bad_meta", "not UTF-8");
  }
  return metaFromJson(json);
}

// ── device names ────────────────────────────────────────────────────────────

function deviceAad(vaultId: string, deviceId: string): Uint8Array {
  checkIds(vaultId, deviceId);
  return enc.encode(`${AAD_DEVICE}|${vaultId}|${deviceId}`);
}

function checkDeviceName(name: string): void {
  if (name.length === 0 || name.includes("\u0000") || LONE_SURROGATE.test(name)) throw new VaultError("bad_device_name");
}

/** enc_name for one device. `nonce` is fixed only by tests. */
export async function sealDeviceName(kMeta: Uint8Array, vaultId: string, deviceId: string, name: string, nonce?: Uint8Array): Promise<string> {
  checkDeviceName(name);
  if ([...name].length > DEVICE_NAME_MAX) throw new VaultError("bad_device_name", "too long");
  return b64u(await seal(kMeta, enc.encode(name), deviceAad(vaultId, deviceId), nonce));
}

export async function openDeviceName(kMeta: Uint8Array, vaultId: string, deviceId: string, encName: string): Promise<string> {
  const aad = deviceAad(vaultId, deviceId);
  let box: Uint8Array;
  try {
    box = fromB64u(encName);
  } catch {
    throw new VaultError("sealed_box_too_short");
  }
  let name: string;
  try {
    name = dec.decode(await open(kMeta, box, aad));
  } catch (e) {
    if (e instanceof VaultError) throw e;
    throw new VaultError("bad_device_name", "not UTF-8");
  }
  checkDeviceName(name);
  return name;
}

// ── thumbnails ──────────────────────────────────────────────────────────────

export async function sealThumbnail(fileKey: Uint8Array, vaultId: string, objectId: string, jpeg: Uint8Array, nonce?: Uint8Array): Promise<Uint8Array> {
  const aad = thumbAad(vaultId, objectId);
  return seal(await thumbKey(fileKey), jpeg, aad, nonce);
}

export async function openThumbnail(fileKey: Uint8Array, vaultId: string, objectId: string, sealed: Uint8Array): Promise<Uint8Array> {
  const aad = thumbAad(vaultId, objectId);
  return open(await thumbKey(fileKey), sealed, aad);
}

// ── the grant: VK from one device to another ────────────────────────────────

export interface GrantKey {
  secret: Uint8Array;
  public: Uint8Array;
}

export function newGrantKey(): GrantKey {
  const secret = x25519.utils.randomSecretKey();
  return { secret, public: x25519.getPublicKey(secret) };
}

export function grantKeyFromSecret(secret: Uint8Array): GrantKey {
  return { secret: key32(secret), public: x25519.getPublicKey(secret) };
}

async function wrapKey(mine: GrantKey, theirPub: Uint8Array, newPub: Uint8Array, granterPub: Uint8Array): Promise<Uint8Array> {
  if (theirPub.length !== KEY_SIZE) throw new VaultError("bad_public_key");
  let shared: Uint8Array;
  try {
    shared = x25519.getSharedSecret(mine.secret, theirPub);
  } catch {
    throw new VaultError("bad_public_key");
  }
  if (shared.every((b) => b === 0)) throw new VaultError("bad_public_key");
  return hkdf(shared, concat(newPub, granterPub), INFO_GRANT, KEY_SIZE);
}

/** The granter seals VK for the new device whose public key it read from a QR code. */
export async function grant(vaultKey: Uint8Array, vaultId: string, mine: GrantKey, newPub: Uint8Array, nonce?: Uint8Array): Promise<Uint8Array> {
  if (!isVaultId(vaultId)) throw new VaultError("invalid_vault_id");
  const wrap = await wrapKey(mine, newPub, newPub, mine.public);
  return seal(wrap, key32(vaultKey), enc.encode(vaultId), nonce);
}

/** The new device opens a grant and accepts VK only if it matches the account's key check. */
export async function acceptGrant(vaultId: string, mine: GrantKey, granterPub: Uint8Array, box: Uint8Array, expectedKeyCheck: string): Promise<Uint8Array> {
  if (!isVaultId(vaultId)) throw new VaultError("invalid_vault_id");
  const wrap = await wrapKey(mine, granterPub, mine.public, granterPub);
  const key = await open(wrap, box, enc.encode(vaultId));
  if (key.length !== KEY_SIZE || (await keyCheck(key)) !== expectedKeyCheck) throw new VaultError("key_check_mismatch");
  return key;
}

// ── device key, sign-in nonce and signed requests ───────────────────────────

export function generateDeviceSeed(): Uint8Array {
  return ed25519.utils.randomSecretKey();
}

export function devicePublicKey(seed: Uint8Array): Uint8Array {
  return ed25519.getPublicKey(key32(seed));
}

/** b64u(SHA-256(public key)[0..16)). */
export async function deviceIdOf(publicKey: Uint8Array): Promise<string> {
  return b64u((await sha256(key32(publicKey))).subarray(0, ID_SIZE));
}

/** The nonce a device puts into its Apple or Google sign-in request. */
export async function signinNonce(publicKey: Uint8Array): Promise<string> {
  return b64u(await sha256(concat(enc.encode(NONCE_PREFIX), key32(publicKey))));
}

/** The bytes a request signature covers. */
export async function requestMessage(method: string, pathAndQuery: string, ts: number, body: Uint8Array): Promise<string> {
  return `${REQ_PREFIX}\n${method.toUpperCase()}\n${pathAndQuery}\n${ts}\n${hex(await sha256(body))}`;
}

/** b64u of the Ed25519 signature over requestMessage(). */
export async function signRequest(seed: Uint8Array, method: string, pathAndQuery: string, ts: number, body: Uint8Array): Promise<string> {
  const message = enc.encode(await requestMessage(method, pathAndQuery, ts, body));
  return b64u(ed25519.sign(message, key32(seed)));
}

export interface Authorization {
  vaultId: string;
  deviceId: string;
  ts: number;
  signature: string;
}

export function authorizationHeader(a: Authorization): string {
  return `${AUTH_SCHEME} v=1,vault=${a.vaultId},device=${a.deviceId},ts=${a.ts},sig=${a.signature}`;
}

/** The complete Authorization header value for one request. */
export async function authorization(seed: Uint8Array, vaultId: string, method: string, pathAndQuery: string, ts: number, body: Uint8Array): Promise<string> {
  if (!isVaultId(vaultId)) throw new VaultError("invalid_vault_id");
  return authorizationHeader({
    vaultId,
    deviceId: await deviceIdOf(devicePublicKey(seed)),
    ts,
    signature: await signRequest(seed, method, pathAndQuery, ts, body),
  });
}

/**
 * A browser waiting in a web pairing slot signs with its own device key
 * before it belongs to any vault (VAULT-SPEC "Opening the Drive in a
 * browser"): the slot instead of the vault and device, another label.
 */
export async function pairAuthorization(seed: Uint8Array, slot: string, method: string, pathAndQuery: string, ts: number, body: Uint8Array): Promise<string> {
  const message = `bishare-vault-pair-v1\n${method.toUpperCase()}\n${pathAndQuery}\n${ts}\n${hex(await sha256(body))}`;
  return `BIShare-Vault-Pair v=1,slot=${slot},ts=${ts},sig=${b64u(ed25519.sign(enc.encode(message), key32(seed)))}`;
}

export function parseAuthorization(header: string): Authorization {
  const bad = () => new VaultError("bad_authorization");
  if (!header.startsWith(AUTH_SCHEME + " ")) throw bad();
  const fields = new Map<string, string>();
  for (const part of header.slice(AUTH_SCHEME.length + 1).split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) throw bad();
    const k = part.slice(0, eq);
    if (!["v", "vault", "device", "ts", "sig"].includes(k) || fields.has(k)) throw bad();
    fields.set(k, part.slice(eq + 1));
  }
  if (fields.get("v") !== "1") throw bad();
  const vaultId = fields.get("vault");
  const deviceId = fields.get("device");
  const tsText = fields.get("ts");
  const signature = fields.get("sig");
  if (!vaultId || !isVaultId(vaultId) || !deviceId || !isObjectId(deviceId) || !tsText || !/^-?\d+$/.test(tsText) || !signature) throw bad();
  const ts = Number(tsText);
  if (!Number.isSafeInteger(ts)) throw bad();
  try {
    if (fromB64u(signature).length !== 64) throw bad();
  } catch {
    throw bad();
  }
  return { vaultId, deviceId, ts, signature };
}

/** What the server does with a request. */
export async function verifyRequest(publicKey: Uint8Array, method: string, pathAndQuery: string, ts: number, body: Uint8Array, signatureB64u: string): Promise<void> {
  let sig: Uint8Array;
  try {
    sig = fromB64u(signatureB64u);
  } catch {
    throw new VaultError("bad_signature");
  }
  if (sig.length !== 64) throw new VaultError("bad_signature");
  const message = enc.encode(await requestMessage(method, pathAndQuery, ts, body));
  let ok = false;
  try {
    ok = ed25519.verify(sig, message, key32(publicKey));
  } catch {
    throw new VaultError("bad_public_key");
  }
  if (!ok) throw new VaultError("bad_signature");
}

export { equal as constantTimeEqual };
