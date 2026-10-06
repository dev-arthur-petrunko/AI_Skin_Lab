"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/", label: t("home") },
    { href: "/catalog", label: t("catalog") },
    { href: "/catalog?sale=1", label: t("sale") },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-espresso/10 bg-cream/90 shadow-sm backdrop-blur"
          : "border-b border-transparent bg-cream/60 backdrop-blur"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-mocha/50 font-serif text-lg text-mocha transition-transform group-hover:rotate-12">
            S
          </span>
          <span className="font-serif text-xl tracking-wide text-espresso">
            AI Skin Lab
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium tracking-wide transition-colors hover:text-mocha ${
                pathname === link.href.split("?")[0]
                  ? "text-mocha"
                  : "text-espresso/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/catalog"
            className="hidden rounded-full bg-espresso px-4 py-2 text-xs font-medium text-cream transition hover:bg-espresso/90 sm:inline-flex"
          >
            {t("catalog")}
          </Link>
        </div>
      </div>
    </header>
  );
}
