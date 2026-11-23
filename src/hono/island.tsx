/** @jsxImportSource hono/jsx */
import { raw } from "hono/html";
import { ASSETS } from "./assets.gen";
import { messagesOf } from "./i18n";
import { pageContext, withNamespaces } from "./page-context";

// A component with behaviour inside a page built ahead of time: its first look is in the HTML, and the browser loads its
// code (compiled for hono/jsx/dom, no React) only on the pages that have it. See scripts/hono-bundle.mjs.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any component's props
type Any = any;

export function island(file: string, name: string, Component: Any) {
  return async (props: Any) => {
    if (pageContext().inIsland) return <Component {...props} />;
    if ([props.children ?? []].flat().length) throw new Error(`island ${file} ${name}: children cannot be sent to the browser`);
    const namespaces = new Set<string>(pageContext().scope);
    const html = await withNamespaces(namespaces, async () => (await (<Component {...props} />).toString()) as string);
    const src = ASSETS.islands[file];
    if (!src) throw new Error(`island ${file} is not built: run scripts/build-hono-assets.mjs`);
    const { children: _none, ...sent } = props;
    const data = JSON.stringify({ name, props: sent, locale: pageContext().locale, messages: messagesOf([...namespaces]) });
    return (
      <div data-island={src} style="display:contents">
        {raw(html)}
        <script type="application/json">{raw(data.replace(/</g, "\\u003c"))}</script>
      </div>
    );
  };
}
