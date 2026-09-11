// Browser Rooms client — talks to the frozen room API on api.bishare.app:
//   REST  POST /api/v1/rooms                 create
//         POST /api/v1/rooms/:code/files     upload (raw body + X-* headers)
//         GET  /api/v1/rooms/:code/files/:id  download (server-proxied stream)
//         DELETE /api/v1/rooms/:code          host closes (X-Host-Token)
//   WS    GET /api/v1/rooms/:code/ws          join + live events
//
// The WS is the join channel: connect, send {type:"join",data:{fingerprint,
// alias,deviceType}}, then the server replies "sync" (full state) and streams
// member_joined / member_left / file_added / upload_start / upload_done /
// room_closed / error. See server/do/room.ts for the wire contract.
import type { RoomCreated, RoomE2E, RoomEvent, RoomFile } from "./types";
import { DEVICE_TYPE } from "./identity";
import { EncryptedSource, decryptTransform, importKey } from "@/lib/e2e/crypto";
import type { SealedFile } from "./e2e";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://api.bishare.app";
const WS_URL = API_URL.replace(/^http/, "ws");

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } };
    return body.error?.message || body.error?.code || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Create a room. Returns its code + host token (needed to close it). `e2e`
 *  registers the key id of a room key this device just made (see ./e2e.ts). */
export async function createRoom(fingerprint: string, alias: string, e2e?: RoomE2E): Promise<RoomCreated> {
  const res = await fetch(`${API_URL}/api/v1/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fingerprint, alias, ...(e2e ? { e2e } : {}) }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { data: RoomCreated };
  return body.data;
}

/** Host closes the room for everyone. */
export async function closeRoom(code: string, hostToken: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/rooms/${code}`, {
    method: "DELETE",
    headers: { "X-Host-Token": hostToken },
  });
  if (!res.ok) throw new Error(await readError(res));
}

/** Download a shared file (server-proxied stream) and save it via the browser.
 *  An end-to-end encrypted file is opened on the way in with its BSE2 key and
 *  saved under the name from its sealed metadata. */
export async function downloadRoomFile(
  code: string,
  file: RoomFile,
  sealed?: { fileKey: Uint8Array; name: string; type: string },
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/rooms/${code}/files/${file.id}`);
  if (!res.ok) throw new Error(await readError(res));
  const blob =
    sealed && res.body
      ? await new Response(res.body.pipeThrough(decryptTransform(sealed.fileKey))).blob()
      : await res.blob();
  const url = URL.createObjectURL(sealed ? new Blob([blob], { type: sealed.type }) : blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sealed ? sealed.name : file.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// What an encrypted upload calls itself on the wire; the real name is sealed.
const SEALED_NAME = "encrypted.bse2";
const SEAL_CHUNK = 8 * 1024 * 1024;

/** The whole BSE2 container for `file`, as a Blob the browser can page to disk. */
async function sealedBody(file: File, fileKey: Uint8Array): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(4));
  const src = new EncryptedSource(file, await importKey(fileKey), salt);
  const parts: Blob[] = [];
  for (let off = 0; off < src.size; off += SEAL_CHUNK) {
    parts.push(new Blob([await src.slice(off, Math.min(off + SEAL_CHUNK, src.size))]));
  }
  return new Blob(parts, { type: "application/octet-stream" });
}

/** Upload a file into the room (XHR for progress). Broadcasts file_added to all.
 *  With `sealed` (an end-to-end encrypted room) only the BSE2 container and
 *  the sealed metadata leave the browser — no name, type or preview. */
export async function uploadRoomFile(opts: {
  code: string;
  file: File;
  fingerprint: string;
  alias: string;
  thumbnail?: string;
  sealed?: SealedFile;
  onProgress?: (fraction: number) => void;
}): Promise<void> {
  const { code, file, fingerprint, alias, thumbnail, sealed, onProgress } = opts;
  const body: Blob = sealed ? await sealedBody(file, sealed.fileKey) : file;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/v1/rooms/${code}/files`);
    xhr.setRequestHeader("X-Owner-Fingerprint", fingerprint);
    xhr.setRequestHeader("X-Owner-Alias", encodeURIComponent(alias));
    if (sealed) {
      xhr.setRequestHeader("X-File-Name", SEALED_NAME);
      xhr.setRequestHeader("X-File-Type", "application/octet-stream");
      xhr.setRequestHeader("X-Enc-Salt", sealed.salt);
      xhr.setRequestHeader("X-Enc-Meta", sealed.meta);
    } else {
      xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
      xhr.setRequestHeader("X-File-Type", file.type || "application/octet-stream");
      if (thumbnail) xhr.setRequestHeader("X-Thumbnail", thumbnail);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let msg = `HTTP ${xhr.status}`;
        try {
          msg = JSON.parse(xhr.responseText)?.error?.message || msg;
        } catch {
          /* keep */
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(body);
  });
}

/**
 * Live room connection. `connect()` opens the WS, joins, and streams events to
 * the handler. Auto-reconnects on unexpected drops (keeps the same fingerprint,
 * so the seat is preserved) until `close()` is called.
 */
export class RoomConnection {
  private ws: WebSocket | null = null;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly code: string,
    private readonly fingerprint: string,
    private readonly alias: string,
    private readonly onEvent: (e: RoomEvent) => void,
    private readonly onStatus: (s: "connecting" | "open" | "closed") => void,
    /** X25519 public key (base64url) for the key hand-off; sent on every join
     *  so an encrypted room lets this client in (a plain room ignores it). */
    private readonly e2ePub?: string,
  ) {}

  connect(): void {
    if (this.stopped) return;
    this.onStatus("connecting");
    const ws = new WebSocket(`${WS_URL}/api/v1/rooms/${this.code}/ws`);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          data: {
            fingerprint: this.fingerprint,
            alias: this.alias,
            deviceType: DEVICE_TYPE,
            // need:false — whether a key is needed is decided after the sync,
            // once this client knows the room's kid, with an explicit key_request.
            ...(this.e2ePub ? { e2e: { v: 1, pub: this.e2ePub, need: false } } : {}),
          },
        }),
      );
      this.onStatus("open");
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      try {
        this.onEvent(JSON.parse(ev.data) as RoomEvent);
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => {
      this.ws = null;
      if (this.stopped) return;
      this.onStatus("closed");
      // Reconnect after a short backoff (server drops the socket on room close;
      // if the room is truly gone, the rejoin gets an "error" event and the UI
      // ends the session).
      this.reconnectTimer = setTimeout(() => this.connect(), 2500);
    };
    ws.onerror = () => ws.close();
  }

  /** Send a client → room message (key_request / key_grant). Dropped while
   *  the socket is down; the caller's retry covers it. */
  send(type: string, data?: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify({ type, data: data ?? {} }));
    } catch {
      /* closing */
    }
  }

  /** Politely leave, then tear down (no reconnect). */
  leave(): void {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try {
      this.ws?.send(JSON.stringify({ type: "leave" }));
    } catch {
      /* socket may already be gone */
    }
    this.close();
  }

  close(): void {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try {
      this.ws?.close(1000);
    } catch {
      /* already closed */
    }
    this.ws = null;
  }
}

/** Downscaled JPEG data (base64, no prefix) for an image file, or undefined. */
export async function makeThumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith("image/")) return undefined;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 96;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    const base64 = dataUrl.split(",")[1] ?? "";
    // Keep well under header size limits — skip if the thumbnail is too big.
    return base64.length > 0 && base64.length < 6000 ? base64 : undefined;
  } catch {
    return undefined;
  }
}
