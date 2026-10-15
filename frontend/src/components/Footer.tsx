"use client";

import Image from "next/image";
import { useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "./ThemeProvider";
import { INSTAGRAM_URL, INSTAGRAM_GRADIENT } from "@/lib/instagram";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-20 bg-[var(--noir)] text-[#f7f0e6] sm:mt-24">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={52}
              height={52}
              className="rounded-full object-contain"
            />
            <div className="font-serif text-2xl">AI Skin Lab</div>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[rgba(247,240,230,.72)]">
            {t("tagline")}
          </p>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-fit items-center gap-3 rounded-full px-5 py-3 text-white shadow-lg transition hover:brightness-110"
            style={{ background: INSTAGRAM_GRADIENT }}
          >
            <span className="text-2xl" aria-hidden>
              📸
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] uppercase tracking-wider text-white/80">
                {t("instagram_label")}
              </span>
              <span className="block truncate text-sm font-semibold">
                @ai_skin_lab →
              </span>
            </span>
          </a>
        </div>

        <div>
          <div className="section-label" style={{ color: "var(--champagne)" }}>
            {t("catalog")}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-[rgba(247,240,230,.75)]">
            <li>
              <Link href="/catalog" className="transition hover:text-[#e3c46a]">
                {t("all")}
              </Link>
            </li>
            <li>
              <Link href="/catalog?sale=1" className="transition hover:text-[#e57ba4]">
                {t("sale")}
              </Link>
            </li>
            <li>
              <Link href="/catalog?sets=1" className="transition hover:text-[#e3c46a]">
                🎁 {t("sets")}
              </Link>
            </li>
            <li>
              <Link href="/guide" className="transition hover:text-[#e3c46a]">
                {t("guide")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="section-label" style={{ color: "var(--champagne)" }}>
            {t("info")}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-[rgba(247,240,230,.75)]">
            <li>{t("delivery")}</li>
            <li>{t("returns")}</li>
            <li>{t("contacts")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[rgba(201,165,92,.25)]">
        <div className="container-page flex flex-wrap items-center justify-start gap-x-5 gap-y-2 py-4 pr-20 text-xs text-[rgba(247,240,230,.6)] sm:pr-0">
          <ThemeToggle />
          <span>
            © {new Date().getFullYear()} AI Skin Lab. {t("rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}
