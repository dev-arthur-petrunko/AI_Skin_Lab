"use client";

import { useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-20 border-t border-[var(--gl)]">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="font-serif text-2xl">AI Skin Lab</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
            {t("tagline")}
          </p>
        </div>

        <div>
          <div className="section-label">{t("catalog")}</div>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>
              <Link href="/catalog" className="transition hover:text-[var(--azure)]">
                {t("catalog")}
              </Link>
            </li>
            <li>
              <Link href="/catalog?sale=1" className="transition hover:text-[var(--sale)]">
                Sale
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="section-label">{t("info")}</div>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>{t("delivery")}</li>
            <li>{t("returns")}</li>
            <li>{t("contacts")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--gl)] py-5 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} AI Skin Lab. {t("rights")}
      </div>
    </footer>
  );
}
