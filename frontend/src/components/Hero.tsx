"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Props {
  stats: { products: number; brands: number; sale: number };
}

export default function Hero({ stats }: Props) {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden">
      {/* фоновая композиция */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-sand via-cream to-sand" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-mocha/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-berry/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(176,137,104,0.18),transparent_55%)]" />
      </div>

      <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-mocha/30 bg-white/70 px-4 py-1.5 text-xs font-medium tracking-wider text-mocha backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-berry" />
            {t("badge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 font-serif text-4xl leading-[1.1] text-espresso sm:text-5xl lg:text-6xl"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-espresso/70"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link href="/catalog" className="btn-primary">
              {t("cta_catalog")} →
            </Link>
            <Link href="/catalog" className="btn-ghost">
              ✨ {t("cta_chat")}
            </Link>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-espresso/10 pt-6"
          >
            <div>
              <dt className="font-serif text-3xl text-espresso">{stats.products}</dt>
              <dd className="mt-1 text-xs text-espresso/55">{t("stat_products")}</dd>
            </div>
            <div>
              <dt className="font-serif text-3xl text-espresso">{stats.brands}</dt>
              <dd className="mt-1 text-xs text-espresso/55">{t("stat_brands")}</dd>
            </div>
            <div>
              <dt className="font-serif text-3xl text-berry">{stats.sale}</dt>
              <dd className="mt-1 text-xs text-espresso/55">{t("stat_sale")}</dd>
            </div>
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative hidden lg:block"
        >
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl shadow-espresso/20">
            <div className="absolute inset-0 bg-gradient-to-br from-mocha/70 via-espresso/60 to-berry/50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-cream">
              <span className="text-5xl">🌸</span>
              <span className="font-serif text-3xl leading-tight">
                AI Skin Lab
              </span>
              <span className="text-xs uppercase tracking-[0.35em] text-cream/70">
                premium beauty
              </span>
            </div>
            <div className="absolute inset-4 rounded-[2rem] border border-cream/20" />
          </div>

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 top-10 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur"
          >
            <div className="text-[11px] uppercase tracking-wider text-espresso/50">
              Sale
            </div>
            <div className="text-sm font-semibold text-berry">-43%</div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-4 bottom-16 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur"
          >
            <div className="text-[11px] uppercase tracking-wider text-espresso/50">
              AI
            </div>
            <div className="text-sm font-semibold text-espresso">✨ 24/7</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
