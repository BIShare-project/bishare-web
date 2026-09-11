"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Cloud,
  DoorOpen,
  Globe,
  KeyRound,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  Monitor,
  Radio,
  Smartphone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createRoom,
  closeRoom,
  downloadRoomFile,
  uploadRoomFile,
  makeThumbnail,
  RoomConnection,
} from "@/lib/rooms/client";
import { getAlias, getFingerprint, setAlias as persistAlias } from "@/lib/rooms/identity";
import type { RoomEvent, RoomFile, RoomInfo, RoomMember } from "@/lib/rooms/types";
import {
  acceptGrant,
  b64u,
  forgetKey,
  grant,
  keyId,
  newKeyPair,
  newRoomKey,
  openFile,
  recallKey,
  rememberKey,
  sealFile,
  E2E_VERSION,
  type FileMeta,
  type KeyPair,
} from "@/lib/rooms/e2e";
import { LocalRoomView } from "./local-room-view";
import { RoomLayout } from "./room-layout";
import { CodeInput } from "./code-input";

// Uploads in an encrypted room carry this placeholder name on the wire.
const SEALED_NAME = "encrypted.bse2";
// How often a member still without the room key asks again — someone who has
// it may connect later, or a grant may have been dropped with a socket.
const KEY_RETRY_MS = 8000;
const DAY_MS = 24 * 3600 * 1000;

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
function makeLocalCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

// ── room state, driven by the WS event stream ───────────────────────────────
interface RoomState {
  info: RoomInfo | null;
  members: RoomMember[];
  files: RoomFile[];
  uploadingBy: string | null; // "<alias> · <fileName>" while a peer uploads
  closed: boolean;
}
type Action =
  | { type: "sync"; info: RoomInfo; members: RoomMember[]; files: RoomFile[] }
  | { type: "member_joined"; member: RoomMember }
  | { type: "member_left"; fingerprint: string }
  | { type: "file_added"; file: RoomFile }
  | { type: "upload_start"; label: string }
  | { type: "upload_done" }
  | { type: "closed" }
  | { type: "reset" };

const initialState: RoomState = {
  info: null,
  members: [],
  files: [],
  uploadingBy: null,
  closed: false,
};

function reducer(state: RoomState, a: Action): RoomState {
  switch (a.type) {
    case "sync":
      return { ...state, info: a.info, members: a.members, files: a.files, closed: false };
    case "member_joined":
      return state.members.some((m) => m.fingerprint === a.member.fingerprint)
        ? state
        : { ...state, members: [...state.members, a.member] };
    case "member_left":
      return { ...state, members: state.members.filter((m) => m.fingerprint !== a.fingerprint) };
    case "file_added":
      return state.files.some((f) => f.id === a.file.id)
        ? state
        : { ...state, files: [a.file, ...state.files] };
    case "upload_start":
      return { ...state, uploadingBy: a.label };
    case "upload_done":
      return { ...state, uploadingBy: null };
    case "closed":
      return { ...state, closed: true };
    case "reset":
      return initialState;
  }
}

function DeviceIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  if (type === "web") return <Globe className={cls} aria-hidden />;
  if (type === "desktop") return <Monitor className={cls} aria-hidden />;
  if (type === "mobile") return <Smartphone className={cls} aria-hidden />;
  return <Globe className={cls} aria-hidden />;
}

type RoomMode = "cloud" | "local";
type Session =
  | { phase: "landing" }
  | { phase: "room"; code: string; hostToken: string | null; mode: RoomMode };

export function RoomsApp({
  initialCode,
  initialMode = "cloud",
}: {
  initialCode?: string;
  initialMode?: RoomMode;
}) {
  const t = useTranslations("rooms");
  const [session, setSession] = useState<Session>({ phase: "landing" });
  const [mode, setMode] = useState<RoomMode>(initialMode);
  const [alias, setAliasState] = useState("");
  const [code, setCode] = useState(initialCode?.toUpperCase() ?? "");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const connRef = useRef<RoomConnection | null>(null);
  const fpRef = useRef("");
  // End-to-end encryption (cloud rooms): the room key K, this connection's
  // X25519 pair for the hand-off, and the room's key id once the sync says it
  // is an encrypted room. Refs because the WS handler reads them; `roomKey`
  // mirrors K as state so the view re-renders once it arrives.
  const keyRef = useRef<Uint8Array | null>(null);
  const pairRef = useRef<KeyPair | null>(null);
  const kidRef = useRef<string | null>(null);
  const codeRef = useRef("");
  const [roomKey, setRoomKey] = useState<Uint8Array | null>(null);

  const adoptKey = useCallback((k: Uint8Array, kid: string, expiresAt?: string) => {
    keyRef.current = k;
    setRoomKey(k);
    rememberKey(codeRef.current, k, kid, expiresAt ?? new Date(Date.now() + DAY_MS).toISOString());
  }, []);

  const dropKey = useCallback(() => {
    keyRef.current = null;
    kidRef.current = null;
    setRoomKey(null);
  }, []);

  // After a sync: is this an encrypted room, and do we hold its key? A key we
  // already hold or stored for this code counts only if its kid matches.
  const settleKey = useCallback(
    async (info: RoomInfo) => {
      const kid = info.e2e?.v === E2E_VERSION ? info.e2e.kid : null;
      kidRef.current = kid;
      if (!kid) return;
      if (keyRef.current && (await keyId(keyRef.current)) === kid) return;
      const stored = recallKey(codeRef.current, kid);
      if (stored) {
        keyRef.current = stored;
        setRoomKey(stored);
        return;
      }
      keyRef.current = null;
      setRoomKey(null);
      connRef.current?.send("key_request");
    },
    [],
  );

  useEffect(() => {
    fpRef.current = getFingerprint();
    setAliasState(getAlias());
  }, []);

  const onEvent = useCallback(
    (e: RoomEvent) => {
      switch (e.type) {
        case "sync":
          dispatch({ type: "sync", info: e.data.info, members: e.data.members, files: e.data.files });
          void settleKey(e.data.info);
          break;
        case "member_joined":
          dispatch({ type: "member_joined", member: e.data });
          break;
        case "member_left":
          dispatch({ type: "member_left", fingerprint: e.data.fingerprint });
          break;
        case "file_added":
          dispatch({ type: "file_added", file: e.data.file });
          break;
        case "upload_start":
          // In an encrypted room the name on the wire is a placeholder.
          dispatch({
            type: "upload_start",
            label: e.data.fileName === SEALED_NAME ? e.data.alias : `${e.data.alias} · ${e.data.fileName}`,
          });
          break;
        case "upload_done":
          dispatch({ type: "upload_done" });
          break;
        case "room_closed":
          dispatch({ type: "closed" });
          connRef.current?.close();
          forgetKey(codeRef.current);
          break;
        case "key_request": {
          // Someone without the key asked; anyone who holds it answers. A short
          // random delay spreads the answers — the asker keeps the first good one.
          const k = keyRef.current;
          const pair = pairRef.current;
          const { fingerprint, pub } = e.data;
          if (!k || !pair || !kidRef.current || fingerprint === fpRef.current) break;
          setTimeout(() => {
            grant(k, codeRef.current, pair, pub)
              .then((box) => connRef.current?.send("key_grant", { to: fingerprint, box }))
              .catch(() => {});
          }, Math.random() * 400);
          break;
        }
        case "key_grant": {
          const kid = kidRef.current;
          const pair = pairRef.current;
          if (keyRef.current || !kid || !pair) break;
          acceptGrant(codeRef.current, pair, e.data.pub, e.data.box, kid)
            .then((k) => {
              if (!keyRef.current && kidRef.current === kid) adoptKey(k, kid);
            })
            .catch(() => {
              /* a grant that doesn't open or doesn't match the kid is ignored */
            });
          break;
        }
        case "error":
          setError(
            e.data.message === "ROOM_FULL"
              ? t("errors.full")
              : e.data.message === "ROOM_UPDATE_REQUIRED"
                ? t("errors.updateRequired")
                : t("errors.notFound"),
          );
          connRef.current?.close();
          setSession({ phase: "landing" });
          break;
      }
    },
    [t, settleKey, adoptKey],
  );

  const openConnection = useCallback(
    (roomCode: string) => {
      connRef.current?.close();
      dispatch({ type: "reset" });
      codeRef.current = roomCode;
      pairRef.current = newKeyPair();
      const conn = new RoomConnection(
        roomCode,
        fpRef.current,
        alias.trim() || t("landing.anon"),
        onEvent,
        () => {},
        b64u(pairRef.current.pub),
      );
      connRef.current = conn;
      conn.connect();
    },
    [alias, onEvent, t],
  );

  const handleCreate = async () => {
    setError(null);
    const name = alias.trim();
    if (!name) return setError(t("landing.nameRequired"));
    persistAlias(name);
    if (mode === "local") {
      // Local rooms have no server room — the code is just a P2P signaling
      // channel. LocalRoomView opens the WebRTC mesh itself.
      setSession({ phase: "room", code: makeLocalCode(), hostToken: null, mode: "local" });
      return;
    }
    setBusy("create");
    try {
      // The room key is made here and never leaves members' devices in the
      // clear; the server only learns its key id.
      dropKey();
      const k = newRoomKey();
      const kid = await keyId(k);
      const room = await createRoom(fpRef.current, name, { v: E2E_VERSION, kid });
      codeRef.current = room.code;
      // Only a server that echoes the kid made an encrypted room.
      if (room.e2e?.kid === kid) {
        kidRef.current = kid;
        adoptKey(k, kid, room.expiresAt);
      }
      setSession({ phase: "room", code: room.code, hostToken: room.hostToken, mode: "cloud" });
      openConnection(room.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.create"));
    } finally {
      setBusy(null);
    }
  };

  const handleJoin = async () => {
    setError(null);
    const name = alias.trim();
    const c = code.trim().toUpperCase();
    if (!name) return setError(t("landing.nameRequired"));
    if (!c) return setError(t("landing.codeRequired"));
    persistAlias(name);
    if (mode === "local") {
      setSession({ phase: "room", code: c, hostToken: null, mode: "local" });
      return;
    }
    setBusy("join");
    dropKey();
    setSession({ phase: "room", code: c, hostToken: null, mode: "cloud" });
    openConnection(c);
    setBusy(null);
  };

  const handleLeave = useCallback(async () => {
    if (session.phase === "room" && session.hostToken) {
      try {
        await closeRoom(session.code, session.hostToken);
      } catch {
        /* best-effort */
      }
    }
    connRef.current?.leave();
    connRef.current = null;
    if (session.phase === "room") forgetKey(session.code);
    dropKey();
    dispatch({ type: "reset" });
    setSession({ phase: "landing" });
    setCode("");
  }, [session, dropKey]);

  useEffect(() => () => connRef.current?.close(), []);

  // Still without the key in an encrypted room: keep asking until a member
  // who has it answers.
  const waitingForKey = Boolean(state.info?.e2e) && !roomKey && session.phase === "room";
  useEffect(() => {
    if (!waitingForKey) return;
    const timer = setInterval(() => connRef.current?.send("key_request"), KEY_RETRY_MS);
    return () => clearInterval(timer);
  }, [waitingForKey]);

  if (session.phase === "landing") {
    return (
      <Landing
        t={t}
        mode={mode}
        setMode={setMode}
        alias={alias}
        setAlias={setAliasState}
        code={code}
        setCode={setCode}
        busy={busy}
        error={error}
        onCreate={handleCreate}
        onJoin={handleJoin}
      />
    );
  }

  if (session.mode === "local") {
    return (
      <LocalRoomView
        code={session.code}
        alias={alias.trim() || t("landing.anon")}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <RoomView
      t={t}
      code={session.code}
      isHost={session.hostToken !== null}
      fingerprint={fpRef.current}
      alias={alias.trim() || t("landing.anon")}
      state={state}
      roomKey={roomKey}
      onLeave={handleLeave}
      onError={setError}
      error={error}
    />
  );
}

// ── landing: create or join ─────────────────────────────────────────────────
function Landing({
  t,
  mode,
  setMode,
  alias,
  setAlias,
  code,
  setCode,
  busy,
  error,
  onCreate,
  onJoin,
}: {
  t: ReturnType<typeof useTranslations>;
  mode: RoomMode;
  setMode: (m: RoomMode) => void;
  alias: string;
  setAlias: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  busy: "create" | "join" | null;
  error: string | null;
  onCreate: () => void;
  onJoin: () => void;
}) {
  const cloud = mode === "cloud";
  return (
    <div className="relative lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
      {/* left pane — pick a transport, name yourself, open a room */}
      <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-6 lg:p-7">
        {/* mode switch: Cloud (relay) ⇄ Local (P2P) — one pill toggle, not tabs */}
        <div className="space-y-2">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-muted/40 py-1.5 pl-4 pr-4 text-sm">
            <button
              onClick={() => setMode("cloud")}
              className={
                "flex items-center gap-1.5 transition " +
                (cloud ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Cloud className="h-3.5 w-3.5" />
              {t("mode.cloud")}
            </button>
            <Switch
              checked={mode === "local"}
              onCheckedChange={(v) => setMode(v ? "local" : "cloud")}
              aria-label={t("mode.local")}
            />
            <button
              onClick={() => setMode("local")}
              className={
                "flex items-center gap-1.5 transition " +
                (!cloud ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Radio className="h-3.5 w-3.5" />
              {t("mode.local")}
            </button>
          </div>
          <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
            {t(`mode.${mode}Desc`)}
          </p>
        </div>

        {/* name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="room-alias">
            {t("landing.aliasLabel")}
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="room-alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={t("landing.aliasPlaceholder")}
              maxLength={40}
              autoComplete="off"
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </div>

        {/* create — primary CTA */}
        <Button
          onClick={onCreate}
          disabled={busy !== null}
          size="lg"
          className="mt-auto h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm"
        >
          <DoorOpen className="mr-2 h-[18px] w-[18px]" />
          {busy === "create" ? t("landing.creating") : t("landing.create")}
        </Button>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* right pane — joining is always reachable, exactly like the transfer
          studio keeps "enter a code" beside whichever send route is showing */}
      <section
        aria-label={t("landing.joinLabel")}
        className="relative border-t border-border/60 bg-background-raised/30 p-5 backdrop-blur-sm sm:p-6 lg:border-l lg:border-t-0 lg:p-7"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
            <LogIn className="h-4 w-4" />
          </span>
          <h2 className="min-w-0 text-[15px] font-semibold tracking-[-0.01em]">
            {t("landing.joinLabel")}
          </h2>
        </div>
        <div className="mt-4 space-y-2.5 sm:mt-5 sm:max-w-md lg:max-w-none">
          <CodeInput value={code} onChange={setCode} onEnter={onJoin} length={4} />
          <Button
            onClick={onJoin}
            disabled={busy !== null}
            variant="secondary"
            className="h-11 w-full rounded-xl"
          >
            {busy === "join" ? t("landing.joining") : t("landing.join")}
          </Button>
        </div>
      </section>
    </div>
  );
}

// ── in-room view ────────────────────────────────────────────────────────────
function RoomView({
  t,
  code,
  isHost,
  fingerprint,
  alias,
  state,
  roomKey,
  onLeave,
  onError,
  error,
}: {
  t: ReturnType<typeof useTranslations>;
  code: string;
  isHost: boolean;
  fingerprint: string;
  alias: string;
  state: RoomState;
  roomKey: Uint8Array | null;
  onLeave: () => void;
  onError: (msg: string | null) => void;
  error: string | null;
}) {
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const hostFp = state.info?.hostFingerprint;
  const e2e = Boolean(state.info?.e2e);

  // Sealed metadata, opened once per file as the key and the list allow.
  // null = could not be opened (shown as an unnamed encrypted file).
  const [metas, setMetas] = useState<Record<string, FileMeta | null>>({});
  const opened = useRef(new Set<string>());
  useEffect(() => {
    if (!roomKey) return;
    for (const f of state.files) {
      if (!f.enc || opened.current.has(f.id)) continue;
      opened.current.add(f.id);
      openFile(roomKey, f.enc.salt, f.enc.meta)
        .then(({ meta }) => setMetas((m) => ({ ...m, [f.id]: meta })))
        .catch(() => setMetas((m) => ({ ...m, [f.id]: null })));
    }
  }, [roomKey, state.files]);

  // Picked before the key arrived (it takes a moment after joining): held
  // here and sent as soon as it does, rather than refused and lost.
  const queued = useRef<File[]>([]);

  const handleFiles = async (files: File[]) => {
    onError(null);
    if (e2e && !roomKey) {
      queued.current.push(...files);
      setUploadPct(0);
      return;
    }
    for (const file of files) {
      setUploadPct(0);
      try {
        const thumbnail = await makeThumbnail(file);
        const sealed = roomKey && e2e
          ? await sealFile(roomKey, {
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size,
              thumbnail,
            })
          : undefined;
        await uploadRoomFile({
          code,
          file,
          fingerprint,
          alias,
          thumbnail,
          sealed,
          onProgress: (f) => setUploadPct(Math.round(f * 100)),
        });
      } catch (err) {
        onError(err instanceof Error ? err.message : t("errors.upload"));
      }
    }
    setUploadPct(null);
  };

  useEffect(() => {
    if (!roomKey || queued.current.length === 0) return;
    const files = queued.current;
    queued.current = [];
    void handleFiles(files);
    // handleFiles from this render already sees the new key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey]);

  if (state.closed) {
    return (
      <div className="space-y-4 p-8 text-center">
        <DoorOpen className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-lg font-medium">{t("room.roomClosed")}</p>
        <Button onClick={onLeave} variant="secondary">
          {t("room.backToStart")}
        </Button>
      </div>
    );
  }

  return (
    <RoomLayout
      mode="cloud"
      code={code}
      members={state.members.map((m) => {
        const host = m.fingerprint === hostFp;
        return {
          id: m.fingerprint,
          alias: m.alias || t("landing.anon"),
          icon: <DeviceIcon type={m.deviceType} />,
          badge: host ? "host" : m.fingerprint === fingerprint ? "you" : undefined,
        };
      })}
      membersPlaceholder={state.members.length === 0 ? t("room.connecting") : undefined}
      files={state.files.map((f) => {
        const meta = f.enc ? metas[f.id] : undefined;
        const thumb = f.enc ? meta?.thumbnail : f.thumbnail;
        return {
          id: f.id,
          name: f.enc ? (meta?.name ?? t("room.encryptedFile")) : f.fileName,
          size: f.enc ? (meta?.size ?? f.size) : f.size,
          byAlias: f.ownerAlias || t("landing.anon"),
          thumbnailSrc: thumb ? `data:image/jpeg;base64,${thumb}` : undefined,
          onDownload: () => {
            const run = async () => {
              if (!f.enc) return downloadRoomFile(code, f);
              if (!roomKey || !meta) throw new Error(t("room.e2eWaiting"));
              const { fileKey } = await openFile(roomKey, f.enc.salt, f.enc.meta);
              return downloadRoomFile(code, f, { fileKey, name: meta.name, type: meta.type });
            };
            run().catch((e) => onError(String(e?.message ?? e)));
          },
        };
      })}
      filesPlaceholder={t("room.noFiles")}
      uploadPct={uploadPct}
      uploadingBy={state.uploadingBy}
      uploadLabel={t("room.upload")}
      onFiles={(files) => void handleFiles(files)}
      status={
        !state.info
          ? undefined
          : !e2e
            ? { icon: <LockOpen className="h-3.5 w-3.5" aria-hidden />, text: t("room.e2eOff"), tone: "warn" }
            : roomKey
              ? { icon: <Lock className="h-3.5 w-3.5" aria-hidden />, text: t("room.e2eOn"), tone: "ok" }
              : { icon: <KeyRound className="h-3.5 w-3.5 animate-pulse" aria-hidden />, text: t("room.e2eWaiting"), tone: "muted" }
      }
      leave={{
        label: isHost ? t("room.close") : t("room.leave"),
        icon: isHost ? <DoorOpen className="mr-1.5 h-4 w-4" /> : <LogOut className="mr-1.5 h-4 w-4" />,
        onClick: onLeave,
      }}
      error={error}
    />
  );
}
