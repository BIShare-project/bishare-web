/**
 * Message namespaces the islands of some pages also get, by first path segment: for parts that only show after something
 * happens in the browser.
 */
export const SCOPES: Record<string, readonly string[]> = {
  "": ["beam", "nearby", "tool"],
  "airdrop-online": ["nearby"],
  contact: ["contact"],
  d: ["flows"],
  download: ["download"],
  features: ["features"],
  privacy: ["legal"],
  rooms: ["rooms"],
  terms: ["legal"],
  transfer: ["beam", "flows", "nearby", "tool"],
  "wifi-file-transfer": ["nearby"],
};
export const scopeOf = (path: string) => SCOPES[path.split("/")[1] ?? ""] ?? [];
