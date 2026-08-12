"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Cloud,
  Copy,
  DoorOpen,
  Download,
  FileIcon,
  Globe,
  LogOut,
  Monitor,
  Radio,
  Smartphone,
  Upload,
  User,
  Users,
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
import { LocalRoomView } from "./local-room-view";
import { CodeInput } from "./code-input";

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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
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

  useEffect(() => {
    fpRef.current = getFingerprint();
    setAliasState(getAlias());
  }, []);

  const onEvent = useCallback(
    (e: RoomEvent) => {
      switch (e.type) {
        case "sync":
          dispatch({ type: "sync", info: e.data.info, members: e.data.members, files: e.data.files });
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
          dispatch({ type: "upload_start", label: `${e.data.alias} · ${e.data.fileName}` });
          break;
        case "upload_done":
          dispatch({ type: "upload_done" });
          break;
        case "room_closed":
          dispatch({ type: "closed" });
          connRef.current?.close();
          break;
        case "error":
          setError(e.data.message === "ROOM_FULL" ? t("errors.full") : t("errors.notFound"));
          connRef.current?.close();
          setSession({ phase: "landing" });
          break;
      }
    },
    [t],
  );

  const openConnection = useCallback(
    (roomCode: string) => {
      connRef.current?.close();
      dispatch({ type: "reset" });
      const conn = new RoomConnection(
        roomCode,
        fpRef.current,
        alias.trim() || t("landing.anon"),
        onEvent,
        () => {},
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
      const room = await createRoom(fpRef.current, name);
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
    dispatch({ type: "reset" });
    setSession({ phase: "landing" });
    setCode("");
  }, [session]);

  useEffect(() => () => connRef.current?.close(), []);

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
    <div className="space-y-6 p-4 sm:p-7">
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
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
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
        className="h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm"
      >
        <DoorOpen className="mr-2 h-[18px] w-[18px]" />
        {busy === "create" ? t("landing.creating") : t("landing.create")}
      </Button>

      {/* divider */}
      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("landing.or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* join by code — OTP-style boxes */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("landing.joinLabel")}
        </label>
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

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
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
  onLeave: () => void;
  onError: (msg: string | null) => void;
  error: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const hostFp = state.info?.hostFingerprint;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onError(null);
    for (const file of Array.from(files)) {
      setUploadPct(0);
      try {
        const thumbnail = await makeThumbnail(file);
        await uploadRoomFile({
          code,
          file,
          fingerprint,
          alias,
          thumbnail,
          onProgress: (f) => setUploadPct(Math.round(f * 100)),
        });
      } catch (err) {
        onError(err instanceof Error ? err.message : t("errors.upload"));
      }
    }
    setUploadPct(null);
    if (fileInput.current) fileInput.current.value = "";
  };

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
    <div className="divide-y divide-border">
      {/* header: code + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            {t("room.codeLabel")}
          </p>
          <button
            onClick={copyCode}
            className="mt-1 flex items-center gap-2 font-mono text-2xl font-semibold tracking-[0.2em] hover:text-primary"
            title={t("room.copy")}
          >
            {code}
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <Button onClick={onLeave} variant="ghost" size="sm" className="text-destructive">
          {isHost ? <DoorOpen className="mr-1.5 h-4 w-4" /> : <LogOut className="mr-1.5 h-4 w-4" />}
          {isHost ? t("room.close") : t("room.leave")}
        </Button>
      </div>

      {/* members */}
      <div className="p-4 sm:p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" /> {t("room.members")} · {state.members.length}
        </p>
        <ul className="flex flex-wrap gap-2">
          {state.members.map((m) => {
            const you = m.fingerprint === fingerprint;
            const host = m.fingerprint === hostFp;
            return (
              <li
                key={m.fingerprint}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm"
              >
                <DeviceIcon type={m.deviceType} />
                <span className="max-w-[10rem] truncate">{m.alias || t("landing.anon")}</span>
                {host && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                    {t("room.host")}
                  </span>
                )}
                {you && (
                  <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {t("room.you")}
                  </span>
                )}
              </li>
            );
          })}
          {state.members.length === 0 && (
            <li className="text-sm text-muted-foreground">{t("room.connecting")}</li>
          )}
        </ul>
      </div>

      {/* files */}
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium">
            <FileIcon className="h-4 w-4" /> {t("room.files")} · {state.files.length}
          </p>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            onClick={() => fileInput.current?.click()}
            size="sm"
            disabled={uploadPct !== null}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {uploadPct !== null ? `${t("room.uploading")} ${uploadPct}%` : t("room.upload")}
          </Button>
        </div>

        {state.uploadingBy && (
          <p className="mb-2 text-xs text-muted-foreground">
            {t("room.uploadingBy", { who: state.uploadingBy })}
          </p>
        )}

        {state.files.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {t("room.noFiles")}
          </p>
        ) : (
          <ul className="space-y-2">
            {state.files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                {f.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:image/jpeg;base64,${f.thumbnail}`}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(f.size)} · {t("room.by", { who: f.ownerAlias || t("landing.anon") })}
                  </p>
                </div>
                <Button
                  onClick={() => downloadRoomFile(code, f).catch((e) => onError(String(e.message ?? e)))}
                  size="icon"
                  variant="ghost"
                  aria-label={t("room.download")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="bg-destructive/10 px-5 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
