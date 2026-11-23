/** What a page says about itself to search engines and link previews (layout/head.ts writes it). */
export interface Metadata {
  metadataBase?: URL;
  title?: string | { absolute: string } | { default: string; template: string };
  description?: string;
  manifest?: string;
  keywords?: string | string[];
  authors?: { name?: string; url?: string }[];
  appleWebApp?: { capable?: boolean; title?: string; statusBarStyle?: string };
  alternates?: { canonical?: string; languages?: Record<string, string>; types?: Record<string, string> };
  icons?: { icon?: Icon | Icon[]; apple?: string | Icon | Icon[] };
  openGraph?: OpenGraph;
  twitter?: { card?: string; title?: string; description?: string; site?: string; creator?: string; images?: (string | Picture)[] | string };
  verification?: { google?: string; other?: Record<string, string | string[]> };
  other?: Record<string, string>;
  robots?: string | { index?: boolean; follow?: boolean };
}
interface Icon {
  url: string;
  sizes?: string;
  type?: string;
}
interface Picture {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}
interface OpenGraph {
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  type?: string;
  locale?: string;
  alternateLocale?: string[];
  images?: (string | Picture)[];
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export type Sitemap = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  alternates?: { languages?: Record<string, string> };
}[];

interface RobotsRule {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
}
export interface Robots {
  rules: RobotsRule | RobotsRule[];
  sitemap?: string | string[];
}
