import type { Metadata } from "next";
import { routing } from "./routing";

/**
 * Build the localized URL path for a marketing route under the "as-needed"
 * prefix scheme. The default locale (`en`) stays unprefixed; every other
 * locale gets its "/<locale>" prefix.
 *
 *   localizedPath("en", "/features")   -> "/features"
 *   localizedPath("id", "/features")   -> "/id/features"
 *   localizedPath("id", "/")           -> "/id"
 */
export function localizedPath(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  if (locale === routing.defaultLocale) return clean === "" ? "/" : clean;
  return `/${locale}${clean}`;
}

/**
 * Per-locale `alternates` (canonical + hreflang languages) for a marketing
 * page's metadata. Paths are relative — Next resolves them against the
 * `metadataBase` (https://bishare.app) declared on the (site) layout.
 *
 * The canonical is SELF-referencing per locale: `/id/features` canonicalizes to
 * itself, not to the English `/features`. A canonical pointing at a different
 * URL overrides hreflang, so a shared English canonical made Google treat every
 * localized page as a duplicate of English and drop the 12 non-default locales
 * from the index — pass the current `locale` so each page owns its canonical.
 *
 *   export async function generateMetadata({ params }) {
 *     const { locale } = await params;
 *     return { title: "Features", alternates: buildAlternates(locale, "/features"), ... };
 *   }
 */
export function buildAlternates(
  locale: string,
  path: string
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = localizedPath(loc, path);
  }
  // x-default points at the unprefixed (default-locale) URL.
  languages["x-default"] = localizedPath(routing.defaultLocale, path);

  return {
    canonical: localizedPath(locale, path),
    languages,
  };
}
