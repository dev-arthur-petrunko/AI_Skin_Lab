export type Mood = 'all' | 'fresh' | 'sweet' | 'wood';

/** Free-text query each mood forwards to the catalog search box. */
export const MOOD_QUERY: Record<Mood, string> = {
  all: '',
  fresh: 'догляд',
  sweet: 'крем',
  wood: 'сироват',
};

const KW: Record<Exclude<Mood, 'all'>, RegExp> = {
  fresh: /(цитрус|лимон|бергамот|мор[ії]|морськ|мяты?|м'ят|свіж|свеж|fresh|citrus|marine|aqua|водоростi|нерол|зелен)/i,
  sweet: /(ванiл|ванил|vanilla|карамел|мед|мёд|цукор|сахар|sweet|півон|пион|груш|персик|малин|рож|троянд|gourmand)/i,
  wood: /(кедр|cedar|сандал|sandal|ветивер|vetiver|амбр|amber|дерев|wood|пачул|patchouli|дуб|oud|уд|мох|moss)/i,
};
export function moodOf(notes = ''): Exclude<Mood,'all'> | null {
  for (const k of Object.keys(KW) as Exclude<Mood,'all'>[]) if (KW[k].test(notes)) return k;
  return null;
}
