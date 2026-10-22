import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// An unknown Drive address goes back to the Drive's overview. Without this
// route it would fall to the site's catch-all, whose page registers the site's
// service worker over the Drive's streaming one.
export default async function DriveCatchAll({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const root = (await headers()).get("x-drive-base") === "root";
  redirect(root ? "/" : `${locale === routing.defaultLocale ? "" : `/${locale}`}/drive`);
}
