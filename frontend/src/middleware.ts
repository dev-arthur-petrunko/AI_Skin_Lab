import { defaultLocale, locales } from "./i18n/config";

export default function middleware() {
  return;
}

export const config = {
  matcher: ["/((?!api|_next|images|_vercel|.*\\..*).*)"],
};
