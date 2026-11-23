"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { DeleteAccountPage } from "./delete-account";
import { DriveApp } from "./drive-app";
import { FilesPage, RecentPage } from "./files";
import { HomePage } from "./home";
import { LinksPage } from "./links";
import { DevicesPage, PhotosPage, SecurityPage, StoragePage, TrashPage } from "./manage";
import { usePathname, useRouter } from "./nav";

// The whole web Drive: which page an address shows, inside the app that holds the session.

const PAGES: Record<string, { title?: string; page: () => unknown }> = {
  "": { page: () => <HomePage /> },
  "/files": { title: "nav.files", page: () => <FilesPage /> },
  "/recent": { title: "nav.recent", page: () => <RecentPage /> },
  "/photos": { title: "nav.photos", page: () => <PhotosPage /> },
  "/links": { title: "nav.links", page: () => <LinksPage /> },
  "/devices": { title: "nav.devices", page: () => <DevicesPage /> },
  "/trash": { title: "nav.trash", page: () => <TrashPage /> },
  "/storage": { title: "nav.storage", page: () => <StoragePage /> },
  "/security": { title: "nav.security", page: () => <SecurityPage /> },
};

export function DriveSite({ base, path: first }: { base: string; path?: string }) {
  const t = useTranslations("drive");
  const router = useRouter();
  const path = usePathname() || `${base}${first ?? ""}`;
  const here = path.slice(base.length).replace(/\/$/, "");
  const deleting = here === "/delete-account";
  const page = PAGES[here];
  const title = deleting ? "deletePage.title" : page?.title;
  useEffect(() => {
    document.title = title ? `${t(title as never)} — BIShare Drive` : "BIShare Drive";
    // An address the Drive does not have goes to its overview.
    if (!page && !deleting) router.replace(base || "/");
  }, [title, !page && !deleting]);
  return <DriveApp base={base} open={deleting}>{deleting ? <DeleteAccountPage base={base} /> : ((page?.page() ?? null) as never)}</DriveApp>;
}
