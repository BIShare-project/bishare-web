
/** Where the table of contents goes; client/site.ts lists the page's own headings there. */
export function ArticleToc({ selector = "article.blog-prose h2[id]", label = "On this page" }: { selector?: string; label?: string } = {}) {
  return <div data-toc={selector} data-label={label} />;
}
