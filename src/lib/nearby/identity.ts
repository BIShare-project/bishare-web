// A stable, anonymous identity for the Nearby tab. The old behaviour minted a
// fresh random name on every panel mount, so collapsing/expanding Nearby (or
// revisiting the page) made this browser reappear under a different name on
// every other device. Now:
//   - alias + emoji live in localStorage → the browser keeps ONE recognisable
//     name across visits (mirrors the Rooms identity pattern);
//   - peerId lives in sessionStorage → stable across remounts and reloads
//     within a tab, but unique per tab so two open tabs never collide in the
//     signaling room.
// No account, no PII — just a per-browser handle.

import type { NearbyPeer } from "./signaling";

const ALIAS_KEY = "bishare.nearby.alias";
const EMOJI_KEY = "bishare.nearby.emoji";
const PEER_KEY = "bishare.nearby.peerId";

const EMOJIS = ["🦊", "🐼", "🐧", "🦉", "🐙", "🦜", "🐳", "🦄", "🐝", "🦩"];
const ADJ = ["Swift", "Calm", "Bright", "Bold", "Cosmic", "Quiet", "Lucky", "Solar"];
const NOUN = ["Fox", "Panda", "Owl", "Whale", "Falcon", "Comet", "Otter", "Lark"];

const pick = (list: string[]) =>
  list[Math.floor(Math.random() * list.length)] ?? list[0]!;

/** The persisted self for Nearby; null during SSR. */
export function getNearbySelf(): NearbyPeer | null {
  if (typeof window === "undefined") return null;
  try {
    let alias = localStorage.getItem(ALIAS_KEY);
    let emoji = localStorage.getItem(EMOJI_KEY);
    if (!alias || !emoji) {
      alias = `${pick(ADJ)} ${pick(NOUN)}`;
      emoji = pick(EMOJIS);
      localStorage.setItem(ALIAS_KEY, alias);
      localStorage.setItem(EMOJI_KEY, emoji);
    }
    let peerId = sessionStorage.getItem(PEER_KEY);
    if (!peerId) {
      peerId = Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(PEER_KEY, peerId);
    }
    return { peerId, alias, emoji };
  } catch {
    // Storage blocked (private mode) — fall back to a per-mount identity.
    return {
      peerId: Math.random().toString(36).slice(2, 8),
      alias: `${pick(ADJ)} ${pick(NOUN)}`,
      emoji: pick(EMOJIS),
    };
  }
}
