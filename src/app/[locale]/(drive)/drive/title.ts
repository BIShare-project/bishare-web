import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** A Drive page's tab title, in the page's language. */
export function titled(key: string) {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "drive" });
    return { title: t(key as never) };
  };
}
