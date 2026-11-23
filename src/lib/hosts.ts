import { routing } from "@/i18n/routing";

// The hosts this site answers on, and the paths that belong to one of them. Shared by both engines, so they cannot
// drift. Why the hosts are split: see src/middleware.ts.
export const APEX_HOST = "bishare.app";
export const WWW_HOST = "www.bishare.app";
export const MAIN_HOSTS: ReadonlySet<string> = new Set([APEX_HOST, WWW_HOST]);
export const RECEIVE_HOST = "dl.bishareusercontent.com";
/** The receive host before 2026-10-28: links already shared still point here. */
export const LEGACY_RECEIVE_HOST = "get.bishare.app";
export const DRIVE_HOST = "drive.bishare.app";

const LOCALES = routing.locales.join("|");
/** /drive and everything under it, with or without a locale prefix. */
export const DRIVE_PATH = new RegExp(`^/(?:(?:${LOCALES})/)?drive(?=/|$)`);
/** /transfer/<code>. `/transfer` itself (the send tool) stays on the marketing host. */
export const RECEIVE_PATH = new RegExp(`^/(?:(?:${LOCALES})/)?transfer/[^/]+$`);
/** /d/<id>: a link from someone's Drive. */
export const LINK_PATH = new RegExp(`^/(?:(?:${LOCALES})/)?d/[A-Za-z0-9_-]{22}$`);
