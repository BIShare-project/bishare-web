import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { RoomsApp } from "@/components/rooms/rooms-app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rooms" });
  const description = t("page.metaDescription");
  return {
    title: t("page.metaTitle"),
    description,
    alternates: buildAlternates(locale, "/rooms"),
    openGraph: {
      title: t("page.metaTitle"),
      description,
      type: "website",
      siteName: "BIShare",
    },
  };
}

/**
 * Rooms — a shared, live space where several people (by code) collect and pull
 * files together over the relay. Cloud-coordinated (RoomDO + WebSocket), so it
 * works across networks; the whole page is the interactive room client.
 */
export default async function RoomsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; mode?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rooms");
  const sp = await searchParams;
  const initialCode = sp.code;
  const initialMode = sp.mode === "local" ? "local" : "cloud";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12 md:py-16">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("page.eyebrow")}
          </p>
          <h1 className="mt-4 text-[clamp(2rem,4.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
            {t("page.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
            {t("page.subtitle")}
          </p>
        </div>

        <div className="mt-9 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <RoomsApp initialCode={initialCode} initialMode={initialMode} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
