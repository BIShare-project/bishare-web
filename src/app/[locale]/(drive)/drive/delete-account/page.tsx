import type { Metadata } from "next";
import { headers } from "next/headers";
import { DeleteAccountPage } from "@/components/drive/delete-account";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { title: "Delete your Drive" };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const root = (await headers()).get("x-drive-base") === "root";
  return <DeleteAccountPage base={root ? "" : `${locale === routing.defaultLocale ? "" : `/${locale}`}/drive`} />;
}
