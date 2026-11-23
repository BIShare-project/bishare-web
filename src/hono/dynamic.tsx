/** @jsxImportSource hono/jsx */
import type { Metadata } from "next";
import * as DriveLinkPage from "@/app/[locale]/(site)/d/[id]/page";
import DriveLinkLayout from "@/app/[locale]/(site)/d/layout";
import * as StatsPage from "@/app/[locale]/(site)/stats/page";
import * as TransferPage from "@/app/[locale]/(site)/transfer/[code]/page";
import TransferLayout from "@/app/[locale]/(site)/transfer/layout";
import { bumpStat } from "@/lib/stats-bump";
import { renderDocument } from "./layout/document";
import { withPage } from "./page-context";
import { withRequest } from "./request-context";

// The pages that cannot be built ahead of time: their content is read when they are asked for.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pages with different props
type Any = any;
interface Route {
  pattern: RegExp;
  page: { default: (p: Any) => unknown; generateMetadata: (p: Any) => Promise<Metadata> };
  layout?: (p: Any) => unknown;
  params: (m: RegExpExecArray) => Record<string, string>;
}

const ROUTES: Route[] = [
  { pattern: /^\/stats$/, page: StatsPage, params: () => ({}) },
  { pattern: /^\/transfer\/([^/]+)$/, page: TransferPage, layout: TransferLayout, params: (m) => ({ code: decode(m[1]!) }) },
  { pattern: /^\/d\/([^/]+)$/, page: DriveLinkPage, layout: DriveLinkLayout, params: (m) => ({ id: decode(m[1]!) }) },
];

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** The HTML of the page at `path` (without its language), or null when none of these pages is there. */
export async function renderDynamic(path: string, locale: string, env: object, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<string | null> {
  for (const route of ROUTES) {
    const m = route.pattern.exec(path);
    if (!m) continue;
    return withRequest(env, ctx, () =>
      withPage(locale, path, async () => {
        const props = { params: Promise.resolve({ locale, ...route.params(m) }), searchParams: Promise.resolve({}) };
        const metadata = await route.page.generateMetadata(props);
        const body = await route.page.default(props);
        return renderDocument({ locale, metadata, body: route.layout ? await route.layout({ children: body, params: props.params }) : body });
      }),
    );
  }
  return null;
}

/** Counters the pages send as beacons (src/lib/loop.ts). */
const BEACONS: Record<string, string> = { "/api/loop-done": "loop_completed", "/api/loop-visit": "loop_sends", "/api/receive-open": "receive_opens" };

/** The site's own small endpoints, on every host. Null when the path is not one of them. */
export function api(req: Request, env: object, ctx: { waitUntil(p: Promise<unknown>): void }): Response | null {
  const { pathname } = new URL(req.url);
  const metric = BEACONS[pathname];
  if (metric) {
    if (req.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
    withRequest(env, ctx, () => bumpStat(metric));
    return new Response(null, { status: 204 });
  }
  // The share target: the service worker answers it; without one in control the person still lands on the tool.
  if (pathname === "/api/share-target" && (req.method === "POST" || req.method === "GET")) {
    return new Response(null, { status: req.method === "POST" ? 303 : 307, headers: { location: new URL("/transfer", req.url).href } });
  }
  return null;
}
