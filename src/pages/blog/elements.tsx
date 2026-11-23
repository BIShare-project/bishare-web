import type { Attributes, Child } from "@/jsx";

// What the elements of an article become. Styling comes from the `.blog-prose` block in site.css (scoped, no typography plugin);
// components here add behaviour: heading ids (MDX gives headings none, and
// the sticky TOC + SERP jump-links need server-rendered anchors) and link/img
// semantics.

function textOf(node: Child): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: Child } }).props.children);
  }
  return "";
}

/** "Which method should you use?" → "which-method-should-you-use" */
export function headingId(children: Child): string {
  return textOf(children)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function useMDXComponents(components: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    h2: ({ children, ...rest }: Attributes) => (
      <h2 id={headingId(children)} {...rest}>
        {children}
      </h2>
    ),
    h3: ({ children, ...rest }: Attributes) => (
      <h3 id={headingId(children)} {...rest}>
        {children}
      </h3>
    ),
    // External links open in a new tab; internal links stay same-tab.
    a: ({ href = "", children, ...rest }: Attributes) => {
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
    img: ({ alt = "", ...rest }: Attributes) => (
      <img alt={alt} loading="lazy" decoding="async" {...rest} />
    ),
    ...components,
  };
}
