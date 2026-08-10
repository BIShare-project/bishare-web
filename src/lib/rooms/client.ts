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
import type { RoomCreated, RoomEvent, RoomFile } from "./types";
import { DEVICE_TYPE } from "./identity";

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

/** Create a room. Returns its code + host token (needed to close it). */
export async function createRoom(fingerprint: string, alias: string): Promise<RoomCreated> {
  const res = await fetch(`${API_URL}/api/v1/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fingerprint, alias }),
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

/** Download a shared file (server-proxied stream) and save it via the browser. */
export async function downloadRoomFile(code: string, file: RoomFile): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/rooms/${code}/files/${file.id}`);
  if (!res.ok) throw new Error(await readError(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Upload a file into the room (XHR for progress). Broadcasts file_added to all. */
export function uploadRoomFile(opts: {
  code: string;
  file: File;
  fingerprint: string;
  alias: string;
  thumbnail?: string;
  onProgress?: (fraction: number) => void;
}): Promise<void> {
  const { code, file, fingerprint, alias, thumbnail, onProgress } = opts;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/v1/rooms/${code}/files`);
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("X-File-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("X-Owner-Fingerprint", fingerprint);
    xhr.setRequestHeader("X-Owner-Alias", encodeURIComponent(alias));
    if (thumbnail) xhr.setRequestHeader("X-Thumbnail", thumbnail);
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
    xhr.send(file);
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
          data: { fingerprint: this.fingerprint, alias: this.alias, deviceType: DEVICE_TYPE },
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
