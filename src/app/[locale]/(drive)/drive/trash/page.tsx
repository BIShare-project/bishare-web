import { TrashPage } from "@/components/drive/manage";
import { titled } from "../title";

export const generateMetadata = titled("nav.trash");

export default function Page() {
  return <TrashPage />;
}
