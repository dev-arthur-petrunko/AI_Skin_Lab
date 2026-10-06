"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-full border border-espresso/15 bg-white/70 p-1 backdrop-blur">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider transition-colors ${
            l === locale
              ? "bg-espresso text-cream"
              : "text-espresso/60 hover:text-espresso"
          }`}
          aria-label={l}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
