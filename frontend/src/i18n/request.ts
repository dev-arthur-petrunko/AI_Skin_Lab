import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;

  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
