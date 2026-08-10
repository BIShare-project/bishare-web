// Nearby WebRTC transfer (P2) — one file, peer-to-peer over a DTLS DataChannel.
// The sender initiates (offer + DataChannel); the receiver answers. Signaling
// (SDP/ICE) is relayed through NearbySignaling; file bytes go straight peer-to-
// peer and never touch our server. Receive is in-memory for P2 (streaming to
// disk for big files comes in P3).
//
// No glare handling needed: exactly one side initiates a given transfer, so the
// sender is always the offerer and the receiver always the answerer.
import type { NearbySignaling, IncomingSignal } from "./signaling";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];
const CHUNK_SIZE = 256 * 1024;
const BUFFER_HIGH = 8 * 1024 * 1024; // pause sending above 8 MB buffered
const BUFFER_LOW = 1 * 1024 * 1024;

interface FileMeta {
  name: string;
  size: number;
  mime: string;
}

// Minimal File System Access API shape (avoids depending on the lib typedef,
// which isn't in every TS lib target). Lets the receiver stream chunks straight
// to disk so multi-GB files never sit in memory.
interface FsWritable {
  write: (data: BufferSource) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => Promise<void>;
}
interface FsFileHandle {
  createWritable: () => Promise<FsWritable>;
}
type ShowSaveFilePicker = (opts?: { suggestedName?: string }) => Promise<FsFileHandle>;

export interface IncomingFile extends FileMeta {
  from: string;
  accept: () => void;
  decline: () => void;
  cancel: () => void;
  onProgress: (cb: (received: number) => void) => void;
  /** blob is null when the file streamed straight to disk (File System Access). */
  onDone: (cb: (blob: Blob | null) => void) => void;
}

interface Callbacks {
  /** An offer arrived from a peer — surface an accept/decline prompt. */
  onIncoming: (file: IncomingFile) => void;
  /** Sender-side progress for a transfer we started. */
  onSendProgress?: (peerId: string, sent: number, total: number) => void;
  onSendDone?: (peerId: string) => void;
  onError?: (peerId: string, err: string) => void;
}

interface Session {
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  role: "send" | "recv";
  file?: File; // sender
  meta?: FileMeta; // receiver
  received: number;
  chunks: ArrayBuffer[];
  writable?: FsWritable; // receiver: streaming straight to disk (FSA)
  writeChain?: Promise<void>; // serializes disk writes in arrival order
  progressCb?: (n: number) => void;
  doneCb?: (b: Blob | null) => void;
  sentComplete?: boolean; // sender: all bytes pushed to the channel
  notified?: boolean; // sender: onSendDone already fired (fire once)
}

// Tiny JSON control message the receiver sends back over the DataChannel once
// the file is fully received AND saved, so the sender's "sent" really means
// "delivered" rather than "handed to the transport".
const ACK_RECEIVED = "received";

export class NearbyRTC {
  private sessions = new Map<string, Session>(); // peerId → session

  constructor(
    private readonly sig: NearbySignaling,
    private readonly cb: Callbacks,
  ) {
    sig.on("signal", (m) => void this.onSignal(m));
  }

  /** Start sending a file to a peer (we are the offerer). */
  async sendFile(peerId: string, file: File): Promise<void> {
    try {
      const pc = this.newPc(peerId);
      const dc = pc.createDataChannel("file", { ordered: true });
      dc.binaryType = "arraybuffer";
      const session: Session = { pc, dc, role: "send", file, received: 0, chunks: [] };
      this.sessions.set(peerId, session);

      dc.onopen = () => void this.pump(peerId);
      dc.onerror = () => this.cb.onError?.(peerId, "channel error");
      // Delivery confirmation: the receiver acks once the file is saved. Fall
      // back to "channel closed after all bytes were sent" so a receiver that
      // closes without acking still resolves as delivered (never before).
      dc.onmessage = (ev) => {
        if (typeof ev.data === "string" && ev.data === ACK_RECEIVED) this.notifyDone(peerId);
      };
      dc.onclose = () => {
        if (this.sessions.get(peerId)?.sentComplete) this.notifyDone(peerId);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // Send the file metadata WITH the offer so the receiver can show the
      // accept prompt immediately — the DataChannel (and bytes) only open after
      // they accept and answer, so metadata can't travel over the channel first.
      this.sig.signal(peerId, "offer", {
        sdp: offer,
        meta: { name: file.name, size: file.size, mime: file.type },
      });
    } catch (e) {
      this.cb.onError?.(peerId, e instanceof Error ? e.message : "send failed");
    }
  }

  private newPc(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) this.sig.signal(peerId, "ice", e.candidate.toJSON());
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") this.cb.onError?.(peerId, "connection failed");
    };
    return pc;
  }

  private async onSignal(m: IncomingSignal): Promise<void> {
    const { from, kind, payload } = m;
    if (kind === "offer") {
      // Incoming transfer — the offer carries the file metadata, so we can show
      // the accept prompt right away; we only answer (opening the channel) once
      // the user accepts.
      const { sdp, meta } = payload as { sdp: RTCSessionDescriptionInit; meta: FileMeta };
      const pc = this.newPc(from);
      const session: Session = { pc, role: "recv", meta, received: 0, chunks: [] };
      this.sessions.set(from, session);
      pc.ondatachannel = (e) => {
        const dc = e.channel;
        dc.binaryType = "arraybuffer";
        session.dc = dc;
        dc.onmessage = (ev) => this.onData(from, ev.data);
      };
      await pc.setRemoteDescription(sdp);

      this.cb.onIncoming({
        name: meta.name,
        size: meta.size,
        mime: meta.mime,
        from,
        accept: () => void this.accept(from),
        decline: () => this.cancel(from),
        cancel: () => this.cancel(from),
        onProgress: (cb) => { session.progressCb = cb; },
        onDone: (cb) => { session.doneCb = cb; },
      });
    } else if (kind === "answer") {
      const s = this.sessions.get(from);
      if (s) await s.pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
    } else if (kind === "ice") {
      const s = this.sessions.get(from);
      if (s) await s.pc.addIceCandidate(payload as RTCIceCandidateInit).catch(() => {});
    } else if (kind === "cancel") {
      if (this.sessions.has(from)) {
        this.teardown(from);
        this.cb.onError?.(from, "canceled by peer");
      }
    }
  }

  private async accept(peerId: string): Promise<void> {
    const s = this.sessions.get(peerId);
    if (!s || !s.meta) return;
    // Stream to disk when supported (Chromium) so multi-GB files never sit in
    // memory. showSaveFilePicker MUST run in the Accept click's user gesture —
    // it's called before the first await below. Fallback: in-memory Blob.
    const picker = (globalThis as unknown as { showSaveFilePicker?: ShowSaveFilePicker })
      .showSaveFilePicker;
    if (picker) {
      try {
        const handle = await picker({ suggestedName: s.meta.name });
        s.writable = await handle.createWritable();
      } catch {
        this.cancel(peerId); // user dismissed the save dialog → abort
        return;
      }
    }
    const answer = await s.pc.createAnswer();
    await s.pc.setLocalDescription(answer);
    this.sig.signal(peerId, "answer", answer);
  }

  /** Cancel/decline a transfer both sides (tells the peer, tears down). */
  cancel(peerId: string): void {
    this.sig.signal(peerId, "cancel", {});
    this.teardown(peerId);
  }

  // ── Sender: stream the file in chunks with backpressure ──
  private async pump(peerId: string): Promise<void> {
    const s = this.sessions.get(peerId);
    if (!s?.dc || !s.file) return;
    const { dc, file } = s;
    // Metadata already went with the offer — stream bytes only.
    let offset = 0;
    while (offset < file.size) {
      if (!this.sessions.has(peerId)) return; // cancelled mid-send
      if (dc.bufferedAmount > BUFFER_HIGH) {
        await new Promise<void>((res) => {
          dc.bufferedAmountLowThreshold = BUFFER_LOW;
          dc.onbufferedamountlow = () => res();
        });
      }
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buf = await slice.arrayBuffer();
      dc.send(buf);
      offset += buf.byteLength;
      this.cb.onSendProgress?.(peerId, offset, file.size);
    }
    // All bytes handed to the channel — but the transfer isn't "done" until the
    // receiver acks (or the channel closes cleanly). onSendDone fires there.
    s.sentComplete = true;
  }

  /** Fire onSendDone exactly once, on real delivery confirmation. */
  private notifyDone(peerId: string): void {
    const s = this.sessions.get(peerId);
    if (!s || s.notified) return;
    s.notified = true;
    this.cb.onSendDone?.(peerId);
    this.teardown(peerId);
  }

  // ── Receiver: binary chunks (metadata already arrived with the offer) ──
  private onData(peerId: string, data: unknown): void {
    const s = this.sessions.get(peerId);
    if (!s || typeof data === "string") return;
    const buf = data as ArrayBuffer;
    s.received += buf.byteLength;
    if (s.writable) {
      // Serialize disk writes in arrival order (don't await in the message
      // handler — chaining keeps them ordered without blocking).
      s.writeChain = (s.writeChain ?? Promise.resolve()).then(() => s.writable!.write(buf));
    } else {
      s.chunks.push(buf);
    }
    s.progressCb?.(s.received);
    if (s.meta && s.received >= s.meta.size) void this.finishReceive(peerId);
  }

  private async finishReceive(peerId: string): Promise<void> {
    const s = this.sessions.get(peerId);
    if (!s) return;
    if (s.writable) {
      try {
        await s.writeChain;
        await s.writable.close();
      } catch {
        /* write/close failed */
      }
      s.writable = undefined; // closed — keep teardown from aborting it
      s.doneCb?.(null); // already saved to disk
    } else {
      const blob = new Blob(s.chunks, { type: s.meta?.mime || "application/octet-stream" });
      s.doneCb?.(blob);
    }
    // Confirm delivery to the sender, then tear down after a beat so the ack
    // has time to flush over the channel.
    try {
      s.dc?.send(ACK_RECEIVED);
    } catch {
      /* channel already gone — sender falls back to close-after-complete */
    }
    setTimeout(() => this.teardown(peerId), 1500);
  }

  private teardown(peerId: string): void {
    const s = this.sessions.get(peerId);
    if (!s) return;
    try {
      s.dc?.close();
      s.pc.close();
    } catch {
      /* noop */
    }
    void s.writable?.abort?.().catch(() => {}); // discard a partial file
    this.sessions.delete(peerId);
  }

  closeAll(): void {
    for (const id of [...this.sessions.keys()]) this.teardown(id);
  }
}
