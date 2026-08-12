import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { StoreButtons } from "@/components/site/store-buttons";
import { VButton } from "@/components/site/vbutton";
import { sharedOpenGraph, SITE_URL } from "@/lib/og";
import {
  ARTICLE_COMPONENTS,
  CATEGORY_LABEL,
  getPost,
  publishedSlugs,
  POSTS,
} from "@/content/blog/registry";
import { ArrowRight } from "lucide-react";
import { ArticleToc } from "@/components/site/article-toc";

/**
 * Article template. The body is an .mdx component; everything SEO-bearing
 * around it (metadata, BlogPosting + BreadcrumbList + FAQPage JSON-LD, the
 * on-page FAQ, related posts, product CTA) renders from the registry so the
 * structured data can never drift from the visible page. English-only content:
 * every locale URL canonicalizes to the unprefixed /blog/<slug>.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const path = `/blog/${post.slug}`;
  return {
    title: { absolute: post.metaTitle },
    description: post.description,
    alternates: {
      canonical: path,
      languages: { en: path, "x-default": path },
    },
    ...sharedOpenGraph(post.metaTitle, post.description, path),
  };
}

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPost(slug);
  const load = ARTICLE_COMPONENTS[slug];
  if (!post || !load) notFound();

  const { default: Article } = await load();
  const url = `${SITE_URL}/blog/${post.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}${post.hero.src}`,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    inLanguage: "en",
    url,
    mainEntityOfPage: url,
    author: { "@id": `${SITE_URL}/#org` },
    publisher: { "@id": `${SITE_URL}/#org` },
    keywords: post.keywords.join(", "),
    articleSection: CATEGORY_LABEL[post.category],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 2, name: post.title, item: url },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const related = post.related
    .filter((s) => publishedSlugs.has(s))
    .map((s) => POSTS.find((p) => p.slug === s)!)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {[articleLd, breadcrumbLd, faqLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ld).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl lg:mx-0 lg:max-w-none lg:grid lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-12">
        <div className="min-w-0 lg:max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span>{CATEGORY_LABEL[post.category]}</span>
        </nav>

        <h1 className="mt-4 text-[clamp(1.9rem,4.2vw,2.6rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-balance">
          {post.title}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 text-[13.5px] text-muted-foreground">
          <span>BIShare Team</span>
          <span aria-hidden>·</span>
          <time dateTime={post.datePublished}>
            {DATE_FMT.format(new Date(post.datePublished))}
          </time>
          <span aria-hidden>·</span>
          <span>{post.readMinutes} min read</span>
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.hero.src}
          alt={post.hero.alt}
          className="mt-7 w-full rounded-2xl border border-border"
        />

        <article className="blog-prose mt-9">
          <Article />
        </article>

        {/* FAQ — rendered from the registry, mirrored 1:1 by the FAQPage JSON-LD */}
        <section aria-labelledby="faq-heading" className="mt-14">
          <h2
            id="faq-heading"
            className="text-2xl font-semibold tracking-[-0.02em]"
          >
            Frequently asked questions
          </h2>
          <div className="mt-5 space-y-3">
            {post.faq.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card p-5"
              >
                <summary className="cursor-pointer list-none font-medium marker:content-['']">
                  {f.q}
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Product CTA */}
        <section className="mt-14 rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            Move your next file the fast way
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            BIShare sends files device-to-device on your Wi-Fi — end-to-end
            encrypted, no account, no size games. Or share a link that opens in
            any browser.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <VButton href="/transfer" size="lg">
              Try it in your browser
              <ArrowRight className="h-4 w-4" />
            </VButton>
            <VButton href="/download" size="lg" variant="secondary">
              Get the app
            </VButton>
          </div>
          <div className="mt-5 flex justify-center">
            <StoreButtons />
          </div>
        </section>

        {/* Tags */}
        <p className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-[12px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </p>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Keep reading
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="block rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium transition-colors hover:border-border-strong"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>

        {/* Sticky TOC — desktop only; discovers server-rendered heading ids. */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ArticleToc />
          </div>
        </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
