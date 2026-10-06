"use client";

import { createContext, useContext, useState } from 'react';
import type { Mood } from '@/lib/mood';

const Ctx = createContext<{ mood: Mood; setMood: (m: Mood) => void }>({ mood: 'all', setMood: () => {} });

export const useMood = () => useContext(Ctx);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMood] = useState<Mood>('all');
  return <Ctx.Provider value={{ mood, setMood }}>{children}</Ctx.Provider>;
}
