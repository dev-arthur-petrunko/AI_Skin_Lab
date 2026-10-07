"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CountUp } from "./CountUp";
import { MoodToggle } from "./MoodToggle";
import { useMood } from "./MoodProvider";
import { formatPrice } from "@/lib/format";
import { localizedField, type Product } from "@/lib/types";
import { useLocale } from "next-intl";

interface Props {
  stats: { products: number; brands: number; sale: number };
  picks: Product[];
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

export default function Hero({ stats, picks }: Props) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const { mood } = useMood();
  const list = picks.slice(0, 3);

  return (
    <section className="relative overflow-hidden">
      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <motion.span {...fade(0)} className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wider">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--sale)]" />
            {t("badge")}
          </motion.span>

          <motion.h1 {...fade(0.1)} className="section-title mt-6">
            {t("title")}
          </motion.h1>

          <motion.p {...fade(0.2)} className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted)]">
            {t("subtitle")}
          </motion.p>

          <motion.div {...fade(0.3)} className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/catalog" className="btn btn-primary">
              {t("cta_catalog")}
            </Link>
            <Link href="/catalog?sale=1" className="btn btn-ghost">
              {t("cta_chat")}
            </Link>
          </motion.div>

          <motion.div {...fade(0.4)} className="mt-8">
            <MoodToggle />
          </motion.div>

          <motion.dl {...fade(0.45)} className="mt-8 grid max-w-md grid-cols-3 gap-4">
            <div className="tile pearl-edge p-5">
              <dt className="font-serif text-3xl">
                <CountUp to={stats.products} />
              </dt>
              <dd className="mt-1 text-xs text-[var(--muted)]">{t("stat_products")}</dd>
            </div>
            <div className="tile pearl-edge p-5">
              <dt className="font-serif text-3xl">
                <CountUp to={stats.brands} />
              </dt>
              <dd className="mt-1 text-xs text-[var(--muted)]">{t("stat_brands")}</dd>
            </div>
            <div className="tile pearl-edge p-5">
              <dt className="font-serif text-3xl text-[var(--sale)]">
                <CountUp to={stats.sale} />
              </dt>
              <dd className="mt-1 text-xs text-[var(--muted)]">{t("stat_sale")}</dd>
            </div>
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative"
        >
          <div className="absolute right-6 top-6 z-10">
            <motion.div {...fade(0.35)} className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wider">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--sale)]" />
              {t("ai_title")}
            </motion.div>
          </div>
          <div className="tile pearl-edge relative mx-auto flex aspect-square w-full max-w-md items-center justify-center overflow-hidden">
            <div
              aria-hidden
              className="animate-spin60 absolute h-[130%] w-[130%] rounded-full opacity-60"
              style={{ background: "conic-gradient(from 0deg, transparent, var(--pic), transparent 40%)" }}
            />
            <div
              aria-hidden
              className="animate-floaty relative grid h-56 w-56 place-items-center rounded-full"
              style={{ background: "radial-gradient(circle at 35% 30%, var(--orb1), var(--orb2) 70%)", boxShadow: "0 30px 80px var(--glow)" }}
            >
              <Image
               src="/logo.png"
               alt=""
               width={224}
               height={224}
               className="object-contain"
             />
            </div>
            <div className="absolute inset-x-6 bottom-6">
              <div className="glass rounded-3xl p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  {t("ai_title")}
                </div>
                <div className="mt-2 space-y-2" data-mood={mood}>
                  {list.map((p) => {
                    const price = p.promo_price ?? p.price;
                    return (
                      <Link key={p.id} href={`/product/${encodeURIComponent(p.id)}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{localizedField(p, "name", locale)}</span>
                        <span className={p.is_on_sale ? "price-new" : "font-semibold"}>
                          {formatPrice(price)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
