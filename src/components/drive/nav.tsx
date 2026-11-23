import { useSyncExternalStore, type MouseEvent, type Child } from "@/jsx";

// Moving between the Drive's pages without loading the document again: the keys live in this tab's memory.

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let watching = false;

function subscribe(l: () => void): () => void {
  if (!watching && typeof window !== "undefined") {
    watching = true;
    addEventListener("popstate", emit);
  }
  listeners.add(l);
  return () => listeners.delete(l);
}

const href = () => (typeof location === "undefined" ? "" : location.pathname + location.search);

function go(to: string, replace = false) {
  const url = new URL(to, location.href);
  if (url.origin !== location.origin) return location.assign(url);
  if (url.href === location.href) return;
  history[replace ? "replaceState" : "pushState"](null, "", url);
  scrollTo(0, 0);
  emit();
}

const router = { push: (to: string) => go(to), replace: (to: string) => go(to, true), back: () => history.back() };
export const useRouter = () => router;

export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => (typeof location === "undefined" ? "" : location.pathname), () => "");
}

export function useSearchParams(): URLSearchParams {
  useSyncExternalStore(subscribe, href, () => "");
  return new URLSearchParams(typeof location === "undefined" ? "" : location.search);
}

interface Props {
  href: string;
  children?: Child;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  [key: string]: unknown;
}
export function Link({ href: to, onClick, ...rest }: Props) {
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(to);
      }}
    />
  );
}
