"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import { ThemeToggle } from './ThemeProvider';

export default function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/', label: t('home') },
    { href: '/catalog', label: t('catalog') },
    { href: '/catalog?sale=1', label: t('sale') },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'glass !rounded-none border-x-0 border-t-0' : 'border-b border-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md shadow-[0_0_12px_rgba(255,255,255,0.25),inset_0_0_8px_rgba(255,255,255,0.15)] overflow-hidden group">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <Image src="/logo.png" alt="AI Skin Lab" width={36} height={36} className="object-contain relative z-10" />
          </span>
          <span className="font-serif text-xl tracking-wide">AI Skin Lab</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium tracking-wide transition-colors hover:text-[var(--azure)] ${
                pathname === link.href.split("?")[0] ? "text-[var(--azure)]" : "text-[var(--muted)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
