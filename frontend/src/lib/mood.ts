export type Mood = 'all' | 'fresh' | 'sweet' | 'wood';
export const MOODS: Record<Mood, { c1: string; c2: string }> = {
  all:   { c1: '#7DE3FF', c2: '#4F8CFF' },
  fresh: { c1: '#9FF0FF', c2: '#3B82F6' },
  sweet: { c1: '#FFD3E6', c2: '#FF5C9D' },
  wood:  { c1: '#CDB8FF', c2: '#4F5BD5' },
};
const KW: Record<Exclude<Mood,'all'>, RegExp> = {
  fresh: /(цитрус|лимон|бергамот|мор[ії]|морськ|мяты?|м'ят|свіж|свеж|fresh|citrus|marine|aqua|водоростi|нерол|зелен)/i,
  sweet: /(ванiл|ванил|vanilla|карамел|мед|мёд|цукор|сахар|sweet|півон|пион|груш|персик|малин|рож|троянд|gourmand)/i,
  wood:  /(кедр|cedar|сандал|sandal|ветивер|vetiver|амбр|amber|дерев|wood|пачул|patchouli|дуб|oud|уд|мох|moss)/i,
};
export function moodOf(notes = ''): Exclude<Mood,'all'> | null {
  for (const k of Object.keys(KW) as Exclude<Mood,'all'>[]) if (KW[k].test(notes)) return k;
  return null;
}
