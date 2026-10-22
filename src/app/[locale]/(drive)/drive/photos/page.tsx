import { PhotosPage } from "@/components/drive/manage";
import { titled } from "../title";

export const generateMetadata = titled("nav.photos");

export default function Page() {
  return <PhotosPage />;
}
