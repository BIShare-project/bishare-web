import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { sharedOpenGraph, SITE_URL } from "@/lib/og";
import { CATEGORY_LABEL, isScheduled, publishedPosts } from "@/content/blog/registry";

/**
 * Blog index. Articles are English-only editorial content — every locale URL
 * renders the same list but canonicalizes to the unprefixed /blog, so the 13
 * locale variants never compete in search (unlike the localized marketing
 * pages, which own their canonicals per locale).
 */

const TITLE = "BIShare Blog — File Transfer Guides & Deep Dives";
const DESCRIPTION =
  "Practical guides to moving files between iPhone, Android, Windows, Mac, and Linux — plus deep dives into the tech and privacy behind fast, secure sharing.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: {
      canonical: "/blog",
      languages: { en: "/blog", "x-default": "/blog" },
    },
    ...sharedOpenGraph(TITLE, DESCRIPTION, "/blog"),
  };
}

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = publishedPosts().sort((a, b) =>
    b.datePublished.localeCompare(a.datePublished)
  );

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    name: "BIShare Blog",
    description: DESCRIPTION,
    url: `${SITE_URL}/blog`,
    publisher: { "@id": `${SITE_URL}/#org` },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.datePublished,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 md:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Blog
        </p>
        <h1 className="mt-4 text-[clamp(2rem,4.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
          File transfer, done properly
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
          {DESCRIPTION}
        </p>

        <div className="mt-10 space-y-5">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-border-strong"
            >
              <article className="grid gap-0 sm:grid-cols-[200px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.hero.src}
                  alt={p.hero.alt}
                  loading="lazy"
                  className="h-full min-h-[120px] w-full object-cover"
                />
                <div className="p-5">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent-blue">
                    {CATEGORY_LABEL[p.category]}
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold leading-snug tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4">
                    {p.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <p className="mt-3 text-[12px] text-muted-foreground">
                    {DATE_FMT.format(new Date(p.datePublished))} ·{" "}
                    {p.readMinutes} min read
                    {isScheduled(p) && (
                      <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                        Scheduled
                      </span>
                    )}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
