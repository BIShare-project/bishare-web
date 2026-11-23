import { getTranslations } from "@/i18n/translate";
import { Link } from "./link";

/** A notice, not a consent gate: the only cookie is the language. Shown once, when the browser is idle (client/site.ts). */
export async function CookieNotice() {
  const t = await getTranslations("cookies");
  return (
    <template id="cookie-notice">
      <div role="region" aria-label="Cookie notice" class="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:gap-4 sm:pl-5">
        <p class="text-[13px] leading-relaxed text-muted-foreground">
          {t("body")}{" "}
          <Link href="/privacy" class="font-medium text-foreground underline underline-offset-2">
            {t("learnMore")}
          </Link>
        </p>
        <button type="button" class="shrink-0 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:opacity-90">
          {t("accept")}
        </button>
      </div>
    </template>
  );
}
