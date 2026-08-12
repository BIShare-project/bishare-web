import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

// App Router MDX hook — required for .mdx imports to render. Styling comes
// from the `.blog-prose` block in site.css (scoped, no typography plugin);
// components here add behaviour: heading ids (mdxRs has no rehype-slug, and
// the sticky TOC + SERP jump-links need server-rendered anchors) and link/img
// semantics.

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/** "Which method should you use?" → "which-method-should-you-use" */
export function headingId(children: ReactNode): string {
  return textOf(children)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...rest }) => (
      <h2 id={headingId(children)} {...rest}>
        {children}
      </h2>
    ),
    h3: ({ children, ...rest }) => (
      <h3 id={headingId(children)} {...rest}>
        {children}
      </h3>
    ),
    // External links open in a new tab; internal links stay same-tab.
    a: ({ href = "", children, ...rest }) => {
      const external = /^https?:\/\//.test(href) && !href.startsWith("https://bishare.app");
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...rest}
        >
          {children}
        </a>
      );
    },
    // Blog images are static assets — explicit lazy loading, full-width.
    img: ({ alt = "", ...rest }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} loading="lazy" decoding="async" {...rest} />
    ),
    ...components,
  };
}
