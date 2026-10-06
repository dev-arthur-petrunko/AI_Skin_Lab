"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-20 border-t border-espresso/10 bg-sand/60">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="font-serif text-2xl text-espresso">AI Skin Lab</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-espresso/60">
            {t("tagline")}
          </p>
        </div>

        <div>
          <div className="section-label">{t("catalog")}</div>
          <ul className="mt-4 space-y-2 text-sm text-espresso/70">
            <li>
              <Link href="/catalog" className="transition hover:text-mocha">
                {t("catalog")}
              </Link>
            </li>
            <li>
              <Link href="/catalog?sale=1" className="transition hover:text-mocha">
                Sale
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="section-label">{t("info")}</div>
          <ul className="mt-4 space-y-2 text-sm text-espresso/70">
            <li>{t("delivery")}</li>
            <li>{t("returns")}</li>
            <li>{t("contacts")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-espresso/10 py-5 text-center text-xs text-espresso/50">
        © {new Date().getFullYear()} AI Skin Lab. {t("rights")}
      </div>
    </footer>
  );
}
