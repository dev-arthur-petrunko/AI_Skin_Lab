'use client';

import { motion } from 'framer-motion';
import { HeroVisual } from './HeroVisual';
import { useTranslations } from "@/i18n/request";
import { Link } from '@/i18n/navigation';
import { useMood } from './MoodProvider';
import { MOOD_QUERY, type Mood } from '@/lib/mood';
import { CountUp } from './CountUp';
import type { Product } from '@/lib/types';

const MOOD_KEYS: Mood[] = ['all', 'fresh', 'sweet', 'wood'];

export function Hero({ stats }: { products: Product[]; stats: { items: number; brands: number; sales: number } }) {
  const t = useTranslations('hero');
  const tMood = useTranslations('mood');
  const { mood, setMood } = useMood();
  const words = t('title').split(' ');
  const moodLabel = (m: Mood) =>
    m === 'all' ? tMood('all')
      : m === 'fresh' ? tMood('fresh')
        : m === 'sweet' ? tMood('sweet')
          : tMood('wood');

  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="container-page grid gap-[18px] pt-12 pb-6 md:grid-cols-[1.2fr_1fr]
        md:[grid-template-areas:'copy_stage''mood_stage''stats_stage']
        [grid-template-areas:'copy''stage''mood''stats']">
        {/* COPY */}
        <div className="tile [grid-area:copy]">
          <h1 className="font-serif font-semibold tracking-[-.03em] leading-[1.02] text-4xl md:text-6xl lg:text-7xl mb-5">
            {words.map((w, i) => (
              <motion.span key={i} className="inline-block mr-[.25em]"
                initial={{ opacity: 0, y: '45%', filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: .9, delay: .15 + i * .09, ease: [.2, .8, .2, 1] }}>{w}</motion.span>
            ))}
          </h1>
          <p className="max-w-[44ch] text-[17px] mb-6" style={{ color: 'var(--muted)' }}>{t("lead")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/catalog" className="btn btn-primary">{t("ctaCatalog")}</Link>
            <button type="button" className="btn btn-ghost" onClick={() => window.dispatchEvent(new CustomEvent('ai:open'))}>
              {t("ctaAsk")}
            </button>
          </div>
        </div>

        {/* STAGE: стеклянная сфера */}
        <div className="tile [grid-area:stage] relative grid min-h-[440px] md:min-h-[560px] place-items-center overflow-hidden">
          <HeroVisual />
        </div>

        {/* MOOD */}
        <div className="tile [grid-area:mood]">
          <h3 className="font-serif font-semibold text-[19px]">{t("moodTitle")}</h3>
          <p className="mb-3.5 text-sm" style={{ color: 'var(--muted)' }}>{t("moodHint")}</p>
          <div className="flex flex-wrap gap-2" role="group">
            {MOOD_KEYS.map(m => {
              const q = MOOD_QUERY[m];
              return (
                <Link
                  key={m}
                  href={q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog'}
                  className="chip-f"
                  aria-pressed={mood === m}
                  onClick={() => setMood(m)}
                >
                  {moodLabel(m)}
                </Link>
              );
            })}
          </div>
        </div>

        {/* STATS */}
        <div className="tile [grid-area:stats] flex gap-8">
          <Stat n={stats.items} label={t("statItems")} /><Stat n={stats.brands} label={t("statBrands")} /><Stat n={stats.sales} label={t("statSales")} sale />
        </div>
      </div>
    </section>
  );
}
const Stat = ({ n, label, sale }: { n: number; label: string; sale?: boolean }) => (
  <div><b className={`block font-serif text-4xl font-semibold leading-none ${sale ? "price-new" : ""}`}><CountUp to={n} /></b>
  <span className="text-[13px]" style={{ color: "var(--muted)" }}>{label}</span></div>
);