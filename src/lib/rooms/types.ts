// Shared types for the browser Rooms client. Mirrors the wire shapes the
// RoomDO emits (server/do/room.ts) — member/file DTOs and the WebSocket event
// envelope { type, data }.

export type DeviceType = "web" | "mobile" | "desktop" | "unknown";

export interface RoomMember {
  fingerprint: string;
  alias: string;
  deviceType: string;
}

export interface RoomFile {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  ownerFingerprint: string;
  ownerAlias: string;
  thumbnail?: string | null;
  /** End-to-end encrypted room: salt + sealed metadata (see ./e2e.ts); the
   *  plain fileName/fileType/size are then placeholders for the container. */
  enc?: { v: number; salt: string; meta: string };
}

/** Present on a room whose creator made a room key (see ./e2e.ts). */
export interface RoomE2E {
  v: number;
  kid: string;
}

export interface RoomInfo {
  code: string;
  hostAlias: string;
  hostFingerprint: string;
  memberCount: number;
  fileCount: number;
  e2e?: RoomE2E;
}

/** The `sync` payload sent to a client the moment it joins over the WS. */
export interface RoomSync {
  info: RoomInfo;
  members: RoomMember[];
  files: RoomFile[];
}

/** Result of creating a room (REST POST /api/v1/rooms). */
export interface RoomCreated {
  code: string;
  hostToken: string;
  expiresAt: string;
  /** Echoed when the server registered the room key id (see ./e2e.ts). */
  e2e?: RoomE2E;
}

/** Server → client WebSocket event, discriminated on `type`. */
export type RoomEvent =
  | { type: "sync"; data: RoomSync }
  | { type: "member_joined"; data: RoomMember }
  | { type: "member_left"; data: { fingerprint: string; alias: string; deviceType: string } }
  | { type: "file_added"; data: { file: RoomFile } }
  | { type: "upload_start"; data: { alias: string; fileName: string } }
  | { type: "upload_done"; data: null }
  | { type: "room_closed"; data: null }
  | { type: "error"; data: { message: string } }
  // End-to-end encrypted rooms: a member without the key asks, one who has it
  // answers with the key sealed to the asker's public key.
  | { type: "key_request"; data: { fingerprint: string; pub: string } }
  | { type: "key_grant"; data: { from: string; pub: string; box: string } };
