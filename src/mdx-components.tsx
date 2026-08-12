import type { MDXComponents } from "mdx/types";

// App Router MDX hook — required for .mdx imports to render. Styling comes
// from the `.blog-prose` block in site.css (scoped, no typography plugin);
// components here only add behaviour, not look.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
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
