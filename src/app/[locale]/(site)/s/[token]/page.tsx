import { permanentRedirect } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * Compatibility redirect: the API mounts public shares at /s/:token, so
 * anyone copying an API-style path onto bishare.app lands here instead of
 * a 404. The canonical web page is /share/[token].
 */
export default async function ShareShortRedirect({ params }: Props) {
  const { token } = await params;
  permanentRedirect(`/share/${encodeURIComponent(token)}`);
}
