import type { Metadata } from "next";
import { RecentPage } from "@/components/drive/files";

export const metadata: Metadata = { title: "Recent" };

export default function Page() {
  return <RecentPage />;
}
