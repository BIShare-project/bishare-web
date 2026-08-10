import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { sharedOpenGraph } from "@/lib/og";
// Legal editorial shell is shared with /privacy (both routes own the look).
import { LegalToc, type TocItem } from "../privacy/legal-toc";
import {
  LegalContactChannels,
  LegalFooterLinks,
  LegalHero,
  LegalSection,
  LegalTocMobile,
} from "../privacy/legal-kit";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const description = t("terms.metadata.description");
  return {
    title: t("terms.metadata.title"),
    description,
    alternates: buildAlternates(locale, "/terms"),
    ...sharedOpenGraph(t("terms.metadata.ogTitle"), description, "/terms"),
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
  { id: "eligibility", key: "eligibility" },
  { id: "description-of-service", key: "description" },
  { id: "acceptable-use", key: "acceptableUse" },
  { id: "service-limits", key: "limits" },
  { id: "intellectual-property", key: "ip" },
  { id: "privacy", key: "privacy" },
  { id: "disclaimer", key: "disclaimer" },
  { id: "limitation-of-liability", key: "liability" },
  { id: "indemnification", key: "indemnification" },
  { id: "termination", key: "termination" },
  { id: "governing-law", key: "law" },
  { id: "changes", key: "changes" },
  { id: "contact", key: "contact" },
];

/** Bordered emphasis panel for the all-caps legal disclaimers. */
function LegalNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-[13px] leading-relaxed font-medium text-foreground/80">
        {children}
      </p>
    </div>
  );
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const TOC: TocItem[] = SECTION_IDS.map(({ id, key }) => ({
    id,
    label: t(`terms.sections.${key}`),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <LegalHero
          badge={t("shared.badge")}
          title={t("terms.hero.title")}
          dates={[t("terms.hero.effective"), t("terms.hero.updated")]}
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
                    {t("terms.overview.p1")}
                  </p>
                  <p className="mt-3 text-muted-foreground">
                    {t("terms.overview.p2")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="eligibility"
                  title={t("terms.sections.eligibility")}
                >
                  <p className="text-muted-foreground">
                    {t("terms.eligibility.text")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="description-of-service"
                  title={t("terms.sections.description")}
                >
                  <p className="mb-3 text-muted-foreground">
                    {t("terms.description.intro")}
                  </p>
                  <ul className={LIST}>
                    <li>
                      <strong className={TERM}>
                        {t("terms.description.localTerm")}
                      </strong>{" "}
                      {t("terms.description.localDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("terms.description.remoteTerm")}
                      </strong>{" "}
                      {t("terms.description.remoteDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("terms.description.webTerm")}
                      </strong>{" "}
                      {t.rich("terms.description.webDesc", {
                        link: (chunks) => (
                          <a
                            href="https://bishare.app"
                            className="text-accent-blue hover:underline underline-offset-2"
                          >
                            {chunks}
                          </a>
                        ),
                      })}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("terms.description.requestTerm")}
                      </strong>{" "}
                      {t("terms.description.requestDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("terms.description.roomsTerm")}
                      </strong>{" "}
                      {t("terms.description.roomsDesc")}
                    </li>
                  </ul>
                  <p className="mt-3 text-muted-foreground">
                    {t("terms.description.closing")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="acceptable-use"
                  title={t("terms.sections.acceptableUse")}
                >
                  <p className="mb-3 text-muted-foreground">
                    {t("terms.acceptableUse.intro")}
                  </p>
                  <div className={TABLE_WRAP}>
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className={TH}>
                            {t("terms.acceptableUse.colCategory")}
                          </th>
                          <th className={TH}>
                            {t("terms.acceptableUse.colActivity")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {t("terms.acceptableUse.illegalCat")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.acceptableUse.illegalAct")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {t("terms.acceptableUse.malwareCat")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.acceptableUse.malwareAct")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {t("terms.acceptableUse.ipCat")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.acceptableUse.ipAct")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {t("terms.acceptableUse.harassCat")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.acceptableUse.harassAct")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {t("terms.acceptableUse.abuseCat")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.acceptableUse.abuseAct")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {t("terms.acceptableUse.autoCat")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.acceptableUse.autoAct")}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {t("terms.acceptableUse.spamCat")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.acceptableUse.spamAct")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    {t("terms.acceptableUse.closing")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="service-limits"
                  title={t("terms.sections.limits")}
                >
                  <div className={TABLE_WRAP}>
                    <table className="w-full min-w-[440px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className={TH}>{t("terms.limits.colFeature")}</th>
                          <th className={TH}>{t("terms.limits.colLimit")}</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">{t("terms.limits.sizeA")}</td>
                          <td className="px-4 py-3">{t("terms.limits.sizeB")}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">
                            {t("terms.limits.expiryA")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.limits.expiryB")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">
                            {t("terms.limits.linksA")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.limits.linksB")}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">{t("terms.limits.rateA")}</td>
                          <td className="px-4 py-3">{t("terms.limits.rateB")}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">
                            {t("terms.limits.membersA")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.limits.membersB")}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3">
                            {t("terms.limits.filesA")}
                          </td>
                          <td className="px-4 py-3">
                            {t("terms.limits.filesB")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    {t("terms.limits.closing")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="intellectual-property"
                  title={t("terms.sections.ip")}
                >
                  <h3 className={SUBHEAD}>{t("terms.ip.sub1")}</h3>
                  <p className="text-muted-foreground">
                    {t("terms.ip.yourContent")}
                  </p>

                  <h3 className={SUBHEAD}>{t("terms.ip.sub2")}</h3>
                  <p className="text-muted-foreground">{t("terms.ip.ourIp")}</p>
                </LegalSection>

                <LegalSection id="privacy" title={t("terms.sections.privacy")}>
                  <p className="text-muted-foreground">
                    {t.rich("terms.privacy.text", {
                      link: (chunks) => (
                        <Link
                          href="/privacy"
                          className="text-accent-blue hover:underline underline-offset-2"
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </p>
                </LegalSection>

                <LegalSection
                  id="disclaimer"
                  title={t("terms.sections.disclaimer")}
                >
                  <LegalNotice>{t("terms.disclaimer.notice")}</LegalNotice>
                  <p className="mt-3 text-muted-foreground">
                    {t("terms.disclaimer.text")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="limitation-of-liability"
                  title={t("terms.sections.liability")}
                >
                  <LegalNotice>{t("terms.liability.notice")}</LegalNotice>
                </LegalSection>

                <LegalSection
                  id="indemnification"
                  title={t("terms.sections.indemnification")}
                >
                  <p className="text-muted-foreground">
                    {t("terms.indemnification.text")}
                  </p>
                </LegalSection>

                <LegalSection
                  id="termination"
                  title={t("terms.sections.termination")}
                >
                  <ul className={LIST}>
                    <li>
                      <strong className={TERM}>
                        {t("terms.termination.byYouTerm")}
                      </strong>{" "}
                      {t("terms.termination.byYouDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("terms.termination.byUsTerm")}
                      </strong>{" "}
                      {t("terms.termination.byUsDesc")}
                    </li>
                    <li>
                      <strong className={TERM}>
                        {t("terms.termination.effectTerm")}
                      </strong>{" "}
                      {t("terms.termination.effectDesc")}
                    </li>
                  </ul>
                </LegalSection>

                <LegalSection id="governing-law" title={t("terms.sections.law")}>
                  <p className="text-muted-foreground">{t("terms.law.text")}</p>
                </LegalSection>

                <LegalSection id="changes" title={t("terms.sections.changes")}>
                  <p className="text-muted-foreground">
                    {t("terms.changes.text")}
                  </p>
                </LegalSection>

                <LegalSection id="contact" title={t("terms.sections.contact")}>
                  <p className="text-muted-foreground">
                    {t("terms.contact.intro")}
                  </p>
                  <LegalContactChannels />
                </LegalSection>

                <LegalFooterLinks
                  links={[
                    {
                      href: "/privacy",
                      label: t("shared.footer.readNextPrivacy"),
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
