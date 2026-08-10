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
}

export interface RoomInfo {
  code: string;
  hostAlias: string;
  hostFingerprint: string;
  memberCount: number;
  fileCount: number;
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
  | { type: "error"; data: { message: string } };
