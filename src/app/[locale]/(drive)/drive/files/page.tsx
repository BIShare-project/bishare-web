import type { Metadata } from "next";
import { Suspense } from "react";
import { FilesPage } from "@/components/drive/files";

export const metadata: Metadata = { title: "Files" };

export default function Page() {
  // The folder and the search live in the query string.
  return (
    <Suspense>
      <FilesPage />
    </Suspense>
  );
}
