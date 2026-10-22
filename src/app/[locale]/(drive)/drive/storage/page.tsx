import { StoragePage } from "@/components/drive/manage";
import { titled } from "../title";

export const generateMetadata = titled("nav.storage");

export default function Page() {
  return <StoragePage />;
}
