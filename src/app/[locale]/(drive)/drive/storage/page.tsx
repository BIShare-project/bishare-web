import type { Metadata } from "next";
import { StoragePage } from "@/components/drive/manage";

export const metadata: Metadata = { title: "Storage" };

export default function Page() {
  return <StoragePage />;
}
