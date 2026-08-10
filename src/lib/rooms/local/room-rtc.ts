// Local (WebRTC) room transport — file bytes fly straight browser-to-browser
// over DTLS DataChannels; only SDP/ICE signaling is relayed (via NearbySignaling
// / NearbyDO). Same-network peers connect LAN-direct through STUN, so it's the
// browser's answer to the app's local rooms.
//
// Unlike NearbyRTC (1-file, accept-prompt, save-picker — needs a user gesture),
// a room auto-receives every shared file to memory and shows a download button,
// and a share broadcasts to ALL current peers. Each transfer carries a unique
// `sid` so concurrent transfers to/from the same peer never collide on the
// single peer-keyed signaling channel.
import type { NearbySignaling, IncomingSignal } from "@/lib/nearby/signaling";

// STUN for direct/same-network paths; TURN as a relay fallback so transfers
// still connect when the network blocks peer-to-peer (client isolation, strict
// NAT). Direct paths are always preferred — TURN is only used as a last resort.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];
const CHUNK_SIZE = 256 * 1024;
const BUFFER_HIGH = 8 * 1024 * 1024;
const BUFFER_LOW = 1 * 1024 * 1024;

interface FileMeta {
  name: string;
  size: number;
  mime: string;
}

export interface ReceivedRoomFile extends FileMeta {
  id: string;
  from: string; // peerId
  fromAlias: string;
  blob: Blob;
}

interface Callbacks {
  onReceiveStart?: (sid: string, from: string, meta: FileMeta) => void;
  onReceiveProgress?: (sid: string, received: number, total: number) => void;
  onReceived?: (file: ReceivedRoomFile) => void;
  onSendProgress?: (sid: string, peerId: string, sent: number, total: number) => void;
  onSendDone?: (sid: string, peerId: string) => void;
  onError?: (peerId: string, err: string) => void;
}

interface Session {
  sid: string;
  peerId: string;
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  role: "send" | "recv";
  file?: File;
  meta?: FileMeta;
  fromAlias?: string;
  received: number;
  chunks: ArrayBuffer[];
  remoteReady: boolean;
  pendingIce: RTCIceCandidateInit[];
}

let sidCounter = 0;
function newSid(): string {
  sidCounter += 1;
  return `${Date.now().toString(36)}-${sidCounter}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export class RoomRTC {
  private sessions = new Map<string, Session>(); // sid → session

  constructor(
    private readonly sig: NearbySignaling,
    private readonly cb: Callbacks,
    private readonly aliasOf: (peerId: string) => string,
  ) {
    sig.on("signal", (m) => void this.onSignal(m));
  }

  /** Broadcast a file to every peer currently in the room. */
  async broadcast(file: File, peerIds: string[]): Promise<void> {
    await Promise.all(peerIds.map((id) => this.sendTo(id, file).catch(() => {})));
  }

  /** Send a file to one peer (we offer). */
  private async sendTo(peerId: string, file: File): Promise<void> {
    const sid = newSid();
    try {
      const pc = this.newPc(sid, peerId);
      const dc = pc.createDataChannel("file", { ordered: true });
      dc.binaryType = "arraybuffer";
      const s: Session = {
        sid,
        peerId,
        pc,
        dc,
        role: "send",
        file,
        received: 0,
        chunks: [],
        remoteReady: false,
        pendingIce: [],
      };
      this.sessions.set(sid, s);
      dc.onopen = () => void this.pump(sid);
      dc.onerror = () => this.cb.onError?.(peerId, "channel error");
      dc.onclose = () => this.teardown(sid);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sig.signal(peerId, "roffer", {
        sid,
        sdp: offer,
        meta: { name: file.name, size: file.size, mime: file.type },
      });
    } catch (e) {
      this.teardown(sid);
      this.cb.onError?.(peerId, e instanceof Error ? e.message : "send failed");
    }
  }

  private newPc(sid: string, peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) this.sig.signal(peerId, "rice", { sid, candidate: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        this.cb.onError?.(peerId, "connection failed");
        this.teardown(sid);
      }
    };
    return pc;
  }

  private async onSignal(m: IncomingSignal): Promise<void> {
    const { from, kind, payload } = m;
    const p = payload as { sid?: string; sdp?: RTCSessionDescriptionInit; meta?: FileMeta; candidate?: RTCIceCandidateInit };
    const sid = p.sid;
    if (!sid) return; // not a room-rtc signal (nearby uses no sid)

    if (kind === "roffer") {
      // Incoming file — auto-accept: create the answer immediately, receive to
      // memory. No prompt, no save-picker (which would need a user gesture).
      const pc = this.newPc(sid, from);
      const s: Session = {
        sid,
        peerId: from,
        pc,
        role: "recv",
        meta: p.meta,
        fromAlias: this.aliasOf(from),
        received: 0,
        chunks: [],
        remoteReady: false,
        pendingIce: [],
      };
      this.sessions.set(sid, s);
      pc.ondatachannel = (e) => {
        const dc = e.channel;
        dc.binaryType = "arraybuffer";
        s.dc = dc;
        dc.onmessage = (ev) => this.onData(sid, ev.data);
      };
      await pc.setRemoteDescription(p.sdp!);
      s.remoteReady = true;
      await this.flushIce(sid);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sig.signal(from, "ranswer", { sid, sdp: answer });
      if (s.meta) this.cb.onReceiveStart?.(sid, from, s.meta);
    } else if (kind === "ranswer") {
      const s = this.sessions.get(sid);
      if (s) {
        await s.pc.setRemoteDescription(p.sdp!);
        s.remoteReady = true;
        await this.flushIce(sid);
      }
    } else if (kind === "rice") {
      const s = this.sessions.get(sid);
      if (!s || !p.candidate) return;
      if (s.remoteReady) await s.pc.addIceCandidate(p.candidate).catch(() => {});
      else s.pendingIce.push(p.candidate); // buffer until remote desc is set
    }
  }

  private async flushIce(sid: string): Promise<void> {
    const s = this.sessions.get(sid);
    if (!s) return;
    for (const c of s.pendingIce.splice(0)) await s.pc.addIceCandidate(c).catch(() => {});
  }

  // ── sender: stream chunks with backpressure ──
  private async pump(sid: string): Promise<void> {
    const s = this.sessions.get(sid);
    if (!s?.dc || !s.file) return;
    const { dc, file } = s;
    let offset = 0;
    while (offset < file.size) {
      if (!this.sessions.has(sid)) return;
      if (dc.bufferedAmount > BUFFER_HIGH) {
        await new Promise<void>((res) => {
          dc.bufferedAmountLowThreshold = BUFFER_LOW;
          dc.onbufferedamountlow = () => res();
        });
      }
      const buf = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
      dc.send(buf);
      offset += buf.byteLength;
      this.cb.onSendProgress?.(sid, s.peerId, offset, file.size);
    }
    this.cb.onSendDone?.(sid, s.peerId);
    // Give the buffer a moment to flush, then close (receiver already has size).
    setTimeout(() => this.teardown(sid), 2000);
  }

  // ── receiver: binary chunks (metadata came with the offer) ──
  private onData(sid: string, data: unknown): void {
    const s = this.sessions.get(sid);
    if (!s || typeof data === "string") return;
    const buf = data as ArrayBuffer;
    s.received += buf.byteLength;
    s.chunks.push(buf);
    this.cb.onReceiveProgress?.(sid, s.received, s.meta?.size ?? 0);
    if (s.meta && s.received >= s.meta.size) this.finishReceive(sid);
  }

  private finishReceive(sid: string): void {
    const s = this.sessions.get(sid);
    if (!s || !s.meta) return;
    const blob = new Blob(s.chunks, { type: s.meta.mime || "application/octet-stream" });
    this.cb.onReceived?.({
      id: sid,
      name: s.meta.name,
      size: s.meta.size,
      mime: s.meta.mime,
      from: s.peerId,
      fromAlias: s.fromAlias ?? this.aliasOf(s.peerId),
      blob,
    });
    setTimeout(() => this.teardown(sid), 500);
  }

  private teardown(sid: string): void {
    const s = this.sessions.get(sid);
    if (!s) return;
    try {
      s.dc?.close();
      s.pc.close();
    } catch {
      /* noop */
    }
    this.sessions.delete(sid);
  }

  closeAll(): void {
    for (const sid of [...this.sessions.keys()]) this.teardown(sid);
  }
}
