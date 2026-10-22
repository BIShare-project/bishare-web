import { DevicesPage } from "@/components/drive/manage";
import { titled } from "../title";

export const generateMetadata = titled("nav.devices");

export default function Page() {
  return <DevicesPage />;
}
