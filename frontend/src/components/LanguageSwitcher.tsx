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
    <div className="glass flex items-center gap-1 !rounded-full p-1">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider transition-colors ${
            l === locale
              ? "bg-[var(--azure)] text-white"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
          aria-label={l}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
