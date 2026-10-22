"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Copy, File as FileIcon, Folder, Link2, Loader2, Mail, X } from "lucide-react";
import { DriveApiError } from "@/lib/vault/client";
import { createLink, LinkTooManyFiles, listLinks, revokeLink, type DriveLink } from "@/lib/vault/drive-links";
import { browserName } from "@/lib/vault/session";
import type { DriveObject } from "@/lib/vault/store";
import { EmptyState, PageHead, Panel } from "./bits";
import { useDrive } from "./drive-app";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const LIFETIMES = [1, 7, 30, 0] as const;

/** The words for what went wrong with a link call. */
function useLinkError() {
  const t = useTranslations("drive");
  return useCallback(
    (e: unknown) => {
      if (e instanceof LinkTooManyFiles) return t("links.errors.tooMany");
      const code = e instanceof DriveApiError ? e.code : "";
      if (code === "VAULT_LINK_LIMIT") return t("links.errors.limit");
      if (code === "VAULT_LINK_NOT_FOUND" || code === "VAULT_LINK_EXPIRED") return t("links.errors.gone");
      if (code === "SMTP_NOT_CONFIGURED" || code === "EMAIL_FAILED") return t("links.emailFailed");
      if (code === "RATE_LIMITED" || code === "NETWORK") return t(`errors.${code}`);
      return t("errors.UNKNOWN");
    },
    [t]
  );
}

function useEnds() {
  const t = useTranslations("drive");
  const locale = useLocale();
  return (l: DriveLink) =>
    l.expiresAt === null
      ? t("links.untilOff")
      : t("links.until", { when: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(l.expiresAt)) });
}

/**
 * Share [o] as a link (drive-plan.md 6B.3), or show [link]: links to the item
 * that still open come first; a new one lasts 1, 7 or 30 days or until it is
 * turned off. The link can be copied, emailed by BIShare and turned off.
 */
export function LinkDialog({ o, link: given, onDone }: { o?: DriveObject; link?: DriveLink; onDone: () => void }) {
  const t = useTranslations("drive");
  const { client, index, session, toast } = useDrive();
  const say = useLinkError();
  const ends = useEnds();
  const [existing, setExisting] = useState<DriveLink[] | null>(given ? [] : null);
  const [days, setDays] = useState<number>(7);
  const [link, setLink] = useState<DriveLink | null>(given ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);

  useEffect(() => {
    if (given || !o) return;
    listLinks(client, index, session.vaultKey, o.id).then(setExisting, (e) => {
      setExisting([]);
      setError(say(e));
    });
  }, [client, index, session.vaultKey, o, given, say]);

  const run = async (step: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await step();
    } catch (e) {
      setError(say(e));
    } finally {
      setBusy(false);
    }
  };

  const title = link ? (link.name ?? t("links.ready")) : t("links.title");
  return (
    <Dialog open onOpenChange={(open) => !open && onDone()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{title}</DialogTitle>
          <DialogDescription>{link ? ends(link) : t("links.body", { name: o?.name ?? "" })}</DialogDescription>
        </DialogHeader>
        {!link ? (
          <div className="grid gap-3">
            {existing === null ? (
              <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              existing.map((l) => (
                <button key={l.id} type="button" onClick={() => setLink(l)} className="flex items-center gap-2 border px-3 py-2 text-left text-xs hover:bg-muted/50">
                  <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{ends(l)}</span>
                  <span className="text-3xs text-muted-foreground">{t("links.opens", { n: l.opens })}</span>
                </button>
              ))
            )}
            {existing?.length ? <p className="text-2xs text-muted-foreground">{t("links.new")}</p> : null}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("links.lifetime")}>
              {LIFETIMES.map((d) => (
                <Button key={d} type="button" size="sm" variant={d === days ? "default" : "outline"} role="radio" aria-checked={d === days} onClick={() => setDays(d)}>
                  {d === 0 ? t("links.forever") : t("links.days", { n: d })}
                </Button>
              ))}
            </div>
            {error ? <p className="text-2xs text-destructive">{error}</p> : null}
            <Button
              disabled={busy || !o}
              onClick={() =>
                void run(async () => {
                  setLink(await createLink(client, index, session.vaultKey, o!, days));
                })
              }
            >
              {busy ? <Loader2 className="animate-spin" /> : <Link2 />} {t("links.create")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {link.url ? (
              <>
                <div className="mx-auto bg-white p-2">
                  <QRCodeSVG value={link.url} size={168} level="M" />
                </div>
                <Input readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-2xs" aria-label={t("links.address")} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto min-h-8 whitespace-normal"
                    onClick={() =>
                      void navigator.clipboard.writeText(link.url!).then(
                        () => toast(t("links.copied"), { tone: "ok" }),
                        () => setError(t("errors.UNKNOWN"))
                      )
                    }
                  >
                    <Copy /> {t("links.copy")}
                  </Button>
                  <Button variant="outline" className="h-auto min-h-8 whitespace-normal" onClick={() => setEmail(email === null ? "" : null)} aria-expanded={email !== null}>
                    <Mail /> {t("links.email")}
                  </Button>
                </div>
                {email !== null ? (
                  <form
                    noValidate
                    className="grid gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const to = email.trim();
                      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return setError(t("links.emailBad"));
                      void run(async () => {
                        await client.emailLink(link.id, { to, link: link.url!, name: browserName(), ...(link.name ? { title: link.name } : {}) });
                        toast(t("links.emailSent", { to }), { tone: "ok" });
                        setEmail(null);
                      });
                    }}
                  >
                    <p className="text-2xs text-muted-foreground">{t("links.emailBody")}</p>
                    <div className="flex gap-2">
                      <Input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("links.emailHint")} aria-label={t("links.email")} />
                      <Button type="submit" disabled={busy}>
                        {busy ? <Loader2 className="animate-spin" /> : null}
                        {t("links.send")}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </>
            ) : (
              <p className="text-2xs text-muted-foreground">{t("links.noKey")}</p>
            )}
            {error ? <p className="text-2xs text-destructive">{error}</p> : null}
            {confirmOff ? (
              <div className="grid gap-2 border border-destructive/40 p-3">
                <p className="text-xs font-medium">{t("links.offTitle")}</p>
                <p className="text-2xs text-muted-foreground">{t("links.offBody")}</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setConfirmOff(false)}>
                    {t("act.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await revokeLink(client, link.id);
                        toast(t("links.turnedOff"), { tone: "ok" });
                        onDone();
                      })
                    }
                  >
                    {t("links.turnOff")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmOff(true)}>
                <X /> {t("links.turnOff")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Every link of the Drive that still opens. */
export function LinksPage() {
  const t = useTranslations("drive");
  const { client, index, session, showLink } = useDrive();
  const say = useLinkError();
  const ends = useEnds();
  const [links, setLinks] = useState<DriveLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    listLinks(client, index, session.vaultKey).then(setLinks, (e) => setError(say(e)));
  }, [client, index, session.vaultKey, say]);
  useEffect(load, [load]);
  // A link turned off from its dialog leaves the list.
  useEffect(() => {
    const again = () => load();
    window.addEventListener("bishare-drive-links", again);
    return () => window.removeEventListener("bishare-drive-links", again);
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <PageHead title={t("nav.links")} sub={t("links.pageSub")} />
      <Panel>
        {error ? (
          <EmptyState icon={Link2} title={error} />
        ) : links === null ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : links.length === 0 ? (
          <EmptyState icon={Link2} title={t("links.empty")} description={t("links.emptyBody")} />
        ) : (
          <ul className="divide-y">
            {links.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => showLink(l)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                  {l.folder ? <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{l.name ?? t("links.goneName")}</span>
                    <span className="block text-3xs text-muted-foreground">
                      {ends(l)}
                      {l.folder ? ` · ${t("items", { n: l.files })}` : ""}
                    </span>
                  </span>
                  <span className="text-3xs text-muted-foreground">{t("links.opens", { n: l.opens })}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
