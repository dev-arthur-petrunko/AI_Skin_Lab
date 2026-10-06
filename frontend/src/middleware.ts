import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/config";

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localeCookie: true,
  localeDetection: false,
});

export const config = {
  matcher: ["/((?!api|_next|images|_vercel|.*\\..*).*)"],
};
