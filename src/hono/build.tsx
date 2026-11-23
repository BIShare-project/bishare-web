/** @jsxImportSource hono/jsx */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as feed } from "@/app/feed.xml/route";
import { publishedPosts } from "@/content/blog/registry";
import { routing } from "@/i18n/routing";
import NotFound from "@/app/[locale]/(site)/not-found";
import { robotsTxt, sitemapXml } from "./files";
import { renderDocument } from "./layout/document";
import { withPage } from "./page-context";
import { BLOG_POST, LAYOUTS, PAGES, type LayoutModule, type PageModule } from "./pages";

// Renders every page in every language into <out>/<locale>/<path>.html (the home page: <out>/<locale>.html), the 404
// page of each language into <out>/<locale>/404.html, and the files search engines read into <out>.

const out = process.argv[2]!;
rmSync(out, { recursive: true, force: true });
let count = 0;

function write(name: string, body: string) {
  const file = join(out, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  count++;
}

async function page(path: string, module: PageModule, slug = "") {
  for (const locale of routing.locales) {
    const html = await withPage(locale, path, async () => {
      const props = { params: Promise.resolve({ locale, slug }), searchParams: Promise.resolve({}) };
      const metadata = await module.generateMetadata(props);
      const body = await module.default(props);
      const layout = LAYOUTS[path.split("/")[1] ?? ""];
      return renderDocument({ locale, metadata, body: layout ? await ((await layout()) as LayoutModule).default({ children: body, params: props.params }) : body });
    });
    write(path === "/" ? `${locale}.html` : `${locale}${path}.html`, html);
  }
}

for (const [path, load] of Object.entries(PAGES)) await page(path, (await load()) as unknown as PageModule);
for (const post of publishedPosts()) await page(`/blog/${post.slug}`, (await BLOG_POST()) as unknown as PageModule, post.slug);

for (const locale of routing.locales) {
  const html = await withPage(locale, "/404", async () => renderDocument({ locale, metadata: { robots: { index: false } }, body: await NotFound() }));
  write(`${locale}/404.html`, html);
}

write("sitemap.xml", sitemapXml(sitemap()));
write("robots.txt", robotsTxt(robots()));
write("feed.xml", await feed().text());
console.log(`hono pages: ${count} files`);
