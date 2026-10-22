"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArchiveRestore, Copy, Download, Eye, FolderInput, FolderOpen, Link2, Pencil, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DriveApiError } from "@/lib/vault/client";
import { FALLBACK_MAX, fetchPlain, IN_PAGE_MAX, saveBlob, streamSave } from "@/lib/vault/download";
import type { DriveObject } from "@/lib/vault/store";
import { buildStoreZip } from "@/lib/zip";
import { useDrive } from "./drive-app";
import { bytes } from "./format";

/** A zip is put together in memory; above this, files are saved one by one. */
const ZIP_MAX = 1024 * 1024 * 1024;

export interface ActionItem {
  key: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
  danger?: boolean;
  shortcut?: string;
  separatorBefore?: boolean;
}

const KNOWN_ERRORS = new Set([
  "STORAGE_LIMIT_EXCEEDED",
  "VAULT_READ_ONLY",
  "VAULT_MOVE_INTO_ITSELF",
  "VAULT_BAD_NAME",
  "VAULT_NOT_IN_TRASH",
  "VAULT_OBJECT_NOT_FOUND",
  "NETWORK",
  "RATE_LIMITED",
]);

export function useActions() {
  const t = useTranslations("drive");
  const router = useRouter();
  const d = useDrive();
  const { base, client, index, ops, uploader, toast, prompt, confirm, pickFolder, view, scope } = d;

  const fail = useCallback(
    (e: unknown) => {
      const code = e instanceof DriveApiError ? e.code : "UNKNOWN";
      if (code === "UNKNOWN") console.error("[drive]", e);
      toast(KNOWN_ERRORS.has(code) ? t(`errors.${code}`) : t("errors.UNKNOWN"), { tone: "error" });
    },
    [t, toast]
  );

  const open = useCallback(
    (o: DriveObject, list?: DriveObject[]) => {
      if (o.kind === "dir") {
        router.push(`${base}/files?f=${o.id}`);
        return;
      }
      const files = (list ?? [o]).filter((x) => x.kind === "file");
      view(
        files.map((x) => x.id),
        Math.max(0, files.findIndex((x) => x.id === o.id))
      );
    },
    [base, router, view]
  );

  const download = useCallback(
    async (objs: DriveObject[]) => {
      if (!objs.length) return;
      try {
        // One file: straight to disk (streamed when large).
        if (objs.length === 1 && objs[0]!.kind === "file") {
          const o = objs[0]!;
          if ((o.size ?? 0) > IN_PAGE_MAX && !o.compression) {
            const ok = await streamSave(client, o, scope, {
              onDone: () => toast(t("toast.saved", { name: o.name }), { tone: "ok" }),
              onError: () => toast(t("errors.download"), { tone: "error" }),
            });
            if (ok) {
              toast(t("toast.downloading", { name: o.name }), { description: bytes(o.size) });
              return;
            }
          }
          // Held whole in the page: too much for a tab above this.
          if ((o.size ?? 0) > FALLBACK_MAX) {
            toast(t("errors.tooLargeHere"), { tone: "error" });
            return;
          }
          toast(t("toast.preparing", { name: o.name }));
          saveBlob(await fetchPlain(client, o), o.name);
          return;
        }
        // Several, or a folder: one zip, folders kept.
        const entries: { o: DriveObject; path: string }[] = [];
        const walk = (o: DriveObject, prefix: string) => {
          if (o.kind === "file") entries.push({ o, path: prefix + o.name });
          else for (const c of index.children(o.id)) walk(c, `${prefix}${o.name}/`);
        };
        for (const o of objs) walk(o, "");
        const total = entries.reduce((a, e) => a + (e.o.size ?? 0), 0);
        if (!entries.length) return;
        if (total > ZIP_MAX) {
          toast(t("errors.zipTooLarge", { size: bytes(ZIP_MAX) }), { tone: "error" });
          return;
        }
        const name = objs.length === 1 ? `${objs[0]!.name}.zip` : "BIShare Drive.zip";
        toast(t("toast.zipping", { n: entries.length, size: bytes(total) }));
        const files: File[] = [];
        for (const e of entries) files.push(new File([await fetchPlain(client, e.o)], e.o.name, { type: e.o.mime, lastModified: e.o.mtimeMs }));
        saveBlob(await buildStoreZip(files, undefined, false, entries.map((e) => e.path)), name);
      } catch (e) {
        fail(e);
      }
    },
    [client, index, scope, t, toast, fail]
  );

  const rename = useCallback(
    async (o: DriveObject) => {
      const name = await prompt({ title: t("dialog.renameTitle"), label: t("dialog.nameLabel"), initial: o.name, confirm: t("act.save") });
      if (!name || name === o.name) return;
      try {
        await ops.rename(o.id, name);
        toast(t("toast.renamed"), { tone: "ok" });
      } catch (e) {
        fail(e);
      }
    },
    [ops, prompt, t, toast, fail]
  );

  const newFolder = useCallback(
    async (parent: string | null) => {
      const name = await prompt({ title: t("dialog.newFolderTitle"), label: t("dialog.folderName"), initial: t("dialog.untitled"), confirm: t("act.create") });
      if (!name) return;
      try {
        await ops.mkdir(name, parent);
        toast(t("toast.folderMade", { name }), { tone: "ok" });
      } catch (e) {
        fail(e);
      }
    },
    [ops, prompt, t, toast, fail]
  );

  const moveOrCopy = useCallback(
    async (ids: string[], mode: "move" | "copy") => {
      const exclude = new Set<string>();
      for (const id of ids) {
        exclude.add(id);
        for (const x of index.descendants(id)) exclude.add(x.id);
      }
      const into = await pickFolder({ title: t(mode === "move" ? "dialog.moveTitle" : "dialog.copyTitle", { n: ids.length }), confirm: t(mode === "move" ? "act.moveHere" : "act.copyHere"), exclude });
      if (into === undefined) return;
      try {
        if (mode === "move") await ops.move(ids, into);
        else await ops.copy(ids, into);
        const where = into ? (index.get(into)?.name ?? "Drive") : "Drive";
        toast(t(mode === "move" ? "toast.moved" : "toast.copied", { n: ids.length, where }), { tone: "ok" });
      } catch (e) {
        fail(e);
      }
    },
    [index, ops, pickFolder, t, toast, fail]
  );

  const trash = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      try {
        await ops.trash(ids);
        toast(t("toast.trashed", { n: ids.length }), {
          action: {
            label: t("act.undo"),
            run: () => void ops.restore(ids).catch(fail),
          },
        });
      } catch (e) {
        fail(e);
      }
    },
    [ops, t, toast, fail]
  );

  const restore = useCallback(
    async (ids: string[]) => {
      try {
        await ops.restore(ids);
        toast(t("toast.restored", { n: ids.length }), { tone: "ok" });
      } catch (e) {
        fail(e);
      }
    },
    [ops, t, toast, fail]
  );

  /** Asks first; true when the items are gone. */
  const deleteForGood = useCallback(
    async (ids: string[]): Promise<boolean> => {
      const ok = await confirm({ title: t("dialog.deleteTitle", { n: ids.length }), body: t("dialog.deleteBody"), confirm: t("act.deleteForever"), danger: true });
      if (!ok) return false;
      try {
        await ops.deleteForGood(ids);
        toast(t("toast.deleted", { n: ids.length }), { tone: "ok" });
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [confirm, ops, t, toast, fail]
  );

  const emptyTrash = useCallback(async () => {
    const n = index.trash().length;
    if (!n) return;
    const ok = await confirm({ title: t("dialog.emptyTitle"), body: t("dialog.emptyBody", { n }), confirm: t("act.emptyTrash"), danger: true });
    if (!ok) return;
    try {
      await ops.emptyTrash();
      toast(t("toast.emptied"), { tone: "ok" });
    } catch (e) {
      fail(e);
    }
  }, [confirm, index, ops, t, toast, fail]);

  const pick = useCallback(
    (parent: string | null, folder: boolean) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      if (folder) input.webkitdirectory = true;
      input.onchange = () => {
        const files = [...(input.files ?? [])];
        if (!files.length) return;
        if (folder) {
          void uploader.addTree(
            files.map((f) => ({ file: f, path: (f.webkitRelativePath || f.name).split("/").slice(0, -1) })),
            parent
          ).catch(fail);
        } else uploader.add(files, parent);
      };
      input.click();
    },
    [uploader, fail]
  );

  /** What can be done with [objs], for the row menu, the right-click menu and the selection bar. */
  const itemsFor = useCallback(
    (objs: DriveObject[], list?: DriveObject[]): ActionItem[] => {
      if (!objs.length) return [];
      const one = objs.length === 1 ? objs[0]! : null;
      const ids = objs.map((o) => o.id);
      const trashed = objs.every((o) => index.inTrash(o));
      if (trashed) {
        return [
          { key: "restore", label: t("act.restore"), icon: ArchiveRestore, run: () => void restore(ids) },
          { key: "delete", label: t("act.deleteForever"), icon: X, danger: true, run: () => void deleteForGood(ids) },
        ];
      }
      const items: ActionItem[] = [];
      if (one) items.push({ key: "open", label: one.kind === "dir" ? t("act.openFolder") : t("act.preview"), icon: one.kind === "dir" ? FolderOpen : Eye, shortcut: "↵", run: () => open(one, list) });
      items.push({ key: "download", label: objs.length > 1 || one?.kind === "dir" ? t("act.downloadZip") : t("act.download"), icon: Download, run: () => void download(objs) });
      if (one) items.push({ key: "link", label: t("act.shareLink"), icon: Link2, run: () => d.shareLink(one) });
      if (one) items.push({ key: "rename", label: t("act.rename"), icon: Pencil, shortcut: "F2", separatorBefore: true, run: () => void rename(one) });
      items.push({ key: "move", label: t("act.move"), icon: FolderInput, separatorBefore: !one, run: () => void moveOrCopy(ids, "move") });
      items.push({ key: "copy", label: t("act.copy"), icon: Copy, run: () => void moveOrCopy(ids, "copy") });
      items.push({ key: "trash", label: t("act.trash"), icon: Trash2, danger: true, shortcut: "⌫", separatorBefore: true, run: () => void trash(ids) });
      return items;
    },
    [index, t, open, download, rename, moveOrCopy, trash, restore, deleteForGood, d]
  );

  return useMemo(
    () => ({
      open,
      download,
      rename,
      newFolder,
      move: (ids: string[]) => moveOrCopy(ids, "move"),
      copy: (ids: string[]) => moveOrCopy(ids, "copy"),
      moveTo: async (ids: string[], into: string | null) => {
        try {
          await ops.move(ids, into);
          toast(t("toast.moved", { n: ids.length, where: into ? (index.get(into)?.name ?? "Drive") : "Drive" }), { tone: "ok" });
        } catch (e) {
          fail(e);
        }
      },
      trash,
      restore,
      deleteForGood,
      emptyTrash,
      upload: (parent: string | null) => pick(parent, false),
      uploadFolder: (parent: string | null) => pick(parent, true),
      itemsFor,
      fail,
    }),
    [open, download, rename, newFolder, moveOrCopy, ops, toast, t, index, fail, trash, restore, deleteForGood, emptyTrash, pick, itemsFor]
  );
}
