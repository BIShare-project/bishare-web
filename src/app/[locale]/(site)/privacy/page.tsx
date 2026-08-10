import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { sharedOpenGraph } from "@/lib/og";
import { LegalToc, type TocItem } from "./legal-toc";
import {
  LegalContactChannels,
  LegalFooterLinks,
  LegalHero,
  LegalSection,
  LegalTocMobile,
} from "./legal-kit";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const description = t("privacy.metadata.description");
  return {
    title: t("privacy.metadata.title"),
    description,
    alternates: buildAlternates(locale, "/privacy"),
    ...sharedOpenGraph(t("privacy.metadata.ogTitle"), description, "/privacy"),
  };
}

const LIST = "ml-5 list-outside list-disc space-y-2 text-muted-foreground marker:text-muted-foreground/50";
const SUBHEAD = "mt-7 mb-2.5 text-base font-semibold";
const TABLE_WRAP = "overflow-x-auto rounded-xl border border-border";
const TH = "px-4 py-3 text-left font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";
const TERM = "font-medium text-foreground";

/** id → sections translation key (labels shared by the TOC and section headings). */
const SECTION_IDS: { id: string; key: string }[] = [
  { id: "overview", key: "overview" },
  { id: "information-we-collect", key: "collect" },
  { id: "how-we-use-information", key: "use" },
  { id: "data-storage-security", key: "storage" },
  { id: "data-retention", key: "retention" },
  { id: "data-sharing", key: "sharing" },
  { id: "your-rights", key: "rights" },
  { id: "childrens-privacy", key: "children" },
  { id: "international-transfers", key: "international" },
  { id: "changes", key: "changes" },
  { id: "contact", key: "contact" },
];

interface RightText {
  title: string;
  desc: string;
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const TOC: TocItem[] = SECTION_IDS.map(({ id, key }) => ({
    id,
    label: t(`privacy.sections.${key}`),
  }));

  const rights = t.raw("privacy.rights.items") as RightText[];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <LegalHero
          badge={t("shared.badge")}
          title={t("privacy.hero.title")}
          dates={[t("privacy.hero.effective"), t("privacy.hero.updated")]}
        />

        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-10 pb-20 md:pb-24 lg:grid-cols-[240px_1fr] lg:gap-16">
            {/* Gradient TOC rail (desktop) */}
            <aside className="hidden lg:block">
              <LegalToc items={TOC} />
            </aside>

            <div className="min-w-0">
              <LegalTocMobile items={TOC} />

              <article className="max-w-3xl text-[15px] leading-[1.75]">
                <LegalSection id="overview">
                  <p className="text-muted-foreground">
                    {t.rich("privacy.overview.p1", {
                      link: (chunks) => (
                        <a
                          href="https://bishare.app"
                          className="text-accent-blue hover:underline underline-offset-2"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </p>
                  <p className="mt-3 text-muted-foreground">
                    {t("privacy.overview.p2")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="information-we-collect"
                  title={t("privacy.sections.collect")}
                >
                  <h3 className={SUBHEAD}>{t("privacy.collect.sub1")}</h3>
                  <ul className={LIST}>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.collect.filesTerm")}
                      </strong>{" "}
                      {t("privacy.collect.filesDesc")}
                    </li>
                  </ul>

                  <h3 className={SUBHEAD}>{t("privacy.collect.sub2")}</h3>
                  <ul className={LIST}>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.collect.deviceTerm")}
                      </strong>{" "}
                      {t("privacy.collect.deviceDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.collect.usageTerm")}
                      </strong>{" "}
                      {t("privacy.collect.usageDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.collect.ipTerm")}
                      </strong>{" "}
                      {t("privacy.collect.ipDesc")}
                    </li>
                  </ul>

                  <h3 className={SUBHEAD}>{t("privacy.collect.sub3")}</h3>
                  <ul className={LIST}>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.collect.localTerm")}
                      </strong>{" "}
                      {t("privacy.collect.localDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.collect.clipTerm")}
                      </strong>{" "}
                      {t("privacy.collect.clipDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.collect.contentTerm")}
                      </strong>{" "}
                      {t("privacy.collect.contentDesc")}
                    </li>
                  </ul>
                </LegalSection>

                <LegalSection
                  id="how-we-use-information"
                  title={t("privacy.sections.use")}
                >
                  <p className="mb-3 text-muted-foreground">
                    {t("privacy.use.intro")}
                  </p>
                  <ul className={LIST}>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.use.provideTerm")}
                      </strong>{" "}
                      {t("privacy.use.provideDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.use.improveTerm")}
                      </strong>{" "}
                      {t("privacy.use.improveDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.use.securityTerm")}
                      </strong>{" "}
                      {t("privacy.use.securityDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.use.communicateTerm")}
                      </strong>{" "}
                      {t("privacy.use.communicateDesc")}
                    </li>
                  </ul>
                </LegalSection>

                <LegalSection
                  id="data-storage-security"
                  title={t("privacy.sections.storage")}
                >
                  <h3 className={SUBHEAD}>{t("privacy.storage.sub1")}</h3>
                  <p className="text-muted-foreground">
                    {t("privacy.storage.encryption")}
                  </p>

                  <h3 className={SUBHEAD}>{t("privacy.storage.sub2")}</h3>
                  <p className="text-muted-foreground">
                    {t("privacy.storage.infrastructure")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="data-retention"
                  title={t("privacy.sections.retention")}
                >
                  <div className={TABLE_WRAP}>
                    <table className="w-full min-w-[440px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className={TH}>{t("privacy.retention.colData")}</th>
                          <th className={TH}>
                            {t("privacy.retention.colPeriod")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">
                            {t("privacy.retention.row1a")}
                          </td>
                          <td className="px-4 py-3">
                            {t("privacy.retention.row1b")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">
                            {t("privacy.retention.row2a")}
                          </td>
                          <td className="px-4 py-3">
                            {t("privacy.retention.row2b")}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3">
                            {t("privacy.retention.row3a")}
                          </td>
                          <td className="px-4 py-3">
                            {t("privacy.retention.row3b")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </LegalSection>

                <LegalSection
                  id="data-sharing"
                  title={t("privacy.sections.sharing")}
                >
                  <p className="mb-3 text-muted-foreground">
                    {t("privacy.sharing.intro")}
                  </p>
                  <ul className={LIST}>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.sharing.providersTerm")}
                      </strong>{" "}
                      {t("privacy.sharing.providersDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("privacy.sharing.legalTerm")}
                      </strong>{" "}
                      {t("privacy.sharing.legalDesc")}
                    </li>
                  </ul>
                </LegalSection>

                <LegalSection
                  id="your-rights"
                  title={t("privacy.sections.rights")}
                >
                  <p className="mb-4 text-muted-foreground">
                    {t("privacy.rights.intro")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {rights.map((right) => (
                      <div
                        key={right.title}
                        className="rounded-xl border border-border bg-card p-4 transition-colors duration-200 hover:bg-background-raised hover:border-border-strong"
                      >
                        <h4 className="mb-1 text-sm font-semibold">
                          {right.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {right.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </LegalSection>

                <LegalSection
                  id="childrens-privacy"
                  title={t("privacy.sections.children")}
                >
                  <p className="text-muted-foreground">
                    {t("privacy.children.text")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="international-transfers"
                  title={t("privacy.sections.international")}
                >
                  <p className="text-muted-foreground">
                    {t("privacy.international.text")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="changes"
                  title={t("privacy.sections.changes")}
                >
                  <p className="text-muted-foreground">
                    {t("privacy.changes.text")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="contact"
                  title={t("privacy.sections.contact")}
                >
                  <p className="text-muted-foreground">
                    {t("privacy.contact.intro")}
                  </p>
                  <LegalContactChannels />
                </LegalSection>

                <LegalFooterLinks
                  links={[
                    {
                      href: "/terms",
                      label: t("shared.footer.readNextTerms"),
                    },
                    { href: "/contact", label: t("shared.footer.contact") },
                  ]}
                />
              </article>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
