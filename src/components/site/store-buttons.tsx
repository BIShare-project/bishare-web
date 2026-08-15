import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { brandButton } from "./button-classes";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/bishare-file-transfer/id6760924092";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.bishare.app";

export function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 fill-current", className)} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 fill-current", className)} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm.91-.91L19.94 12l-2.22-2.21-2.43 2.43 2.43 2.43zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
    </svg>
  );
}

/**
 * App Store (primary) + Google Play (outline) buttons, plus the no-install
 * path: a "use in browser" link straight into the web app at /transfer —
 * every landing page that shows the stores also offers the instant route.
 * For an OS-aware version use <DownloadCTA /> instead.
 */
export function StoreButtons({ className }: { className?: string }) {
  const t = useTranslations("chrome");
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={brandButton("primary", "md", "px-5")}
      >
        <AppleGlyph />
        <span className="text-sm font-semibold">{t("store.appStore")}</span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={brandButton("outline", "md", "px-5")}
      >
        <PlayGlyph />
        <span className="text-sm font-semibold">{t("store.googlePlay")}</span>
      </a>
      <Link href="/transfer" className={brandButton("outline", "md", "px-5")}>
        <Globe className="h-4 w-4" />
        <span className="text-sm font-semibold">{t("store.webApp")}</span>
      </Link>
    </div>
  );
}
