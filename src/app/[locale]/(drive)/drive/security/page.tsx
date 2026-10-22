import { SecurityPage } from "@/components/drive/manage";
import { titled } from "../title";

export const generateMetadata = titled("nav.security");

export default function Page() {
  return <SecurityPage />;
}
