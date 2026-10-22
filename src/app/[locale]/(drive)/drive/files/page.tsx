import { Suspense } from "react";
import { FilesPage } from "@/components/drive/files";
import { titled } from "../title";

export const generateMetadata = titled("nav.files");

export default function Page() {
  // The folder and the search live in the query string.
  return (
    <Suspense>
      <FilesPage />
    </Suspense>
  );
}
