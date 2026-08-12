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
