// Opening the web Drive (VAULT-SPEC "Opening the Drive in a browser"): this
// browser makes its device key and a one-time hand-off key, opens a slot,
// shows the QR code, and waits for a device of the vault to approve it.
import { cancelWebSlot, DriveClient, openWebSlot, takeWebBox, type WebSlot } from "./client";
import { acceptGrant, b64u, deviceIdOf, devicePublicKey, fromB64u, generateDeviceSeed, newGrantKey, type GrantKey } from "./crypto";
import type { DriveSession } from "./session";

export interface Pairing extends WebSlot {
  seed: Uint8Array;
  hand: GrantKey;
  name: string;
  stay: boolean;
  /** What the QR code holds: BSVW1.<slot>.<hand-off key>.<device key>. */
  qr: string;
  /**
   * The approval's box, once taken: the slot gives it out only once, so a
   * failure after it (the network, the key check) is retried from here
   * rather than leaving an approved browser without its key.
   */
  taken?: { vaultId: string; box: string; granterPub: string };
}

export async function startPairing(name: string, stay: boolean): Promise<Pairing> {
  const seed = generateDeviceSeed();
  const hand = newGrantKey();
  const devicePub = b64u(devicePublicKey(seed));
  const boxPub = b64u(hand.public);
  const slot = await openWebSlot({ devicePub, boxPub, name, stay });
  return { ...slot, seed, hand, name, stay, qr: `BSVW1.${slot.slot}.${boxPub}.${devicePub}` };
}

/** One look at the slot: the session once a device approved, else null. */
export async function checkPairing(p: Pairing): Promise<DriveSession | null> {
  let got = p.taken;
  if (!got) {
    const box = await takeWebBox(p.seed, p.slot);
    if (!box.ready) return null;
    got = p.taken = { vaultId: box.vaultId, box: box.box, granterPub: box.granterPub };
  }
  // The browser is a device of the vault now: it asks for the key check itself.
  const info = await new DriveClient({ vaultId: got.vaultId, seed: p.seed }).info();
  if (!info.keyCheck) throw new Error("This Drive has no key yet");
  const vaultKey = await acceptGrant(got.vaultId, p.hand, fromB64u(got.granterPub), fromB64u(got.box), info.keyCheck);
  return {
    vaultId: got.vaultId,
    deviceId: await deviceIdOf(devicePublicKey(p.seed)),
    seed: p.seed,
    vaultKey,
    stay: p.stay,
    name: p.name,
    openedAt: Date.now(),
  };
}

/** "K7Q49MZD" as the page shows it. */
export function showCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)} · ${code.slice(4)}` : code;
}

/** Forget a code this browser no longer shows (best effort: it runs out by itself in five minutes). */
export async function cancelPairing(p: Pairing): Promise<void> {
  await cancelWebSlot(p.seed, p.slot);
}
