// Nearby signaling client — thin wrapper over the /api/v1/nearby/ws WebSocket.
// Announces this browser (hello), tracks the peer roster, and relays WebRTC
// SDP/ICE to a specific peer. Transport only — no WebRTC here (that's the next
// phase). Reused by the debug page (P1) and the Nearby UI (P4).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";

export interface NearbyPeer {
  peerId: string;
  alias: string;
  emoji: string;
  /** "app" (native BIShare app bridged into the room) or "browser"; may be
   *  absent on peers that predate the field. Apps use it to hide fellow apps
   *  from their roster — browsers show every peer. */
  kind?: string;
}

export interface IncomingSignal {
  from: string;
  kind: string;
  payload: unknown;
}

interface Handlers {
  open: () => void;
  close: () => void;
  peers: (peers: NearbyPeer[]) => void;
  peerJoined: (peer: NearbyPeer) => void;
  peerLeft: (peerId: string) => void;
  signal: (msg: IncomingSignal) => void;
}

// Signals raised while the socket is down wait here for the next open. Bounded
// on both axes: a reconnect that takes longer than this has outlived whatever
// handshake the frames belonged to.
const OUTBOX_MAX = 64;
const OUTBOX_TTL_MS = 30_000;
const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;
// A handshake that has not completed by now is not going to: a socket opened
// while the page is hidden can hang in CONNECTING long after the network is back.
const CONNECT_TIMEOUT_MS = 10_000;
const STALE_CONNECT_MS = 3_000;
// Liveness probe. NearbyDO answers these from the runtime itself
// (setWebSocketAutoResponse), so the strings must match it byte for byte and a
// ping never wakes — never bills — the Durable Object.
const PING_FRAME = '{"type":"ping"}';
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;

/**
 * Reconnects on every unexpected drop, under the same identity, so the peer
 * comes back as the same device. It has to: a phone's browser loses this
 * socket within seconds of the page going hidden (any system dialog does it —
 * a file picker, the share sheet), and a client that stayed down vanished from
 * every other device's list for good while its own UI still read "online".
 *
 * A drop is not always announced, either: a router restart, a carrier dropping
 * an idle connection or a laptop waking from sleep can leave a socket OPEN on
 * this side and dead on the wire. The ping below is what turns that into a
 * close event, and from there into a reconnect.
 */
export class NearbySignaling {
  private ws?: WebSocket;
  private readonly handlers: Partial<Handlers> = {};
  private stopped = false;
  private listening = false;
  private failures = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private connectStartedAt = 0;
  /** Tears down the current socket and schedules the reconnect (see connect). */
  private giveUp: (() => void) | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private outbox: { frame: string; at: number }[] = [];

  constructor(
    private readonly self: NearbyPeer,
    private readonly code?: string,
  ) {}

  on<K extends keyof Handlers>(event: K, handler: Handlers[K]): this {
    this.handlers[event] = handler;
    return this;
  }

  connect(): void {
    if (this.stopped) return;
    // Idempotent: the retry timer and the wake listener can both get here.
    const state = this.ws?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
    if (!this.listening) {
      this.listening = true;
      document.addEventListener("visibilitychange", this.wake);
      window.addEventListener("online", this.wake);
    }
    // The API is a SEPARATE worker/origin (api.bishare.app) since the api/web
    // split — bishare.app no longer routes /api/v1/*, so signaling must go
    // cross-origin to the API host. A browser cross-origin WebSocket is fine
    // here (no CORS preflight for the WS handshake; NearbyDO accepts it). Using
    // window.location.origin would hit the web worker, which 404s the upgrade.
    const base = API_URL.replace(/^http/, "ws");
    const url = `${base}/api/v1/nearby/ws${
      this.code ? `?code=${encodeURIComponent(this.code)}` : ""
    }`;
    const ws = new WebSocket(url);
    this.ws = ws;
    this.connectStartedAt = Date.now();
    let opened = false;
    const giveUp = setTimeout(() => ws.close(), CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      opened = true;
      clearTimeout(giveUp);
      this.failures = 0;
      ws.send(JSON.stringify({ type: "hello", ...this.self }));
      const fresh = Date.now() - OUTBOX_TTL_MS;
      for (const { frame, at } of this.outbox.splice(0)) {
        if (at >= fresh) ws.send(frame);
      }
      this.startPinging(ws);
      this.handlers.open?.();
    };
    const drop = () => {
      clearTimeout(giveUp);
      if (this.ws !== ws) return; // a newer socket already took over
      this.stopPinging();
      this.ws = undefined;
      if (this.stopped) return;
      this.handlers.close?.();
      if (!opened) this.failures++;
      const delay = Math.min(RETRY_BASE_MS * 2 ** this.failures, RETRY_MAX_MS);
      this.retryTimer = setTimeout(() => this.connect(), delay);
    };
    this.giveUp = drop;
    ws.onclose = drop;
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      // Any frame proves the socket is alive, not just the pong.
      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
        this.pongTimer = null;
      }
      if (typeof e.data !== "string") return;
      let m: Record<string, unknown>;
      try {
        m = JSON.parse(e.data) as Record<string, unknown>;
      } catch {
        return;
      }
      const str = (v: unknown) => (typeof v === "string" ? v : "");
      switch (m.type) {
        case "peers":
          this.handlers.peers?.(Array.isArray(m.peers) ? (m.peers as NearbyPeer[]) : []);
          break;
        case "peer_joined":
          this.handlers.peerJoined?.({
            peerId: str(m.peerId),
            alias: str(m.alias),
            emoji: str(m.emoji),
            kind: str(m.kind),
          });
          break;
        case "peer_left":
          this.handlers.peerLeft?.(str(m.peerId));
          break;
        case "signal":
          this.handlers.signal?.({
            from: str(m.from),
            kind: str(m.kind),
            payload: m.payload,
          });
          break;
        default:
        // ignore
      }
    };
  }

  /**
   * Ask the server to say something, on a timer, and give up on a socket that
   * does not answer. Without this a half-open connection stays OPEN here for
   * as long as the tab does: no close event, so nothing reconnects, and this
   * device sits in everyone's list answering nothing.
   */
  private startPinging(ws: WebSocket): void {
    this.stopPinging();
    this.pingTimer = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(PING_FRAME);
      if (this.pongTimer) return; // already waiting on an earlier probe
      this.pongTimer = setTimeout(() => {
        this.pongTimer = null;
        // Abandon it without waiting for a close event. close() only starts a
        // closing handshake, and the peer that just failed to answer a ping
        // will not finish one either: the socket sits in CLOSING, "close"
        // arrives minutes later or never, and nothing would reconnect.
        const dead = this.giveUp;
        this.giveUp = null;
        dead?.();
        try {
          ws.close();
        } catch {
          /* already closing */
        }
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }

  private stopPinging(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pingTimer = null;
    this.pongTimer = null;
  }

  /**
   * Back in view, or back on a network: rejoin now instead of sitting out the
   * backoff. Timers are throttled while a page is hidden, so this is what
   * actually brings a phone back the moment its user returns.
   */
  private readonly wake = (): void => {
    if (this.stopped || document.visibilityState !== "visible") return;
    // A retry that started while hidden may be hung in CONNECTING; don't wait
    // out its timeout now that the user is looking — drop it and dial again.
    const hung = this.ws;
    if (
      hung?.readyState === WebSocket.CONNECTING &&
      Date.now() - this.connectStartedAt > STALE_CONNECT_MS
    ) {
      this.ws = undefined;
      hung.close();
    }
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.failures = 0;
    this.connect();
  };

  /** Relay an SDP offer/answer or ICE candidate to a specific peer. */
  signal(to: string, kind: string, payload: unknown): void {
    const frame = JSON.stringify({ type: "signal", to, kind, payload });
    // send() on a closed socket discards the frame without a word, which is
    // how a handshake used to die silently — hold it for the reconnect.
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(frame);
    else if (this.outbox.length < OUTBOX_MAX) this.outbox.push({ frame, at: Date.now() });
  }

  /** Leave for good (no reconnect). */
  close(): void {
    this.stopped = true;
    this.stopPinging();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    if (this.listening) {
      document.removeEventListener("visibilitychange", this.wake);
      window.removeEventListener("online", this.wake);
      this.listening = false;
    }
    try {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: "bye" }));
    } catch {
      /* already closing */
    }
    this.ws?.close();
  }
}
