import type { Metadata } from "next";
import { DevicesPage } from "@/components/drive/manage";

export const metadata: Metadata = { title: "Devices" };

export default function Page() {
  return <DevicesPage />;
}
