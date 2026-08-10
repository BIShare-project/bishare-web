import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";

/**
 * Contextual cross-links between the SEO landing pages. Each page previously
 * linked only to /download + /how-it-works, leaving the 14 landing pages with
 * no sibling interlinking (and 6 of them orphaned). This block interlinks them
 * into topic clusters so link equity flows between related guides and every
 * page has inbound internal links. Labels come from the "related" namespace.
 */

// slug (without leading slash) → curated related siblings.
const CLUSTER: Record<string, string[]> = {
  "airdrop-for-windows": ["airdrop-alternative", "airdrop-for-android", "share-files-mac-to-windows", "send-large-files"],
  "airdrop-for-android": ["airdrop-alternative", "airdrop-for-windows", "send-files-iphone-to-android", "nearby-share-alternative"],
  "airdrop-alternative": ["airdrop-for-windows", "airdrop-for-android", "send-files-iphone-to-android", "wetransfer-alternative"],
  "wetransfer-alternative": ["send-large-files", "firefox-send-alternative", "smash-alternative", "share-files-without-account"],
  "snapdrop-alternative": ["sharedrop-alternative", "nearby-share-alternative", "wormhole-alternative", "shareit-alternative"],
  "sharedrop-alternative": ["snapdrop-alternative", "nearby-share-alternative", "shareit-alternative", "wetransfer-alternative"],
  "nearby-share-alternative": ["shareit-alternative", "snapdrop-alternative", "send-anywhere-alternative", "airdrop-alternative"],
  "shareit-alternative": ["nearby-share-alternative", "send-anywhere-alternative", "sharedrop-alternative", "send-large-files"],
  "send-files-iphone-to-android": ["send-files-android-to-iphone", "airdrop-alternative", "airdrop-for-android", "transfer-files-pc-to-phone"],
  "send-files-android-to-iphone": ["send-files-iphone-to-android", "nearby-share-alternative", "airdrop-alternative", "transfer-files-phone-to-pc"],
  "transfer-files-pc-to-phone": ["transfer-files-phone-to-pc", "share-files-mac-to-windows", "send-large-files", "airdrop-for-windows"],
  "transfer-files-phone-to-pc": ["transfer-files-pc-to-phone", "share-files-mac-to-windows", "send-large-files", "send-files-android-to-iphone"],
  "share-files-mac-to-windows": ["airdrop-for-windows", "transfer-files-pc-to-phone", "send-large-files", "wetransfer-alternative"],
  "send-large-files": ["wetransfer-alternative", "send-files-without-internet", "encrypted-file-transfer", "share-files-without-account"],
  // New: encrypted / competitor pages.
  "firefox-send-alternative": ["encrypted-file-transfer", "send-anywhere-alternative", "wormhole-alternative", "wetransfer-alternative"],
  "encrypted-file-transfer": ["share-files-without-account", "send-files-without-internet", "firefox-send-alternative", "send-large-files"],
  "send-anywhere-alternative": ["shareit-alternative", "nearby-share-alternative", "wetransfer-alternative", "firefox-send-alternative"],
  "share-files-without-account": ["encrypted-file-transfer", "wetransfer-alternative", "send-large-files", "firefox-send-alternative"],
  "smash-alternative": ["wetransfer-alternative", "send-large-files", "wormhole-alternative", "firefox-send-alternative"],
  "wormhole-alternative": ["firefox-send-alternative", "encrypted-file-transfer", "snapdrop-alternative", "wetransfer-alternative"],
  "send-files-without-internet": ["encrypted-file-transfer", "share-files-without-account", "send-large-files", "nearby-share-alternative"],
};

export async function RelatedLinks({ current }: { current: string }) {
  const t = await getTranslations("related");
  const siblings = CLUSTER[current] ?? [];
  if (siblings.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {t("heading")}
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {siblings.map((slug) => (
          <li key={slug}>
            <Link
              href={`/${slug}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-background-raised"
            >
              <span className="text-sm font-medium">{t(`links.${slug}`)}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-blue" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
