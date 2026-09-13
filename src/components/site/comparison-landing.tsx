import { ArticleLanding } from "@/components/site/article-landing";

/**
 * Thin wrapper kept for the pages that were already on this template. The
 * layout now lives in `ArticleLanding` (blog grid + sticky contents + dated
 * line), so every landing shares one shell; only the message namespace and
 * the comparison truth table differ.
 */
export async function ComparisonLanding({
  namespace,
  slug,
  rows,
}: {
  namespace: string;
  slug: string;
  rows: Array<{ id: string; c1: boolean; c2: boolean; c3: boolean }>;
}) {
  return <ArticleLanding namespace={namespace} slug={slug} rows={rows} />;
}
