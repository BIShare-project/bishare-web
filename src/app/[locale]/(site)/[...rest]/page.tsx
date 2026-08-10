import { notFound } from "next/navigation";

// Catch-all so any unknown top-level URL renders inside the (site) shell and
// hits the not-found boundary ((site)/not-found.tsx). Named routes and the
// /admin subtree are more specific and always win over this.
export default function SiteCatchAll() {
  notFound();
}
