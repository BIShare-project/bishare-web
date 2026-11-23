import { getTranslations } from "@/i18n/translate";
import { ArrowRight } from "@/ui/icons";
import { Button } from "@/ui/button";

/**
 * The landing-page hero action pair, in the order that matches what the
 * product can actually do for a first-time visitor.
 *
 * Web first: someone searching "airdrop for windows" wants to move a file
 * now, and the browser transfer needs no install on either side — so leading
 * with a download asks for a commitment before delivering any value. The app
 * is the fuller solution (discovery, speed, background receiving) and stays
 * one tap away as the secondary action.
 *
 * Labels come from namespaces that are already translated into all 13
 * locales, so pages don't each need their own copy of these strings.
 */
export async function HeroCta({ downloadLabel }: { downloadLabel: string }) {
  const t = await getTranslations("related");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button href="/transfer" size="lg">
        {t("tryTransfer")}
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button href="/download" size="lg" variant="secondary">
        {downloadLabel}
      </Button>
    </div>
  );
}
