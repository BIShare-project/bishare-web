import { LinksPage } from "@/components/drive/links";
import { titled } from "../title";

export const generateMetadata = titled("nav.links");

export default function Page() {
  return <LinksPage />;
}
