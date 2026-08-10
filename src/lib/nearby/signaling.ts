// Nearby signaling client — thin wrapper over the /api/v1/nearby/ws WebSocket.
// Announces this browser (hello), tracks the peer roster, and relays WebRTC
// SDP/ICE to a specific peer. Transport only — no WebRTC here (that's the next
// phase). Reused by the debug page (P1) and the Nearby UI (P4).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";

export interface NearbyPeer {
  peerId: string;
  alias: string;
  emoji: string;
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

export class NearbySignaling {
  private ws?: WebSocket;
  private readonly handlers: Partial<Handlers> = {};

  constructor(
    private readonly self: NearbyPeer,
    private readonly code?: string,
  ) {}

  on<K extends keyof Handlers>(event: K, handler: Handlers[K]): this {
    this.handlers[event] = handler;
    return this;
  }

  connect(): void {
    // Same-origin: the worker routes any /api/v1/* path to the Hono API (see
    // isApiRequest), so bishare.app/api/v1/nearby/ws reaches the DO without a
    // cross-origin WebSocket. Falls back to the configured API host off-browser.
    const origin = typeof window !== "undefined" ? window.location.origin : API_URL;
    const base = origin.replace(/^http/, "ws");
    const url = `${base}/api/v1/nearby/ws${
      this.code ? `?code=${encodeURIComponent(this.code)}` : ""
    }`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "hello", ...this.self }));
      this.handlers.open?.();
    };
    ws.onclose = () => this.handlers.close?.();
    ws.onmessage = (e) => {
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

  /** Relay an SDP offer/answer or ICE candidate to a specific peer. */
  signal(to: string, kind: string, payload: unknown): void {
    this.ws?.send(JSON.stringify({ type: "signal", to, kind, payload }));
  }

  close(): void {
    try {
      this.ws?.send(JSON.stringify({ type: "bye" }));
    } catch {
      /* already closing */
    }
    this.ws?.close();
  }
}
