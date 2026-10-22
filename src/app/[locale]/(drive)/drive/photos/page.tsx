import type { Metadata } from "next";
import { PhotosPage } from "@/components/drive/manage";

export const metadata: Metadata = { title: "Photos" };

export default function Page() {
  return <PhotosPage />;
}
