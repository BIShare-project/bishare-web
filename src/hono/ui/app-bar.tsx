/** @jsxImportSource hono/jsx */
import { PlayGlyph, playStoreUrl } from "@/components/site/store-buttons";
import { getTranslations } from "../i18n";
import { Icon } from "./icon";

/** See src/components/site/app-bar.tsx: shown on Android only, closed for good once closed. */
export async function AppBar() {
  const t = await getTranslations("chrome");
  return (
    <aside class="app-bar" aria-label={t("nativeApp.barTitle")} data-nosnippet="true">
      <img src="/logo.svg" alt="" width={36} height={36} loading="lazy" class="shrink-0 rounded-lg" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-[13px] font-semibold leading-tight">{t("nativeApp.barTitle")}</p>
        <p class="mt-0.5 text-xs leading-snug text-muted-foreground">{t("nativeApp.barBody")}</p>
      </div>
      <a href={playStoreUrl("app_bar")} target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm shrink-0 gap-2">
        {PlayGlyph({}) as unknown as string}
        {t("store.googlePlay")}
      </a>
      <button
        type="button"
        data-app-bar-close
        aria-label={t("imageClose")}
        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <Icon name="X" class="h-4 w-4" />
      </button>
    </aside>
  );
}
