import { getTranslations } from "@/i18n/translate";
import { Home, Send } from "@/ui/icons";
import { SiteHeader } from "@/ui/header";
import { Button } from "@/ui/button";

/**
 * 404 in the Geist system: monochrome, hairline-bordered shell, a giant
 * near-black/near-white "404", and the two invert/secondary actions.
 *
 * not-found.tsx receives no params, so the active locale comes from the
 * request config (resolved by the [locale] segment) rather than a prop.
 */
export default async function NotFound() {
  const t = await getTranslations("flows");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <p
            aria-hidden
            className="select-none font-mono text-[clamp(6rem,20vw,11rem)] font-semibold leading-none tracking-[-0.03em] text-foreground"
          >
            404
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
            {t("notFound.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("notFound.body")}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="/" size="md">
              <Home className="h-4 w-4" />
              {t("notFound.backHome")}
            </Button>
            <Button href="/transfer" variant="secondary" size="md">
              <Send className="h-4 w-4" />
              {t("notFound.sendFile")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
