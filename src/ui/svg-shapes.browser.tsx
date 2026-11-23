
/** hono/jsx refuses raw HTML directly in an <svg>. */
export const Shapes = ({ html }: { html: string }) => <g dangerouslySetInnerHTML={{ __html: html }} />;
