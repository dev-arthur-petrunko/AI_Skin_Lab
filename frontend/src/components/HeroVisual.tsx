'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { HeroCssFallback } from './HeroCssFallback';

const Scene = dynamic(() => import('./HeroScene'), { ssr: false, loading: () => <HeroCssFallback /> });

export function HeroVisual() {
  const [mode, setMode] = useState<'pending' | 'webgl' | 'css'>('pending');
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const weak = (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) < 4) || typeof window !== 'undefined' && innerWidth < 768;
    let gl = false;
    try {
      if (typeof document !== 'undefined') {
        const c = document.createElement('canvas');
        gl = !!(c.getContext('webgl2') || c.getContext('webgl'));
      }
    } catch {}
    setMode(!reduce && !weak && gl ? 'webgl' : 'css');
  }, []);
  return (
    <div aria-hidden className="relative min-h-[420px] md:min-h-[560px] [grid-area:stage]" style={{ transition: 'opacity .3s' }}>
      {mode === 'webgl' ? <Scene /> : <HeroCssFallback />}
    </div>
  );
}