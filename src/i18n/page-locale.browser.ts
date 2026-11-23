import { routing } from "@/i18n/routing";

export const pageLocale = () => document.documentElement.lang;
export const pagePath = () => {
  const [, first = "", ...rest] = location.pathname.split("/");
  return (routing.locales as readonly string[]).includes(first) ? `/${rest.join("/")}` : location.pathname;
};
