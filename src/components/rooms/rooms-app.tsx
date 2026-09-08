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
  LogIn,
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
  const [dragging, setDragging] = useState(false);
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
    <div className="relative flex flex-col lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
      {/* ── left: the files themselves, the reason the room exists ──────── */}
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={
          "relative order-2 flex min-h-[20rem] min-w-0 flex-col p-5 transition sm:p-6 lg:order-1 lg:p-7 " +
          (dragging ? "bg-primary/[0.06]" : "")
        }
      >
        {dragging && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-primary/60"
          />
        )}

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            <FileIcon className="h-3.5 w-3.5" />
            {t("room.files")}
            <span className="tabular-nums">{state.files.length}</span>
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
            className="rounded-lg"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {uploadPct !== null ? `${t("room.uploading")} ${uploadPct}%` : t("room.upload")}
          </Button>
        </div>

        {uploadPct !== null && (
          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        )}
        {state.uploadingBy && (
          <p className="mb-3 text-xs text-muted-foreground">
            {t("room.uploadingBy", { who: state.uploadingBy })}
          </p>
        )}

        {state.files.length === 0 ? (
          <button
            onClick={() => fileInput.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center transition hover:border-foreground/25 hover:bg-muted/30"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </span>
            <span className="text-sm text-muted-foreground">{t("room.noFiles")}</span>
          </button>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {state.files.map((f) => (
              <li
                key={f.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card transition duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {f.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:image/jpeg;base64,${f.thumbnail}`}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <FileIcon className="h-6 w-6 text-muted-foreground/70" />
                    </span>
                  )}
                  <Button
                    onClick={() =>
                      downloadRoomFile(code, f).catch((e) => onError(String(e.message ?? e)))
                    }
                    size="icon"
                    aria-label={t("room.download")}
                    className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg opacity-0 shadow-md transition group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[13px] font-medium leading-tight" title={f.fileName}>
                    {f.fileName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatBytes(f.size)} · {t("room.by", { who: f.ownerAlias || t("landing.anon") })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p
            className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </section>

      {/* ── right: who and where — the room's identity, always in view ──── */}
      <aside className="relative order-1 flex flex-col gap-6 border-b border-border/60 bg-background-raised/30 p-5 backdrop-blur-sm sm:p-6 lg:order-2 lg:border-b-0 lg:border-l lg:p-7">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("room.codeLabel")}
          </p>
          <button
            onClick={copyCode}
            title={t("room.copy")}
            className="group mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 transition hover:border-foreground/25 hover:bg-muted/70"
          >
            <span className="font-mono text-[26px] font-semibold leading-none tracking-[0.18em]">
              {code}
            </span>
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
            )}
          </button>
        </div>

        <div className="min-w-0">
          <p className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {t("room.members")}
            <span className="ml-auto tabular-nums">{state.members.length}</span>
          </p>
          <ul className="space-y-0.5">
            {state.members.map((m) => {
              const you = m.fingerprint === fingerprint;
              const host = m.fingerprint === hostFp;
              return (
                <li
                  key={m.fingerprint}
                  className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <DeviceIcon type={m.deviceType} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{m.alias || t("landing.anon")}</span>
                  {host && (
                    <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                      {t("room.host")}
                    </span>
                  )}
                  {you && !host && (
                    <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                      {t("room.you")}
                    </span>
                  )}
                </li>
              );
            })}
            {state.members.length === 0 && (
              <li className="px-1.5 text-sm text-muted-foreground">{t("room.connecting")}</li>
            )}
          </ul>
        </div>

        <Button
          onClick={onLeave}
          variant="ghost"
          size="sm"
          className="mt-auto justify-start text-destructive hover:text-destructive"
        >
          {isHost ? <DoorOpen className="mr-1.5 h-4 w-4" /> : <LogOut className="mr-1.5 h-4 w-4" />}
          {isHost ? t("room.close") : t("room.leave")}
        </Button>
      </aside>
    </div>
  );
}
