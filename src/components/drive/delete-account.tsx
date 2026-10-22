"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreditCard, Mail, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { BrandMark } from "./shell";
import { Button } from "./ui/button";

/**
 * How to delete a BIShare Drive (drive-plan.md task 6.6; Google Play asks for
 * a page reachable without the app). Open to anyone, no sign-in.
 */
export function DeleteAccountPage({ base }: { base: string }) {
  const t = useTranslations("drive");
  const steps = [t("deletePage.step1"), t("deletePage.step2"), t("deletePage.step3"), t("deletePage.step4")];
  return (
    <div className="flex min-h-svh flex-col bg-sidebar">
      <header className="flex h-14 items-center gap-2.5 border-b bg-background px-4 sm:px-6">
        <BrandMark />
        <span className="text-xs font-semibold tracking-tight">BIShare Drive</span>
        <Button variant="outline" size="sm" className="ms-auto" asChild>
          <Link href={base || "/"}>{t("deletePage.open")}</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("deletePage.title")}</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("deletePage.lead")}</p>
        </div>
        <section className="border bg-background">
          <header className="flex items-center gap-2 border-b px-4 py-3 text-xs font-semibold">
            <Smartphone className="size-4 text-blau" />
            {t("deletePage.inApp")}
          </header>
          <ol className="m-0 list-none p-0">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-3 border-b px-4 py-3 text-xs last:border-b-0">
                <span className="grid size-6 shrink-0 place-items-center border text-3xs font-semibold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>
        <section className="grid gap-px border bg-border sm:grid-cols-2">
          {[
            { icon: Trash2, title: t("deletePage.whatTitle"), body: t("deletePage.whatBody") },
            { icon: ShieldCheck, title: t("deletePage.keptTitle"), body: t("deletePage.keptBody") },
            { icon: CreditCard, title: t("deletePage.subsTitle"), body: t("deletePage.subsBody") },
            { icon: Mail, title: t("deletePage.noDeviceTitle"), body: t("deletePage.noDeviceBody") },
          ].map((c) => (
            <div key={c.title} className="flex flex-col gap-1.5 bg-background p-4">
              <div className="flex items-center gap-2 text-xs font-medium">
                <c.icon className="size-4 text-muted-foreground" />
                {c.title}
              </div>
              <p className="text-2xs leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </section>
        <Button asChild className="self-start">
          <a href="mailto:support@billiongroup.net?subject=Delete%20my%20BIShare%20Drive">
            <Mail /> support@billiongroup.net
          </a>
        </Button>
      </main>
    </div>
  );
}
