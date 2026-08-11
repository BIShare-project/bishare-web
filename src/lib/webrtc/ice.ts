// Shared ICE-server source for every WebRTC path (nearby tab, local rooms).
//
// The API mints short-lived Cloudflare TURN credentials at
// GET /api/v1/webrtc/ice (see bishare-api modules/webrtc). TURN matters even on
// the same Wi-Fi: browsers mask host candidates behind mDNS names and many
// routers refuse NAT hairpinning, so direct pairs often never connect. The
// credentials are cached here until shortly before their TTL and every failure
// degrades to STUN-only — the pre-TURN behaviour, never an error.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";

/** Direct-only fallback when the mint fails — keeps today's behaviour. */
const STUN_FALLBACK: RTCIceServer[] = [
  { urls: "stun:stun.cloudflare.com:3478" },
];

/** Refresh this long before the credential TTL actually expires. */
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

let cached: { servers: RTCIceServer[]; expiresAt: number } | null = null;
let inflight: Promise<RTCIceServer[]> | null = null;

async function fetchIceServers(): Promise<RTCIceServer[]> {
  const res = await fetch(`${API_URL}/api/v1/webrtc/ice`, { cache: "no-store" });
  const body = (await res.json()) as {
    success?: boolean;
    data?: { iceServers?: RTCIceServer[]; ttl?: number };
  };
  const servers = body.data?.iceServers;
  if (!res.ok || !body.success || !servers?.length) {
    throw new Error("no ice servers");
  }
  const ttlMs = (body.data?.ttl ?? 3600) * 1000;
  cached = { servers, expiresAt: Date.now() + ttlMs - EXPIRY_MARGIN_MS };
  return servers;
}

/**
 * Resolve the ICE server list — cached TURN credentials when available,
 * STUN-only otherwise. Never rejects.
 */
export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached && Date.now() < cached.expiresAt) return cached.servers;
  inflight ??= fetchIceServers().finally(() => {
    inflight = null;
  });
  try {
    return await inflight;
  } catch {
    return cached?.servers ?? STUN_FALLBACK;
  }
}

/** Fire-and-forget prefetch — call when a WebRTC surface mounts/connects so
 *  the first RTCPeerConnection is created with TURN already in hand. */
export function warmIceServers(): void {
  void getIceServers();
}

export { STUN_FALLBACK };
