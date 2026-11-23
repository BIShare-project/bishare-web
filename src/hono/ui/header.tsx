/** @jsxImportSource hono/jsx */
import type { PropsWithChildren } from "hono/jsx";
import { localizedPath } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getTranslations, type Translator } from "../i18n";
import { pageContext } from "../page-context";
import { Button } from "./button";
import { Icon } from "./icon";
import { LANGUAGES } from "./language-names";
import { Link } from "./link";

const NAV: readonly { href: string; key: string; wide?: boolean; external?: boolean }[] = [
  { href: "/transfer", key: "transfer" },
  { href: "/rooms", key: "rooms" },
  // The web Drive is its own host; "Drive" is the product's name in every language.
  { href: "https://drive.bishare.app", key: "drive", external: true },
  { href: "/features", key: "features" },
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/security", key: "security" },
  // Between lg and xl the bar has no room for these; they stay in the footer and the phone menu.
  { href: "/faq", key: "faq", wide: true },
  { href: "/blog", key: "blog", wide: true },
  { href: "/stats", key: "stats", wide: true },
];

const label = (t: Translator, key: string) => (key === "drive" ? "Drive" : t(`nav.${key}`));

function NavLabel({ t, item }: { t: Translator; item: (typeof NAV)[number] }) {
  return (
    <>
      {label(t, item.key)}
      {item.external ? (
        <span class="ms-1.5 inline-flex items-center rounded-full bg-accent-blue px-1.5 py-px align-middle text-[10px] font-semibold leading-4 tracking-wide text-white">{t("nav.new")}</span>
      ) : null}
    </>
  );
}

function NavLink({ item, class: cls, children }: PropsWithChildren<{ item: (typeof NAV)[number]; class: string }>) {
  return item.external ? (
    <a href={item.href} class={cls}>
      {children}
    </a>
  ) : (
    <Link href={item.href} class={cls}>
      {children}
    </Link>
  );
}

function ThemeToggle({ t, class: extra }: { t: Translator; class: string }) {
  return (
    <button
      type="button"
      data-theme-toggle
      aria-label={t("themeToggleLabel")}
      class={`theme-toggle ${extra} h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-foreground hover:border-[rgba(96,165,250,0.4)] hover:bg-foreground/[0.04] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
    >
      <Icon name="Sun" class="theme-icon-sun h-4 w-4" />
      <Icon name="Moon" class="theme-icon-moon h-4 w-4" />
    </button>
  );
}

/** The menu itself is a <template> (below), opened by client/site.ts: closed, it is not part of the page. */
function LanguageButton({ t, class: extra = "" }: { t: Translator; class?: string }) {
  const { locale } = pageContext();
  return (
    <div class={`relative ${extra}`.trim()} data-language>
      <button
        type="button"
        aria-label={t("changeLanguage")}
        aria-haspopup="listbox"
        aria-expanded="false"
        class="flex h-9 items-center gap-1.5 rounded-lg border border-border-strong px-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Icon name="Globe" class="h-4 w-4" />
        <span class="font-medium">{LANGUAGES[locale]!.short}</span>
      </button>
    </div>
  );
}

function LanguageMenu({ path }: { path: string }) {
  const { locale } = pageContext();
  return (
    <template id="language-menu">
      <div role="listbox" class="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-52 overflow-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/25">
        {routing.locales.map((l) => (
          <a
            role="option"
            aria-selected={l === locale ? "true" : "false"}
            href={localizedPath(l, path)}
            data-locale={l}
            class={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${l === locale ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
          >
            <span class="flex items-center gap-2.5">
              <span aria-hidden="true" class="text-base leading-none">
                {LANGUAGES[l]!.flag}
              </span>
              {LANGUAGES[l]!.name}
            </span>
            {l === locale ? <Icon name="Check" class="h-3.5 w-3.5 text-accent-blue" /> : null}
          </a>
        ))}
      </div>
    </template>
  );
}

const BAR_TOP = "border-b border-border bg-background/80 backdrop-blur-xl";
const BAR_SCROLLED = "bg-transparent px-3 pt-3";
const INNER_TOP = "h-16 max-w-7xl px-6";
const INNER_SCROLLED = "h-14 max-w-7xl rounded-2xl border border-border bg-background/70 px-5 shadow-lg shadow-black/[0.06] ring-1 ring-white/10 backdrop-blur-xl";

/** The site's bar: full width at the top, a floating island once the page scrolls (client/site.ts swaps the classes). */
export async function SiteHeader() {
  const t = await getTranslations("chrome");
  const { path = "/" } = pageContext();
  return (
    <header class={`sticky top-0 z-50 ${BAR_TOP}`} data-site-header data-swap={`${BAR_TOP}|${BAR_SCROLLED}`}>
      <div class={`mx-auto flex items-center justify-between ${INNER_TOP}`} data-swap={`${INNER_TOP}|${INNER_SCROLLED}`}>
        <Link href="/" class="flex shrink-0 items-center gap-2.5">
          <img src="/logo.svg" alt="" width={32} height={32} loading="lazy" decoding="async" class="rounded-lg" />
          <span class="font-semibold text-lg tracking-[-0.02em]">BIShare</span>
        </Link>

        <div class="flex items-center gap-3 lg:gap-6">
          <nav class="hidden lg:flex items-center gap-5">
            {NAV.map((item) => {
              const active = path === item.href;
              return (
                <NavLink item={item} class={`group relative whitespace-nowrap py-1 text-sm ${item.wide ? "hidden xl:block " : ""}${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <NavLabel t={t} item={item} />
                  <span aria-hidden="true" class={`absolute -bottom-0.5 left-1/2 h-px w-4 -translate-x-1/2 rounded-full bg-primary ${active ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`} />
                </NavLink>
              );
            })}
          </nav>

          <LanguageButton t={t} class="hidden lg:block" />
          <ThemeToggle t={t} class="hidden lg:flex" />

          <Button href="/download" size="sm">
            {t("download")}
          </Button>

          <button
            type="button"
            data-menu
            aria-label={t("openMenu")}
            data-label-close={t("closeMenu")}
            aria-expanded="false"
            class="lg:hidden flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-foreground"
          >
            <Icon name="Menu" class="h-4 w-4" />
            <Icon name="X" class="hidden h-4 w-4" />
          </button>
        </div>
      </div>

      <template id="phone-menu">
        <nav class="lg:hidden absolute inset-x-0 top-full border-b border-border bg-background/95 backdrop-blur-xl px-6 py-4">
          <ul class="space-y-1">
            {NAV.map((item) => (
              <li>
                <NavLink item={item} class={`block rounded-xl px-3 py-2.5 text-[15px] ${path === item.href ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"}`}>
                  <NavLabel t={t} item={item} />
                </NavLink>
              </li>
            ))}
          </ul>
          <div class="mt-3 flex items-center justify-between border-t border-[var(--border)] px-3 pt-3">
            <span class="text-[13px] text-muted-foreground">{t("appearance")}</span>
            <div class="flex items-center gap-2">
              <LanguageButton t={t} />
              <ThemeToggle t={t} class="flex" />
            </div>
          </div>
        </nav>
      </template>
      <LanguageMenu path={path} />
    </header>
  );
}
