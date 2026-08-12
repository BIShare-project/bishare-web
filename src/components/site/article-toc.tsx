"use client";

import { useEffect, useState } from "react";

/**
 * Sticky table of contents for blog articles (desktop right rail) + a thin
 * reading-progress bar under the header. Headings are discovered from the
 * server-rendered DOM (`.blog-prose h2[id]`, emitted by mdx-components), so
 * the TOC can never drift from the article. Scroll-spy via IntersectionObserver.
 */
export function ArticleToc() {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const heads = Array.from(
      document.querySelectorAll<HTMLHeadingElement>("article.blog-prose h2[id]")
    );
    setItems(heads.map((h) => ({ id: h.id, label: h.textContent ?? "" })));

    const io = new IntersectionObserver(
      (entries) => {
        // Highlight the last heading that has crossed the top band.
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[visible.length - 1]!.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    heads.forEach((h) => io.observe(h));

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      {/* Reading progress — fixed hairline under the sticky header. */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent"
      >
        <div
          className="h-full bg-accent-blue transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <nav aria-label="Table of contents" className="text-[13px] leading-snug">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          On this page
        </p>
        <ul className="mt-3 space-y-1 border-l border-border">
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={active === it.id ? "true" : undefined}
                className={`block border-l-2 py-1 pl-3 transition-colors ${
                  active === it.id
                    ? "border-accent-blue font-medium text-foreground"
                    : "-ml-px border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
