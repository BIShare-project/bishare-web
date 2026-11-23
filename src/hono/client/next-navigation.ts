import { startIslands } from "./islands";

/** The page's content as the server has it now, in place: what is on screen stays until the new content is here. */
async function refresh() {
  const res = await fetch(location.href, { headers: { accept: "text/html" }, cache: "no-store" });
  if (!res.ok) return;
  const fresh = new DOMParser().parseFromString(await res.text(), "text/html").querySelector("main");
  const now = document.querySelector("main");
  if (!fresh || !now) return;
  now.replaceWith(document.adoptNode(fresh));
  startIslands(fresh);
}

/** next/navigation in the browser: these pages are plain documents, so moving on is a full page load. */
const router = {
  push: (href: string) => location.assign(href),
  replace: (href: string) => location.replace(href),
  back: () => history.back(),
  refresh: () => void refresh().catch(() => {}),
  prefetch: () => {},
};
export const useRouter = () => router;

export function notFound(): never {
  throw new Error("notFound() in the browser");
}
