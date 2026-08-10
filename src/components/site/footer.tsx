import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { APP_STORE_URL, PLAY_STORE_URL } from "./store-buttons";

const SUPPORT_EMAIL = "support@billiongroup.net";

/**
 * Footer nav data. Labels are resolved from the "chrome" namespace at render
 * time via `labelKey` (`footer.<key>`); the support email is a literal address
 * and stays as `label` (never translated).
 */
const COLUMNS: Array<{
  headingKey: string;
  links: Array<{
    labelKey?: string;
    label?: string;
    href: string;
    external?: boolean;
  }>;
}> = [
  {
    headingKey: "product",
    links: [
      { labelKey: "transfer", href: "/transfer" },
      { labelKey: "download", href: "/download" },
      { labelKey: "features", href: "/features" },
      { labelKey: "howItWorks", href: "/how-it-works" },
      { labelKey: "security", href: "/security" },
      { labelKey: "faq", href: "/faq" },
      { labelKey: "appStore", href: APP_STORE_URL, external: true },
      { labelKey: "googlePlay", href: PLAY_STORE_URL, external: true },
    ],
  },
  {
    headingKey: "useCases",
    links: [
      { labelKey: "ucWindows", href: "/airdrop-for-windows" },
      { labelKey: "ucAlternative", href: "/airdrop-alternative" },
      { labelKey: "ucIphoneAndroid", href: "/send-files-iphone-to-android" },
      { labelKey: "ucAndroidIphone", href: "/send-files-android-to-iphone" },
      { labelKey: "ucPcToPhone", href: "/transfer-files-pc-to-phone" },
      { labelKey: "ucMacWindows", href: "/share-files-mac-to-windows" },
      { labelKey: "ucLargeFiles", href: "/send-large-files" },
      { labelKey: "ucWetransfer", href: "/wetransfer-alternative" },
    ],
  },
  {
    headingKey: "company",
    links: [
      { labelKey: "about", href: "/about" },
      { labelKey: "philosophy", href: "/philosophy" },
      { labelKey: "contact", href: "/contact" },
    ],
  },
  {
    headingKey: "support",
    links: [
      { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
      { labelKey: "privacyPolicy", href: "/privacy" },
      { labelKey: "termsOfService", href: "/terms" },
    ],
  },
];

function FooterLink({
  label,
  href,
  external,
}: {
  label: string;
  href: string;
  external?: boolean;
}) {
  const cls = "hover:text-foreground transition-colors break-all";
  if (external || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={cls}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}

/** Footer — calm: a plain hairline top edge, no backdrops. */
export async function SiteFooter() {
  const t = await getTranslations("chrome");

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-10">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt=""
                width={24}
                height={24}
                className="rounded"
              />
              <span className="font-semibold tracking-[-0.02em]">BIShare</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.headingKey}>
              <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground/80">
                {t(`footer.${col.headingKey}`)}
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink
                      label={link.label ?? t(`footer.${link.labelKey}`)}
                      href={link.href}
                      external={link.external}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-6 h-px bg-border" aria-hidden />
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t("footer.privacyShort")}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t("footer.termsShort")}
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              {t("footer.aboutShort")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
