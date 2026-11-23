import type { Metadata } from "@/site/metadata";
import { getTranslations } from "@/i18n/translate";
import { buildAlternates } from "@/i18n/metadata";
import type { Child } from "@/jsx";
import { Link } from "@/ui/link";
import type { IconComponent } from "@/ui/icons";
import { Clock, Mail, ShieldCheck } from "@/ui/icons";
import { SiteHeader } from "@/ui/header";
import { SiteFooter } from "@/ui/footer";
import { GridBackdrop } from "@/ui/grid-backdrop";
import { SpotlightCard } from "@/ui/spotlight-card";
import { StatusPill } from "@/ui/status-pill";
import { sharedOpenGraph } from "@/lib/og";
import { ContactForm } from "./contact-form";
import { HeroRise } from "@/ui/hero-rise";

const SUPPORT_EMAIL = "cakrabudiman@icloud.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const description = t("metadata.description");
  return {
    title: t("metadata.title"),
    description,
    alternates: buildAlternates(locale, "/contact"),
    ...sharedOpenGraph(t("metadata.ogTitle"), description, "/contact", undefined, locale),
  };
}

function AsideCard({
  icon: Icon,
  title,
  children,
}: {
  icon: IconComponent;
  title: string;
  children: Child;
}) {
  return (
    <SpotlightCard className="p-5" radius={280}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mb-1 text-sm font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </SpotlightCard>
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("contact");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <GridBackdrop pattern="dots" />
          <div className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center md:pt-24 md:pb-16">
            <HeroRise>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-raised px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
                  aria-hidden
                />
                {t("hero.eyebrow")}
              </span>
              <h1 className="mt-6 mb-5 text-[clamp(2.75rem,6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
                {t("hero.title")}
              </h1>
              <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground text-balance">
                {t("hero.subtitle")}
              </p>
              <div className="mt-6 flex justify-center">
                <StatusPill variant="online">
                  {t("hero.statusPill")}
                </StatusPill>
              </div>
            </HeroRise>
          </div>
        </section>

        {/* Form + aside */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-20 md:pb-24">
          <div className="grid items-start gap-6 pt-16 md:pt-20 lg:grid-cols-[1fr_300px] lg:gap-10">
            <div>
              <ContactForm />
            </div>

            <div className="space-y-4">
              <div>
                <AsideCard icon={Mail} title={t("aside.emailTitle")}>
                  {t.rich("aside.emailBody", {
                    email: SUPPORT_EMAIL,
                    link: (chunks) => (
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="break-all text-accent-blue hover:underline underline-offset-2"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </AsideCard>
              </div>
              <div>
                <AsideCard icon={Clock} title={t("aside.responseTitle")}>
                  {t("aside.responseBody")}
                </AsideCard>
              </div>
              <div>
                <AsideCard icon={ShieldCheck} title={t("aside.privacyTitle")}>
                  {t.rich("aside.privacyBody", {
                    link: (chunks) => (
                      <Link
                        href="/privacy"
                        className="text-accent-blue hover:underline underline-offset-2"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </AsideCard>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
