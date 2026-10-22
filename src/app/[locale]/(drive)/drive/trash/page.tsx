import type { Metadata } from "next";
import { TrashPage } from "@/components/drive/manage";

export const metadata: Metadata = { title: "Trash" };

export default function Page() {
  return <TrashPage />;
}
