import { getTranslations } from "next-intl/server";
import { Globe, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { brandButton } from "./button-classes";

/**
 * Compact "use the web app now" strip for product/info pages that don't carry
 * the full landing-page CTA stack (download, faq, how-it-works, security,
 * pricing). Reuses the localized labels shipped with the store-buttons work:
 * chrome.store.webApp + related.tryRooms/tryHeading.
 */
export async function WebQuickCta() {
  const chrome = await getTranslations("chrome");
  const related = await getTranslations("related");
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {related("tryHeading")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/transfer" className={brandButton("primary", "md", "px-5")}>
            <Globe className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {chrome("store.webApp")}
            </span>
          </Link>
          <Link href="/rooms" className={brandButton("outline", "md", "px-5")}>
            <Users className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {related("tryRooms")}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
