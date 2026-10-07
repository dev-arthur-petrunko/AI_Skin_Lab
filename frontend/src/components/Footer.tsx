"use client";

import Image from "next/image";
import { useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "./ThemeProvider";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-20 bg-[var(--noir)] text-[#f7f0e6] sm:mt-24">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Image
            src="/logo.png"
            alt="AI Skin Lab"
            width={56}
            height={56}
            className="rounded-full object-contain"
          />
          <div className="mt-4 font-serif text-2xl">AI Skin Lab</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[rgba(247,240,230,.72)]">
            {t("tagline")}
          </p>
        </div>

        <div>
          <div className="section-label" style={{ color: "var(--champagne)" }}>
            {t("catalog")}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-[rgba(247,240,230,.75)]">
            <li>
              <Link href="/catalog" className="transition hover:text-[#e3c46a]">
                {t("catalog")}
              </Link>
            </li>
            <li>
              <Link href="/catalog?sale=1" className="transition hover:text-[#e57ba4]">
                {t("sale")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="section-label" style={{ color: "var(--champagne)" }}>
            {t("info")}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-[rgba(247,240,230,.75)]">
            <li>{t("delivery")}</li>
            <li>{t("returns")}</li>
            <li>{t("contacts")}</li>
          </ul>
          <div className="mt-5">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(201,165,92,.25)] py-5 text-center text-xs text-[rgba(247,240,230,.6)]">
        © {new Date().getFullYear()} AI Skin Lab. {t("rights")}
      </div>
    </footer>
  );
}
