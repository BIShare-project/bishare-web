"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ArchiveRestore,
  Check,
  CloudUpload,
  Download,
  EyeOff,
  FolderInput,
  Globe,
  HardDrive,
  Image as ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  Monitor,
  Play,
  QrCode,
  ShieldCheck,
  Smartphone,
  Timer,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { DriveApiError } from "@/lib/vault/client";
import type { DriveDevice, DriveObject } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { useActions } from "./actions";
import { EmptyState, KIND_COLORS, Kpi, KpiGrid, ObjectThumb, PageHead, Panel } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes, dayTitle, percent, when } from "./format";
import { ExplainGrid, InfoTip, Term } from "./help";
import { RowCheck, SelectionBar, useSelection } from "./selection";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const DAY = 86_400_000;

function HeadWithHelp({ children, help, className }: { children: React.ReactNode; help: React.ReactNode; className?: string }) {
  return (
    <TableHead className={className}>
      <span className="inline-flex items-center gap-1">
        {children}
        <InfoTip>{help}</InfoTip>
      </span>
    </TableHead>
  );
}

/** Photos & videos: every picture of the Drive by the day it was taken; pick several like in Google Photos. */
export function PhotosPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const index = useIndex();
  const actions = useActions();
  const media = index
    .live()
    .filter((o) => o.kind === "file" && !!o.mime && (o.mime.startsWith("image/") || o.mime.startsWith("video/")))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  const { click, clear, selected, has, sel } = useSelection(media);
  const days = new Map<string, DriveObject[]>();
  for (const o of media) {
    const d = new Date(o.mtimeMs);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    days.set(key, [...(days.get(key) ?? []), o]);
  }
  const size = media.reduce((a, o) => a + (o.size ?? 0), 0);
  const videos = media.filter((o) => o.mime?.startsWith("video/")).length;
  const picking = sel.size > 0;
  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title={t("nav.photos")}
        sub={t("photos.subWeb", { photos: media.length - videos, videos, size: bytes(size) })}
        actions={
          <Button variant="outline" onClick={() => actions.upload(null)}>
            <Upload /> {t("act.upload")}
          </Button>
        }
      />
      {selected.length ? (
        <SelectionBar count={selected.length} onClear={clear}>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.download(selected)}>
            <Download /> <span className="hidden sm:inline">{selected.length > 1 ? t("act.downloadZip") : t("act.download")}</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.move(selected.map((o) => o.id))}>
            <FolderInput /> <span className="hidden sm:inline">{t("act.move")}</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void actions.trash(selected.map((o) => o.id))}>
            <Trash2 /> <span className="hidden sm:inline">{t("act.trash")}</span>
          </Button>
        </SelectionBar>
      ) : null}
      {media.length === 0 ? (
        <Panel>
          <EmptyState icon={ImageIcon} title={t("empty.photos")} description={t("empty.photosBody")} />
        </Panel>
      ) : (
        [...days.values()].map((list) => (
          <section key={list[0]!.id}>
            <div className={cn("sticky z-10 -mx-1 mb-2 flex items-baseline gap-2 bg-background/95 px-1 py-1.5 backdrop-blur", picking ? "top-[6.75rem]" : "top-14")}>
              <h2 className="text-xs font-semibold">{dayTitle(list[0]!.mtimeMs, locale)}</h2>
              <span className="text-3xs text-muted-foreground">{t("items", { n: list.length })}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
              {list.map((o) => {
                const on = has(o.id);
                return (
                  <div
                    key={o.id}
                    role="button"
                    tabIndex={0}
                    title={o.name}
                    aria-pressed={on}
                    onClick={(e) => (picking || e.metaKey || e.ctrlKey || e.shiftKey ? click(o, e, true) : actions.open(o, media))}
                    onKeyDown={(e) => {
                      // Keys pressed on the tile's own box stay with the box.
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter") actions.open(o, media);
                      else if (e.key === " ") {
                        e.preventDefault();
                        click(o, e, true);
                      }
                    }}
                    className={cn("group relative aspect-square cursor-pointer overflow-hidden bg-muted outline-none focus-visible:ring-2 focus-visible:ring-blau", on && "ring-2 ring-blau ring-inset")}
                  >
                    <ObjectThumb o={o} large className={cn("transition-transform duration-300", on ? "scale-[0.88]" : "group-hover:scale-[1.04]")} />
                    {o.mime?.startsWith("video/") ? (
                      <span className="absolute end-1.5 bottom-1.5 grid size-6 place-items-center bg-black/55 text-white backdrop-blur">
                        <Play className="size-3 fill-current" />
                      </span>
                    ) : null}
                    <span className={cn("absolute inset-0 bg-gradient-to-b from-black/30 to-transparent to-40% transition-opacity", picking || on ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
                    <span className={cn("absolute start-1.5 top-1.5 bg-background/90 transition-opacity", picking || on ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                      <RowCheck checked={on} label={o.name} onToggle={(e) => click(o, e, true)} />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

/** Devices: every app and browser that holds the key; browsers can be removed here. */
export function DevicesPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const { session, lock, client, index: idx, confirm, toast } = useDrive();
  const index = useIndex();
  const actions = useActions();
  const words = { today: t("today"), yesterday: t("yesterday") };
  const apps = index.devices.filter((d) => d.kind === "app");
  const browsers = index.devices.filter((d) => d.kind === "web");
  // Only other browsers, and computers a phone approved, can be picked: this one
  // locks itself, phones go from the app.
  const approved = (d: DriveDevice) => d.kind === "web" || d.kind === "desktop";
  const removable = index.devices.filter((d) => approved(d) && d.id !== session.deviceId);
  const { click, clear, all, selected, headState, has } = useSelection(removable);

  const remove = async (list: DriveDevice[]) => {
    if (!list.length) return;
    const computers = list.some((d) => d.kind === "desktop");
    const ok = await confirm({
      title: computers ? t("devices.removeDevicesTitle", { n: list.length }) : t("devices.removeTitle", { n: list.length }),
      body: t("devices.removeBody"),
      confirm: t("devices.remove"),
      danger: true,
    });
    if (!ok) return;
    try {
      for (const d of list) await client.removeDevice(d.id);
      clear();
      toast(computers ? t("devices.devicesRemoved", { n: list.length }) : t("devices.removed", { n: list.length }), { tone: "ok" });
    } catch (e) {
      if (e instanceof DriveApiError && e.code === "VAULT_SIGNIN_REQUIRED") toast(t("devices.removeInApp"), { tone: "error" });
      else actions.fail(e);
    } finally {
      await idx.pull().catch(() => undefined);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHead title={t("nav.devices")} sub={t("devices.sub")} />
      <ExplainGrid
        items={[
          { icon: Smartphone, title: t("devices.how1Title"), text: t("devices.how1") },
          { icon: QrCode, title: t("devices.how2Title"), text: t("devices.how2") },
          { icon: ShieldCheck, title: t("devices.how3Title"), text: t("devices.how3") },
        ]}
      />
      <KpiGrid cols={3}>
        <Kpi icon={Smartphone} label={t("devices.apps")} value={String(apps.length)} help={t("devices.appsHelp")} />
        <Kpi
          icon={Globe}
          label={t("devices.browsers")}
          value={String(browsers.length)}
          sub={t("devices.browsersSub", { n: browsers.filter((d) => (d.idleLimitMs ?? 0) > DAY).length })}
          help={t("devices.browsersHelp")}
        />
        <Kpi icon={Monitor} label={t("devices.thisOne")} value={session.name} sub={session.stay ? t("staysSignedIn") : t("locksWhenClosed")} help={t("glossary.stay.definition")} />
      </KpiGrid>
      {selected.length ? (
        <SelectionBar count={selected.length} onClear={clear}>
          <Button variant="destructive" size="sm" onClick={() => void remove(selected)}>
            <LogOut /> {t("devices.remove")}
          </Button>
        </SelectionBar>
      ) : null}
      <Panel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-9 pe-0">
                <Checkbox aria-label={t("act.selectAll")} checked={headState} disabled={!removable.length} onCheckedChange={(c) => (c ? all() : clear())} />
              </TableHead>
              <TableHead>{t("devices.device")}</TableHead>
              <HeadWithHelp help={t("devices.kindHelp")}>{t("col.kind")}</HeadWithHelp>
              <HeadWithHelp className="hidden sm:table-cell" help={t("devices.lastUsedHelp")}>
                {t("devices.lastUsed")}
              </HeadWithHelp>
              <TableHead className="hidden md:table-cell">{t("devices.added")}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {index.devices.map((d) => {
              const Icon =
                d.kind === "web" ? Globe : d.kind === "app" && /phone|galaxy|pixel|android|ios|iphone/i.test(d.name ?? "") ? Smartphone : Monitor;
              const me = d.id === session.deviceId;
              const canPick = approved(d) && !me;
              const on = has(d.id);
              const idle = d.idleLimitMs ?? 0;
              return (
                <TableRow key={d.id} data-state={on ? "selected" : undefined} className={cn("group data-[state=selected]:bg-blau-soft", canPick && "cursor-default select-none")} onClick={(e) => canPick && click(d, e)}>
                  <TableCell className="pe-0" onClick={(e) => e.stopPropagation()}>
                    {canPick ? <RowCheck checked={on} label={d.name ?? t("devices.unnamed")} onToggle={(e) => click(d, e, true)} /> : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("grid size-8 shrink-0 place-items-center border bg-muted/60", me && "border-blau bg-blau-soft")}>
                        <Icon className={cn("size-4 text-muted-foreground", me && "text-blau")} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{d.name ?? t("devices.unnamed")}</span>
                        <span className="block text-3xs text-muted-foreground">
                          {me
                            ? t("devices.thisBrowser")
                            : d.kind === "app"
                              ? t("devices.app")
                              : d.kind === "desktop"
                                ? t("devices.computerDays", { n: Math.round(idle / DAY) })
                                : idle < DAY
                                  ? t("devices.browserHours", { n: Math.round(idle / 3_600_000) })
                                  : t("devices.browserDays", { n: Math.round(idle / DAY) })}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {d.kind === "web" ? t("devices.web") : d.kind === "desktop" ? t("devices.computerTag") : t("devices.appTag")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{me ? t("devices.now") : d.lastSeenAt ? when(d.lastSeenAt, locale, words) : "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(d.addedAt))}</TableCell>
                  <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    {me ? (
                      <Button variant="outline" size="sm" onClick={() => void lock()}>
                        <Lock /> {t("lock")}
                      </Button>
                    ) : approved(d) ? (
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => void remove([d])}>
                        <LogOut /> {t("devices.remove")}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-3xs text-muted-foreground">
                        {t("devices.inAppOnly")}
                        <InfoTip>{t("devices.inAppOnlyHelp")}</InfoTip>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

/** Trash: what goes for good 30 days after it was moved there. */
export function TrashPage() {
  const t = useTranslations("drive");
  const index = useIndex();
  const actions = useActions();
  const items = index.trash().sort((a, b) => (a.trashedAt ?? 0) - (b.trashedAt ?? 0));
  const { click, clear, all, selected, headState, has } = useSelection(items);
  const size = items.reduce((a, o) => a + index.treeSize(o.id), 0);
  const ids = selected.map((o) => o.id);
  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title={t("nav.trash")}
        sub={t("trash.sub", { n: items.length, size: bytes(size) })}
        actions={
          items.length ? (
            <Button variant="destructive" onClick={() => void actions.emptyTrash()}>
              <Trash2 /> {t("act.emptyTrash")}
            </Button>
          ) : null
        }
      />
      <ExplainGrid
        items={[
          { icon: Timer, title: t("trash.how1Title"), text: t("trash.how1") },
          { icon: Undo2, title: t("trash.how2Title"), text: t("trash.how2") },
          { icon: HardDrive, title: t("trash.how3Title"), text: t("trash.how3") },
        ]}
      />
      {selected.length ? (
        <SelectionBar count={selected.length} onClear={clear}>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.restore(ids).then(clear)}>
            <ArchiveRestore /> {t("act.restore")}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void actions.deleteForGood(ids).then((gone) => gone && clear())}>
            <X /> {t("act.deleteForever")}
          </Button>
        </SelectionBar>
      ) : null}
      <Panel>
        {items.length === 0 ? (
          <EmptyState icon={Trash2} title={t("empty.trash")} description={t("empty.trashBody")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-9 pe-0">
                  <Checkbox aria-label={t("act.selectAll")} checked={headState} onCheckedChange={(c) => (c ? all() : clear())} />
                </TableHead>
                <TableHead>{t("col.name")}</TableHead>
                <TableHead className="text-end">{t("col.size")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("trash.wasIn")}</TableHead>
                <HeadWithHelp className="w-56" help={t("trash.goneInHelp")}>
                  {t("trash.goneIn")}
                </HeadWithHelp>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => {
                const left = Math.max(0, Math.ceil(((o.trashedAt ?? 0) + 30 * DAY - Date.now()) / DAY));
                const hot = left <= 3;
                const on = has(o.id);
                return (
                  <TableRow key={o.id} data-state={on ? "selected" : undefined} className="group cursor-default select-none data-[state=selected]:bg-blau-soft" onClick={(e) => click(o, e)}>
                    <TableCell className="pe-0" onClick={(e) => e.stopPropagation()}>
                      <RowCheck checked={on} label={o.name} onToggle={(e) => click(o, e, true)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ObjectThumb o={o} />
                        <span className="max-w-[320px] truncate font-medium">{o.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground tabular-nums">{bytes(index.treeSize(o.id))}</TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-muted-foreground md:table-cell">{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className={cn("w-16 shrink-0 text-2xs tabular-nums", hot ? "font-semibold text-destructive" : "text-muted-foreground")}>{t("trash.days", { n: left })}</span>
                        <div className="h-1 flex-1 bg-muted">
                          <span className="block h-full" style={{ width: `${((30 - left) / 30) * 100}%`, background: hot ? "var(--destructive)" : "var(--muted-foreground)" }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-1 text-end" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => void actions.restore([o.id])}>
                        <ArchiveRestore /> <span className="hidden lg:inline">{t("act.restore")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}

const PLANS = [
  { size: "100 GB", month: "$2.49", year: "$24.99" },
  { size: "250 GB", month: "$5.99", year: "$59.99" },
  { size: "500 GB", month: "$9.99", year: "$99.99" },
  { size: "1 TB", month: "$19.99", year: "$199.99" },
];

/** Plan & storage: the quota, what fills it, and the plans (bought in the app). */
export function StoragePage() {
  const t = useTranslations("drive");
  const index = useIndex();
  const info = index.info;
  const used = info?.usedBytes ?? 0;
  const quota = info?.quotaBytes ?? 0;
  const stats = index.stats();
  const all = Object.values(stats.byKind).reduce((a, b) => a + b, 0) || 1;
  const scale = used > 0 ? used / all : 1;
  return (
    <div className="flex flex-col gap-4">
      <PageHead title={t("nav.storage")} sub={info ? t("storage.sub", { region: t(`region.${info.region}`) }) : ""} />
      <Panel title={t("kpi.used")} help={t("storage.usedHelp")}>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div className="text-3xl font-semibold tracking-tight tabular-nums">{bytes(used)}</div>
            <div className="pb-1 text-xs text-muted-foreground">{t("kpi.usedSub", { pct: percent(used, quota), total: bytes(quota) })}</div>
            <div className="ms-auto pb-1 text-xs">
              {t("kpi.left")}: <b className="tabular-nums">{bytes(Math.max(0, quota - used))}</b>
            </div>
          </div>
          <div className="flex h-3 overflow-hidden bg-muted">
            {(["media", "documents", "audio", "other", "trash"] as const).map((k) => (
              <span key={k} className="h-full transition-all" style={{ width: `${quota > 0 ? Math.min(100, (stats.byKind[k] * scale * 100) / quota) : 0}%`, background: KIND_COLORS[k] }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-2xs">
            {(["media", "documents", "audio", "other", "trash"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-muted-foreground">
                <i className="inline-block size-2.5" style={{ background: KIND_COLORS[k] }} />
                {k === "trash" ? <Term id="trash">{t(`kind.${k}`)}</Term> : t(`kind.${k}`)}
                <b className="font-medium text-foreground tabular-nums">{bytes(stats.byKind[k])}</b>
              </span>
            ))}
          </div>
          <p className="text-3xs text-muted-foreground">{t("storage.note")}</p>
        </div>
      </Panel>
      <KpiGrid cols={4}>
        <Kpi icon={CloudUpload} label={t("storage.uploading")} value={bytes(info?.reservedBytes ?? 0)} sub={t("storage.uploadingSub")} help={t("storage.uploadingHelp")} />
        <Kpi label={t("kpi.files")} value={stats.files.toLocaleString()} help={t("kpiHelp.files")} />
        <Kpi label={t("kpi.media")} value={stats.media.toLocaleString()} sub={bytes(stats.byKind.media)} help={t("kpiHelp.media")} />
        <Kpi label={t("kpi.trash")} value={bytes(stats.byKind.trash)} sub={t("kpi.trashSub", { n: stats.trashItems })} help={t("kpiHelp.trash")} />
      </KpiGrid>
      <Panel title={t("storage.plans")} description={t("storage.plansSub")} help={t("glossary.plan.definition")}>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1 bg-card p-4 ring-1 ring-blau ring-inset">
            <div className="flex items-center justify-between">
              <b className="text-sm">{bytes(quota)}</b>
              <Badge className="bg-blau text-white">{t("storage.currentTag")}</Badge>
            </div>
            <div className="text-2xs text-muted-foreground">{info?.plan === "free" ? t("plan.free", { size: bytes(quota) }) : t("storage.current")}</div>
          </div>
          {PLANS.map((p) => (
            <div key={p.size} className="flex flex-col gap-1 bg-card p-4">
              <b className="text-sm">{p.size}</b>
              <div className="text-xs font-semibold tabular-nums">{t("storage.perMonth", { price: p.month })}</div>
              <div className="text-3xs text-muted-foreground">{t("storage.perYear", { price: p.year })}</div>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 text-2xs text-muted-foreground">{t("storage.buyInApp")}</div>
      </Panel>
    </div>
  );
}

function Fact({ icon: Icon, tone, badge, title, body }: { icon: typeof Lock; tone?: "good" | "warn"; badge: string; title: React.ReactNode; body: string }) {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3.5 last:border-b-0">
      <span className={cn("grid size-8 shrink-0 place-items-center border bg-muted/60", tone === "good" && "border-good/40 text-good", tone === "warn" && "border-warn/40 text-warn")}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <b className="text-xs font-medium">{title}</b>
          <Badge variant="outline" className="ms-auto">
            {badge}
          </Badge>
        </div>
        <p className="mt-0.5 text-2xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

/** Security: what BIShare can and cannot see, and this browser's keys. */
export function SecurityPage() {
  const t = useTranslations("drive");
  const { session, lock } = useDrive();
  return (
    <div className="flex flex-col gap-4">
      <PageHead title={t("nav.security")} sub={t("security.sub")} />
      <ExplainGrid
        items={[
          { icon: Lock, title: t("security.how1Title"), text: t("security.how1") },
          { icon: HardDrive, title: t("security.how2Title"), text: t("security.how2") },
          { icon: KeyRound, title: t("security.how3Title"), text: t("security.how3") },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("security.encryption")} description={t("security.encryptionSub")} help={t("glossary.e2e.definition")}>
          <Fact icon={ShieldCheck} tone="good" badge={t("security.on")} title={<Term id="e2e">{t("security.e2e")}</Term>} body={t("security.e2eBody")} />
          <Fact icon={EyeOff} badge={t("security.hidden")} title={t("security.hiddenWhat")} body={t("security.hiddenBody")} />
          <Fact icon={Check} badge={t("security.visible")} title={t("security.visibleWhat")} body={t("security.visibleBody")} />
        </Panel>
        <Panel title={t("security.browser")} description={session.name} help={t("glossary.browser.definition")}>
          <Fact icon={Monitor} tone={session.stay ? "warn" : "good"} badge={session.stay ? t("security.on") : t("security.off")} title={<Term id="stay">{t("signin.stay")}</Term>} body={session.stay ? t("security.stayOn") : t("security.stayOff")} />
          <div className="flex items-start gap-3 border-b px-4 py-3.5">
            <span className="grid size-8 shrink-0 place-items-center border bg-muted/60">
              <Lock className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <b className="text-xs font-medium">{t("lock")}</b>
              <p className="mt-0.5 text-2xs text-muted-foreground">{t("security.lockBody")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void lock()}>
              {t("lock")}
            </Button>
          </div>
          <Fact icon={KeyRound} badge={t("security.appOnly")} title={<Term id="phrase">{t("security.phrase")}</Term>} body={t("security.phraseBody")} />
          <Fact icon={Trash2} badge={t("security.appOnly")} title={t("security.delete")} body={t("security.deleteBody")} />
        </Panel>
      </div>
    </div>
  );
}
