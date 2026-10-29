"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getVaultOpen, reportCta, type CtaId } from "@/lib/api";
import { getPathname } from "@/i18n/navigation";
import { buttonVariants } from "@/components/site/ui/button";

/** Where the Drive opens in a browser (the middleware serves /drive there). */
const DRIVE_URL = "https://drive.bishare.app";

/**
 * Under a finished upload: the link ends after [hours], and a file meant to
 * stay longer belongs in BIShare Drive, whose links last up to 30 days or
 * until they are turned off (drive-plan.md 6B.3). Drive starts in the app, so
 * the app comes first; "Open Drive" is for those who already have one.
 *
 * Hidden unless the remote flag `vault_enabled` is on for everyone (true):
 * "internal" (testers only) and an unreadable config show nothing.
 */
export function DriveAfterUpload({ hours }: { hours: number }) {
  const t = useTranslations("tool.driveAfterUpload");
  const locale = useLocale();
  const open = useVaultOpen();
  useCtaView(open, "drive_after_upload");

  if (!open) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-5 text-left">
      <h4 className="text-base font-semibold tracking-[-0.01em]">{t("title")}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("body", { hours })}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={`${getPathname({ href: "/download", locale })}?ref=drive_after_upload`}
          onClick={() => reportCta("drive_after_upload_app", "click")}
          className={buttonVariants({ variant: "default", size: "default", className: "sm:flex-1" })}
        >
          {t("app")}
        </a>
        <a
          href={DRIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => reportCta("drive_after_upload_open", "click")}
          className={buttonVariants({ variant: "outline", size: "default", className: "sm:flex-1" })}
        >
          {t("open")}
        </a>
      </div>
    </section>
  );
}

/**
 * Under the drop zone: a link from here lasts [hours] at most, Drive's up to
 * 30 days. Only the lifetime is offered, never size: a Drive link holds about
 * 5 GiB per file while a transfer takes 100 GiB. Same flag as above.
 */
export function DriveLinkHint({ hours }: { hours: number }) {
  const t = useTranslations("tool.driveHint");
  const open = useVaultOpen();
  useCtaView(open, "drive_hint");

  if (!open) return null;
  return (
    <p className="text-center text-[12.5px] text-muted-foreground">
      {t.rich("text", {
        hours,
        a: (chunks) => (
          <a
            href={DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => reportCta("drive_hint", "click")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {chunks}
          </a>
        ),
      })}
    </p>
  );
}

/** Whether `vault_enabled` is on for everyone. */
function useVaultOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    void getVaultOpen().then((on) => {
      if (alive) setOpen(on);
    });
    return () => {
      alive = false;
    };
  }, []);

  return open;
}

/** Counts the card as shown once it is on screen. The two buttons share one view. */
function useCtaView(open: boolean, id: CtaId): void {
  useEffect(() => {
    if (open) reportCta(id, "view");
  }, [open, id]);
}
