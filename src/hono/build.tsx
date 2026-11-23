/** @jsxImportSource hono/jsx */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { routing } from "@/i18n/routing";
import { renderDocument } from "./layout/document";
import { withPage } from "./page-context";
import { PAGES, type PageModule } from "./pages";

// Renders every page in every language into <out>/<locale>/<path>.html (the home page: <out>/<locale>.html).

const out = process.argv[2]!;
rmSync(out, { recursive: true, force: true });
let count = 0;
for (const [path, load] of Object.entries(PAGES)) {
  const page = (await load()) as PageModule;
  for (const locale of routing.locales) {
    const html = await withPage(locale, path, async () => {
      const props = { params: Promise.resolve({ locale }) };
      const metadata = await page.generateMetadata(props);
      return renderDocument({ locale, metadata, body: await page.default(props) });
    });
    const file = join(out, path === "/" ? `${locale}.html` : `${locale}${path}.html`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    count++;
  }
}
console.log(`hono pages: ${count} files`);
