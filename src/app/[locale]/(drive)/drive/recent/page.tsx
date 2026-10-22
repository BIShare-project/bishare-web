import { RecentPage } from "@/components/drive/files";
import { titled } from "../title";

export const generateMetadata = titled("nav.recent");

export default function Page() {
  return <RecentPage />;
}
