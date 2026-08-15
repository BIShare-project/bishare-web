import { getTranslations } from "next-intl/server";
import { CookieNoticeClient } from "./cookie-notice-client";

/** Server wrapper: resolves the localized strings, hands them to the client. */
export async function CookieNotice() {
  const t = await getTranslations("cookies");
  return (
    <CookieNoticeClient
      body={t("body")}
      accept={t("accept")}
      decline={t("decline")}
      learnMore={t("learnMore")}
    />
  );
}
