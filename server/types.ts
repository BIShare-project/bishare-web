/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;

  ROOM_DO: DurableObjectNamespace;
  STREAM_DO: DurableObjectNamespace;
  ANALYTICS_DO: DurableObjectNamespace;
  RATE_LIMITER_DO: DurableObjectNamespace;
  NEARBY_DO: DurableObjectNamespace;
  STATS_LIVE_DO: DurableObjectNamespace;

  /** Self service binding — lets Next route handlers reach the frozen Hono API
   * (same worker) without the self-subrequest loop guard. See src/lib/drive/api.ts. */
  SELF?: Fetcher;
  /** Workers Analytics Engine — additive metrics (F4/B6); absent in some envs. */
  METRICS?: AnalyticsEngineDataset;
  // vars (wrangler.jsonc)
  BASE_URL: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
  APPLE_BUNDLE_ID: string;
  GOOGLE_CLIENT_ID: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: string;
  MAX_FILE_SIZE_FREE: string;
  MAX_FILE_SIZE_PRO: string;
  MAX_FILE_SIZE_BUSINESS: string;
  TRANSFER_MAX_FILE_SIZE: string;
  /** Per-tier transfer caps (v3); TRANSFER_MAX_FILE_SIZE is the legacy free fallback. */
  TRANSFER_MAX_FILE_SIZE_FREE?: string;
  TRANSFER_MAX_FILE_SIZE_PRO?: string;
  TRANSFER_EXPIRY_HOURS: string;
  TRANSFER_RATE_LIMIT_UPLOAD: string;
  TRANSFER_RATE_LIMIT_DOWNLOAD: string;
  ROOM_MAX_MEMBERS: string;
  ROOM_MAX_FILES: string;
  ROOM_MAX_FILE_SIZE: string;
  ROOM_EXPIRY_HOURS: string;
  ROOM_PING_TIMEOUT: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_FROM: string;
  SMTP_TO: string;
  /** Contact-form destination — overrides SMTP_TO (which equals SMTP_FROM, so
   *  provider-dropped self-mail never reaches the inbox). Set via secret. */
  CONTACT_TO?: string;

  // secrets (wrangler secret / .dev.vars)
  JWT_SECRET: string;
  /** Admin panel session cookie signing key (E1); production set at E6. */
  ADMIN_SESSION_SECRET?: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  SMTP_USERNAME: string;
  SMTP_PASSWORD: string;
  /** Transactional email via Resend (production). When set, mailer uses Resend
   * instead of Namecheap SMTP — required for magic-link deliverability. */
  RESEND_API_KEY?: string;
  // IAP (Fase D) — absent until the owner completes P5/P6; verifiers degrade.
  APPLE_IAP_ISSUER_ID?: string;
  APPLE_IAP_KEY_ID?: string;
  APPLE_IAP_PRIVATE_KEY?: string;
  GOOGLE_PLAY_SA_EMAIL?: string;
  GOOGLE_PLAY_SA_KEY?: string;
  GOOGLE_PLAY_PACKAGE?: string;
  /** Contract-recorder seam: mock verifier URL (pola smtp-mock). */
  IAP_VERIFIER_URL_OVERRIDE?: string;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
    userTier: string;
    requestId: string;
  };
};
