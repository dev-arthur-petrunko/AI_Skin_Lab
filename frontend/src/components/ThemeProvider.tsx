'use client';
import { ThemeProvider as NT, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NT attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NT>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label="Theme"
      className="glass grid h-10 w-10 place-items-center rounded-full text-[17px]"
    >
      {mounted ? (dark ? '☀️' : '🌙') : ''}
    </button>
  );
}
