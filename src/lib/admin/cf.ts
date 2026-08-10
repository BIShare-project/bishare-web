// Cloudflare bindings access for the admin panel (Next side).
//
// Deliberately structural: the app tsconfig program (DOM lib) must not pull in
// @cloudflare/workers-types globals, so we type only the D1 surface the admin
// code uses and cast getCloudflareContext().env to it. The worker program keeps
// the full typed Env in server/types.ts.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface AdminD1PreparedStatement {
  bind(...values: unknown[]): AdminD1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface AdminD1 {
  prepare(query: string): AdminD1PreparedStatement;
}

// R2 surface the admin panel touches — structural mirror of the runtime
// R2Bucket (see file header for why we don't import workers-types). `delete`
// (E3 mutations) accepts one key or up to 1000; `list` pages through keys
// (≤1000 per call, cursor-driven) for the Files-page bucket scan.
export interface AdminR2Bucket {
  delete(keys: string | string[]): Promise<void>;
  list(options?: { cursor?: string; limit?: number; prefix?: string }): Promise<{
    objects: { key: string; size: number; uploaded: string | Date }[];
    truncated: boolean;
    cursor?: string;
  }>;
}

export interface AdminBindings {
  DB: AdminD1;
  BUCKET: AdminR2Bucket;
  ADMIN_SESSION_SECRET?: string;
  // Read-only deploy/env hints surfaced by the System page (E5). Optional so a
  // plain `next build` (no worker env) still type-checks.
  R2_BUCKET_NAME?: string;
  BASE_URL?: string;
}

export function adminBindings(): AdminBindings {
  return getCloudflareContext().env as unknown as AdminBindings;
}
