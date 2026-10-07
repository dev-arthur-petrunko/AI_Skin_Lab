"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/request";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { ThemeToggle } from "./ThemeProvider";

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/", label: t("home") },
    { href: "/catalog", label: t("catalog") },
    { href: "/catalog?sale=1", label: t("sale") },
  ];

  const isActive = (href: string) => pathname === href.split("?")[0];

  return (
    <header className="sticky top-3 z-40">
      <div className="container-page relative">
        <div className={`header-pill ${scrolled ? "is-compact" : ""}`}>
          <Link href="/" className="group flex items-center gap-2.5 pl-1" onClick={() => setMenu(false)}>
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/20 shadow-[0_0_14px_rgba(255,255,255,.3),inset_0_0_10px_rgba(255,255,255,.2)] backdrop-blur-md">
              <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
              <Image src="/logo.png" alt="AI Skin Lab" width={44} height={44} className="relative z-10 object-contain" priority />
            </span>
            <span className="font-serif text-lg leading-none tracking-wide sm:text-xl md:text-2xl">
              AI Skin Lab
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] font-medium tracking-wide transition-colors hover:text-[var(--azure)] ${
                  isActive(link.href) ? "text-[var(--azure)]" : "text-[var(--muted)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label={t("menu")}
              aria-expanded={menu}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full border border-[var(--gl)] transition hover:border-[var(--azure)] lg:hidden"
            >
              <span className={`h-[2px] w-4 rounded-full bg-[var(--ink)] transition-transform ${menu ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`h-[2px] w-4 rounded-full bg-[var(--ink)] transition-opacity ${menu ? "opacity-0" : ""}`} />
              <span className={`h-[2px] w-4 rounded-full bg-[var(--ink)] transition-transform ${menu ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>

          <span className="header-progress" style={{ transform: `scaleX(${progress})` }} />
        </div>

        {menu && (
          <nav className="header-menu flex flex-col gap-1 lg:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenu(false)}
                className={`rounded-full px-4 py-3 text-[15px] font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-gradient-to-r from-[rgba(232,213,176,.6)] to-[rgba(232,213,176,.25)] text-[var(--ink)]"
                    : "text-[var(--muted)] hover:text-[var(--azure)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
