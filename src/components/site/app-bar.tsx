import { getTranslations } from "next-intl/server";
import { AppBarClose } from "./app-bar-close";
import { PlayGlyph, playStoreUrl } from "./store-buttons";
import { buttonVariants } from "./ui/button";

/**
 * The Android twin of Safari's Smart App Banner. iPhones get Apple's banner
 * from the `apple-itunes-app` meta tag on every page; Android has no such
 * thing, and until this bar the only pointer to the Play app was on /transfer
 * and /download. A slim row above the header, in the page flow, so it scrolls
 * away like Apple's. Closed once, it stays closed in that browser.
 */
export async function AppBar() {
  const t = await getTranslations("chrome");
  return (
    // data-nosnippet: site chrome, never a page's search snippet.
    <aside className="app-bar" aria-label={t("nativeApp.barTitle")} data-nosnippet>
      {/* eslint-disable-next-line @next/next/no-img-element -- hidden off Android; lazy keeps it unfetched there */}
      <img src="/logo.svg" alt="" width={36} height={36} loading="lazy" className="shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight">{t("nativeApp.barTitle")}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t("nativeApp.barBody")}</p>
      </div>
      <a
        href={playStoreUrl("app_bar")}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "default", size: "sm", className: "shrink-0" })}
      >
        <PlayGlyph />
        {t("store.googlePlay")}
      </a>
      <AppBarClose label={t("imageClose")} />
    </aside>
  );
}
