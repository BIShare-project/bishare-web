/**
 * What running BIShare costs, computed from our own measured usage and
 * Cloudflare's published prices.
 *
 * This is a CALCULATION, not a bill. The site has no access to the account's
 * billing API, so /stats says "estimated" and links the price list rather than
 * implying these are invoiced figures.
 *
 * Rates verified against Cloudflare's own docs on 2026-09-23:
 *   R2       https://developers.cloudflare.com/r2/pricing/
 *   Workers  https://developers.cloudflare.com/workers/platform/pricing/
 */

/** R2 Standard storage, per GB-month. */
export const R2_STORAGE_PER_GB_MONTH = 0.015;
/** R2 bills nothing for data leaving to the internet. This is why BIShare is free. */
export const R2_EGRESS_PER_GB = 0;
/** R2 Standard free tier, in GB-month. */
export const R2_FREE_GB_MONTH = 10;
/** Workers Paid base fee, per account per month. Includes 10M requests. */
export const WORKERS_BASE_MONTHLY = 5;

const GB = 1_000_000_000; // Cloudflare bills in decimal GB, not GiB

export interface InfraCost {
  storedGb: number;
  /** Billable storage after the free tier. */
  billableGb: number;
  storage: number;
  workers: number;
  egress: number;
  total: number;
}

/**
 * Cost of a month at today's stored volume. A run rate, not a forecast:
 * transfers expire after 6–24 hours, so the stored figure swings day to day
 * and this number swings with it.
 */
export function monthlyInfraCost(storedBytes: number): InfraCost {
  const storedGb = storedBytes / GB;
  const billableGb = Math.max(0, storedGb - R2_FREE_GB_MONTH);
  const storage = billableGb * R2_STORAGE_PER_GB_MONTH;
  return {
    storedGb,
    billableGb,
    storage,
    workers: WORKERS_BASE_MONTHLY,
    egress: 0,
    total: storage + WORKERS_BASE_MONTHLY,
  };
}
