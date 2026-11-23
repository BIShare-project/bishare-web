// Starts the page's islands (src/hono/island.tsx).
import { createElement, render } from "hono/jsx/dom";
import { setMessages } from "./i18n";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any component
type Any = any;

export function startIslands(root: ParentNode = document) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-island]")) {
    const { name, props, locale, messages } = JSON.parse(el.lastElementChild!.textContent!);
    setMessages(locale, messages);
    void import(/* a built file of public/_h */ el.dataset.island!).then((m: Any) => render(createElement(m[name], props), el));
  }
}
