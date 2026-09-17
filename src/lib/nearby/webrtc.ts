// Nearby WebRTC transfer (P2) — one file, peer-to-peer over a DTLS DataChannel.
// The sender initiates (offer + DataChannel); the receiver answers. Signaling
// (SDP/ICE) is relayed through NearbySignaling; file bytes go straight peer-to-
// peer and never touch our server. The receiver stages bytes on disk where it
// can (lib/nearby/stage) and in memory elsewhere; saving comes after the
// transfer, never before it.
//
// No glare handling needed: exactly one side initiates a given transfer, so the
// sender is always the offerer and the receiver always the answerer.
import type { NearbySignaling, IncomingSignal } from "./signaling";
import { getIceServers, STUN_FALLBACK } from "@/lib/webrtc/ice";
import { openStage, type Stage } from "./stage";
const CHUNK_SIZE = 256 * 1024;
const BUFFER_HIGH = 8 * 1024 * 1024; // pause sending above 8 MB buffered
const BUFFER_LOW = 1 * 1024 * 1024;

interface FileMeta {
  name: string;
  size: number;
  mime: string;
}

/** A fully received file, handed to the UI to save. */
export interface ReceivedFile {
  blob: Blob;
  /**
   * Set when the bytes are staged in browser storage rather than held in
   * memory. The caller owns them from here and MUST call this once the file is
   * saved or dropped, or the staged copy lingers until the stale sweep.
   */
  release?: () => Promise<void>;
}

export interface IncomingFile extends FileMeta {
  from: string;
  accept: () => void;
  decline: () => void;
  cancel: () => void;
  onProgress: (cb: (received: number) => void) => void;
  onDone: (cb: (file: ReceivedFile) => void) => void;
}

interface Callbacks {
  /** An offer arrived from a peer — surface an accept/decline prompt. */
  onIncoming: (file: IncomingFile) => void;
  /** Sender-side progress for a transfer we started. */
  onSendProgress?: (peerId: string, sent: number, total: number) => void;
  /** `bytes` is the delivered file's size — the caller reports it as
   *  anonymous aggregate telemetry, so it has to travel with the event. */
  onSendDone?: (peerId: string, bytes: number) => void;
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
  stage?: Stage; // receiver: bytes staged on disk instead of in `chunks`
  writeChain?: Promise<void>; // serializes disk writes in arrival order
  failed?: boolean; // receiver: a staged write failed; the transfer is void
  progressCb?: (n: number) => void;
  doneCb?: (f: ReceivedFile) => void;
  sentComplete?: boolean; // sender: all bytes pushed to the channel
  notified?: boolean; // sender: onSendDone already fired (fire once)
}

// Tiny JSON control message the receiver sends back over the DataChannel once
// every byte has arrived and is safely held (staged on disk, or in memory), so
// the sender's "sent" really means "delivered" rather than "handed to the
// transport". It does not wait for the user to pick a save location: that can
// take minutes, and on a phone the dialog itself suspends the connection.
const ACK_RECEIVED = "received";

export class NearbyRTC {
  private sessions = new Map<string, Session>(); // peerId → session

  // STUN until the TURN mint resolves (prefetched below) — peers created after
  // that get the relay fallback for networks that block direct paths.
  private ice: RTCIceServer[] = STUN_FALLBACK;

  constructor(
    private readonly sig: NearbySignaling,
    private readonly cb: Callbacks,
  ) {
    sig.on("signal", (m) => void this.onSignal(m));
    void getIceServers().then((s) => (this.ice = s));
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
      // A channel error after all bytes were sent is the receiver's normal
      // teardown, not a failure — don't surface it.
      dc.onerror = () => {
        if (!this.sessions.get(peerId)?.sentComplete) this.cb.onError?.(peerId, "channel error");
      };
      // Delivery confirmation: the receiver acks once it holds every byte. Fall
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
    const pc = new RTCPeerConnection({ iceServers: this.ice });
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
    // Stage on disk when supported so multi-GB files never sit in memory;
    // fallback: in-memory Blob. No save dialog here — this used to call
    // showSaveFilePicker first, and on Android that opens the system file
    // manager: the page went hidden, the signaling socket died within seconds,
    // and the answer below was never delivered. The receiver sat at 0% forever
    // and vanished from the sender's device list.
    const stage = await openStage();
    if (this.sessions.get(peerId) !== s) {
      void stage?.discard(); // canceled while the stage was opening
      return;
    }
    s.stage = stage ?? undefined;
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
    const bytes = s.file?.size ?? 0;
    // Tear down BEFORE the callback, not after. Sessions are keyed by peer,
    // and the callback drains the send queue — it starts the next file to the
    // SAME peer, which registers a new session under this very key. Tearing
    // down afterwards closed the connection that call had just opened, so a
    // multi-file send always died on file two.
    this.teardown(peerId);
    this.cb.onSendDone?.(peerId, bytes);
  }

  // ── Receiver: binary chunks (metadata already arrived with the offer) ──
  private onData(peerId: string, data: unknown): void {
    const s = this.sessions.get(peerId);
    if (!s || typeof data === "string") return;
    const buf = data as ArrayBuffer;
    s.received += buf.byteLength;
    if (s.stage) {
      // Serialize disk writes in arrival order (don't await in the message
      // handler — chaining keeps them ordered without blocking).
      const stage = s.stage;
      s.writeChain = (s.writeChain ?? Promise.resolve())
        .then(() => stage.write(buf))
        .catch(() => this.failReceive(peerId, s));
    } else {
      s.chunks.push(buf);
    }
    s.progressCb?.(s.received);
    if (s.meta && s.received >= s.meta.size) void this.finishReceive(peerId);
  }

  private async finishReceive(peerId: string): Promise<void> {
    const s = this.sessions.get(peerId);
    if (!s) return;
    if (s.stage) {
      const stage = s.stage;
      await s.writeChain;
      if (s.failed) return;
      let file: File;
      try {
        file = await stage.finish();
      } catch {
        this.failReceive(peerId, s);
        return;
      }
      s.stage = undefined; // handed over — keep teardown from discarding it
      s.doneCb?.({ blob: file, release: () => stage.discard() });
    } else {
      const blob = new Blob(s.chunks, { type: s.meta?.mime || "application/octet-stream" });
      s.doneCb?.({ blob });
    }
    // Confirm delivery to the sender, then tear down after a beat so the ack
    // has time to flush over the channel.
    try {
      s.dc?.send(ACK_RECEIVED);
    } catch {
      /* channel already gone — sender falls back to close-after-complete */
    }
    // Tear down after a beat so the ack has time to flush — but only if this
    // is still the SAME session. The sender starts the next queued file the
    // moment it sees the ack, which registers a new session under this peer's
    // key well inside the delay; a blind teardown would kill it and every
    // multi-file send would stall on file two.
    setTimeout(() => {
      if (this.sessions.get(peerId) === s) this.teardown(peerId);
    }, 1500);
  }

  /** A staged write failed (disk full, storage revoked): void the transfer on
   *  both sides rather than ack a file that was never fully kept. */
  private failReceive(peerId: string, s: Session): void {
    if (s.failed || this.sessions.get(peerId) !== s) return;
    s.failed = true;
    this.cancel(peerId);
    this.cb.onError?.(peerId, "could not store the file");
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
    void s.stage?.discard(); // discard a partial file
    this.sessions.delete(peerId);
  }

  closeAll(): void {
    for (const id of [...this.sessions.keys()]) this.teardown(id);
  }
}
