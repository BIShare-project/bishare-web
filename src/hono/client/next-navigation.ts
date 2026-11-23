/** next/navigation in the browser: these pages are plain documents, so moving on is a full page load. */
export function useRouter() {
  return {
    push: (href: string) => location.assign(href),
    replace: (href: string) => location.replace(href),
    back: () => history.back(),
    refresh: () => location.reload(),
    prefetch: () => {},
  };
}

export function notFound(): never {
  throw new Error("notFound() in the browser");
}
