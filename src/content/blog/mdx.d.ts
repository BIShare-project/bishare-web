// An article compiled by scripts/bundle.mjs: a component taking the elements it may replace.
declare module "*.mdx" {
  const Article: (props: { components?: Record<string, unknown> }) => unknown;
  export default Article;
}
