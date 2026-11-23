import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { publishedPosts } from "@/content/blog/registry";
import { withPage } from "@/i18n/page-context";
import { routing } from "@/i18n/routing";
import { translator } from "@/i18n/translate";
import { BLOG_POST, PAGES, type PageModule } from "@/pages";
import NotFound from "@/pages/not-found";
import { scopeOf } from "@/pages/scopes";
import { feedXml } from "./feed";
import { renderDocument } from "./layout/document";
import { renderDrive } from "./layout/drive-document";
import robots from "./robots";
import sitemap from "./sitemap";
import { robotsTxt, sitemapXml } from "./text-files";

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
    const props = { params: Promise.resolve({ locale, slug }) };
    const html = await withPage(
      locale,
      path,
      async () => renderDocument({ locale, metadata: await module.generateMetadata(props), body: await module.default(props) }),
      scopeOf(path),
    );
    write(path === "/" ? `${locale}.html` : `${locale}${path}.html`, html);
  }
}

for (const [path, load] of Object.entries(PAGES)) await page(path, (await load()) as unknown as PageModule);
for (const post of publishedPosts()) await page(`/blog/${post.slug}`, (await BLOG_POST()) as unknown as PageModule, post.slug);

for (const locale of routing.locales) {
  const html = await withPage(locale, "/404", async () => renderDocument({ locale, metadata: { robots: { index: false } }, body: await NotFound() }));
  write(`${locale}/404.html`, html);
}

for (const locale of routing.locales) {
  await withPage(locale, "/drive", async () => {
    write(`drive/${locale}.html`, await renderDrive(locale, "BIShare Drive", ""));
    write(`drive/${locale}/delete-account.html`, await renderDrive(locale, `${translator("drive")("deletePage.title")} — BIShare Drive`, "/delete-account"));
  });
}

write("sitemap.xml", sitemapXml(sitemap()));
write("robots.txt", robotsTxt(robots()));
write("feed.xml", feedXml());
console.log(`pages: ${count} files`);
