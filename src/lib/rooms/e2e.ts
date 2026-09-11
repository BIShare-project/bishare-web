// End-to-end encryption for Cloud rooms, v1.
//
// A Cloud room's files sit in R2 until the room closes, so — like a transfer
// link — the relay must only ever hold ciphertext. A transfer carries its key
// in the link fragment; a room is joined by typing a code, so its key instead
// travels member to member, sealed to each newcomer's X25519 public key and
// relayed by the room's Durable Object, which therefore only sees public keys
// and sealed boxes.
//
// Wire spec (the app implements the same — bishare-flutter
// lib/features/room/data/room_e2e.dart — and both are pinned by the test
// vectors in room-e2e-vectors.json):
//
//   b64u(x)  = base64url without padding
//   HKDF     = HKDF-SHA256
//
//   Room key K        32 random bytes, made by the creator's device.
//   kid               b64u(HKDF(ikm=K, salt=32×0x00, info="bishare-room-kid-v1", 16))
//                     registered with the room at creation; a member checks any
//                     K it receives against it, so a wrong key is refused.
//   Per file          S = 16 random bytes (sent as X-Enc-Salt = b64u(S))
//     fileKey         HKDF(K, S, "bishare-room-file-v1", 32) → the BSE2 key for the bytes
//     metaKey         HKDF(K, S, "bishare-room-meta-v1", 32)
//     X-Enc-Meta      b64u(nonce12 ‖ AES-256-GCM(metaKey, nonce,
//                          utf8(JSON {n: name, t: mime, s: size, th?: jpegBase64}),
//                          aad = utf8("bishare-room-meta-v1")))
//   Hand-off          every member joins with a fresh X25519 key pair.
//     shared          X25519(myPriv, theirPub), refused if all zero
//     wrapKey         HKDF(shared, salt = joinerPub ‖ granterPub, "bishare-room-grant-v1", 32)
//     box             b64u(nonce12 ‖ AES-256-GCM(wrapKey, nonce, K, aad = utf8(roomCode)))
//
// What stays visible to the server: sizes, timing, who is in the room, and
// that a file exists. Names, types, previews and bytes do not.
import { x25519 } from "@noble/curves/ed25519.js";

const enc = new TextEncoder();
const dec = new TextDecoder();

const KID_INFO = "bishare-room-kid-v1";
const FILE_INFO = "bishare-room-file-v1";
const META_INFO = "bishare-room-meta-v1";
const GRANT_INFO = "bishare-room-grant-v1";
export const E2E_VERSION = 1;

// ── encoding ────────────────────────────────────────────────────────────────

export function b64u(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64u(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
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

// ── primitives ──────────────────────────────────────────────────────────────

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: string, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(enc.encode(info)) },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function seal(key: Uint8Array, plain: Uint8Array, aad: string, nonce = random(12)): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", buf(key), "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(nonce), additionalData: buf(enc.encode(aad)) }, k, buf(plain)),
  );
  const out = new Uint8Array(12 + ct.length);
  out.set(nonce, 0);
  out.set(ct, 12);
  return out;
}

async function open(key: Uint8Array, box: Uint8Array, aad: string): Promise<Uint8Array> {
  if (box.length < 12 + 16) throw new RoomKeyError("sealed box too short");
  const k = await crypto.subtle.importKey("raw", buf(key), "AES-GCM", false, ["decrypt"]);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: buf(box.subarray(0, 12)), additionalData: buf(enc.encode(aad)) },
        k,
        buf(box.subarray(12)),
      ),
    );
  } catch {
    throw new RoomKeyError("could not open sealed box");
  }
}

export class RoomKeyError extends Error {}

// ── room key ────────────────────────────────────────────────────────────────

export function newRoomKey(): Uint8Array {
  return random(32);
}

export async function keyId(roomKey: Uint8Array): Promise<string> {
  return b64u(await hkdf(roomKey, new Uint8Array(32), KID_INFO, 16));
}

// ── files ───────────────────────────────────────────────────────────────────

export interface FileMeta {
  name: string;
  type: string;
  size: number; // plaintext bytes
  thumbnail?: string; // JPEG, base64 (no prefix)
}

export interface SealedFile {
  salt: string; // X-Enc-Salt
  meta: string; // X-Enc-Meta
  fileKey: Uint8Array; // BSE2 key for the bytes
}

export async function fileKeys(roomKey: Uint8Array, salt: Uint8Array): Promise<{ fileKey: Uint8Array; metaKey: Uint8Array }> {
  const [fileKey, metaKey] = await Promise.all([
    hkdf(roomKey, salt, FILE_INFO, 32),
    hkdf(roomKey, salt, META_INFO, 32),
  ]);
  return { fileKey, metaKey };
}

/** Everything an upload needs: the salt and sealed metadata headers, and the BSE2 key. */
export async function sealFile(roomKey: Uint8Array, meta: FileMeta, salt = random(16), nonce?: Uint8Array): Promise<SealedFile> {
  const { fileKey, metaKey } = await fileKeys(roomKey, salt);
  const json = JSON.stringify({ n: meta.name, t: meta.type, s: meta.size, ...(meta.thumbnail ? { th: meta.thumbnail } : {}) });
  const box = await seal(metaKey, enc.encode(json), META_INFO, nonce);
  return { salt: b64u(salt), meta: b64u(box), fileKey };
}

/** Metadata and BSE2 key for a file someone else sealed. Throws RoomKeyError on a wrong key. */
export async function openFile(roomKey: Uint8Array, saltB64: string, metaB64: string): Promise<{ meta: FileMeta; fileKey: Uint8Array }> {
  const { fileKey, metaKey } = await fileKeys(roomKey, fromB64u(saltB64));
  const plain = await open(metaKey, fromB64u(metaB64), META_INFO);
  const j = JSON.parse(dec.decode(plain)) as { n?: unknown; t?: unknown; s?: unknown; th?: unknown };
  return {
    meta: {
      name: typeof j.n === "string" && j.n ? j.n : "file",
      type: typeof j.t === "string" && j.t ? j.t : "application/octet-stream",
      size: typeof j.s === "number" ? j.s : 0,
      ...(typeof j.th === "string" && j.th ? { thumbnail: j.th } : {}),
    },
    fileKey,
  };
}

// ── hand-off ────────────────────────────────────────────────────────────────

export interface KeyPair {
  priv: Uint8Array;
  pub: Uint8Array;
}

export function newKeyPair(): KeyPair {
  const priv = x25519.utils.randomSecretKey();
  return { priv, pub: x25519.getPublicKey(priv) };
}

async function wrapKeyFor(mine: KeyPair, theirPub: Uint8Array, joinerPub: Uint8Array, granterPub: Uint8Array): Promise<Uint8Array> {
  if (theirPub.length !== 32) throw new RoomKeyError("bad public key");
  let shared: Uint8Array;
  try {
    shared = x25519.getSharedSecret(mine.priv, theirPub);
  } catch {
    throw new RoomKeyError("bad public key");
  }
  if (shared.every((b) => b === 0)) throw new RoomKeyError("bad public key");
  const salt = new Uint8Array(64);
  salt.set(joinerPub, 0);
  salt.set(granterPub, 32);
  return hkdf(shared, salt, GRANT_INFO, 32);
}

/** A member who holds K seals it for a joiner. */
export async function grant(roomKey: Uint8Array, roomCode: string, mine: KeyPair, joinerPubB64: string, nonce?: Uint8Array): Promise<string> {
  const joinerPub = fromB64u(joinerPubB64);
  const wrap = await wrapKeyFor(mine, joinerPub, joinerPub, mine.pub);
  return b64u(await seal(wrap, roomKey, roomCode, nonce));
}

/** The joiner opens a grant, and accepts K only if it matches the room's kid. */
export async function acceptGrant(roomCode: string, mine: KeyPair, granterPubB64: string, boxB64: string, expectedKid: string): Promise<Uint8Array> {
  const granterPub = fromB64u(granterPubB64);
  const wrap = await wrapKeyFor(mine, granterPub, mine.pub, granterPub);
  const roomKey = await open(wrap, fromB64u(boxB64), roomCode);
  if (roomKey.length !== 32 || (await keyId(roomKey)) !== expectedKid) {
    throw new RoomKeyError("key does not belong to this room");
  }
  return roomKey;
}

// ── keeping K across reloads ────────────────────────────────────────────────
//
// A reload would otherwise leave this member waiting for someone else to hand
// the key over again — and a host alone in the room would have nobody to ask.
// Stored per code with the room's expiry, and dropped on leave; a stored key
// whose kid no longer matches (the code was reused) is ignored.

const STORE_PREFIX = "bishare-room-key:";

export function rememberKey(code: string, roomKey: Uint8Array, kid: string, expiresAt: string): void {
  try {
    localStorage.setItem(STORE_PREFIX + code, JSON.stringify({ k: b64u(roomKey), kid, exp: expiresAt }));
  } catch {
    /* storage blocked — the key lives for this page only */
  }
}

export function recallKey(code: string, kid: string): Uint8Array | null {
  try {
    const now = new Date().toISOString();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k?.startsWith(STORE_PREFIX)) continue;
      const v = JSON.parse(localStorage.getItem(k) ?? "{}") as { exp?: string };
      if (!v.exp || v.exp < now) localStorage.removeItem(k);
    }
    const raw = localStorage.getItem(STORE_PREFIX + code);
    if (!raw) return null;
    const v = JSON.parse(raw) as { k?: string; kid?: string };
    return v.kid === kid && v.k ? fromB64u(v.k) : null;
  } catch {
    return null;
  }
}

export function forgetKey(code: string): void {
  try {
    localStorage.removeItem(STORE_PREFIX + code);
  } catch {
    /* noop */
  }
}
