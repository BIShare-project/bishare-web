// The prerendered HTML of a URL path in a folder of pages (<locale>/<path>.html, the home page <locale>.html).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { routing } from "../../src/i18n/routing";

export function htmlFile(root: string, path: string): string | null {
  const [, first = "", ...rest] = path.split("/");
  const prefixed = (routing.locales as readonly string[]).includes(first);
  const locale = prefixed ? first : routing.defaultLocale;
  const page = prefixed ? rest.join("/") : path.slice(1);
  const file = join(root, page ? `${locale}/${page}.html` : `${locale}.html`);
  return existsSync(file) ? file : null;
}
