import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation helpers. Prefer these over next/link + next/navigation
 * inside the MARKETING ((site)) subtree so internal links carry the active
 * locale automatically under the "as-needed" prefix scheme (en stays
 * unprefixed, other locales gain their "/<locale>" prefix).
 *
 *   import { Link, redirect, usePathname, getPathname } from "@/i18n/navigation";
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
