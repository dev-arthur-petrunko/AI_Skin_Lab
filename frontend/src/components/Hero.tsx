"use client";

import { motion } from "framer-motion";
import { HeroProducts, type HeroItem } from "./HeroProducts";
import { useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";
const CATEGORY_CHIPS = [
  { label: "all", href: "/catalog" },
  { label: "care", href: "/catalog?q=%D0%B4%D0%BE%D0%B3%D0%BB%D1%8F%D0%B4" },
  { label: "creams", href: "/catalog?q=%D0%BA%D1%80%D0%B5%D0%BC" },
  { label: "serums", href: "/catalog?q=%D1%81%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82" },
];

interface Props {
  stats: { items: number; brands: number; sales: number; maxDiscount: number };
  heroItems: HeroItem[];
}

export function Hero({ stats, heroItems }: Props) {
  const t = useTranslations("hero");
  const tCats = useTranslations("categories");
  const words = t("title").split(" ");

  return (
    <section id="hero" className="relative">
      <div className="container-page grid items-center gap-y-8 pt-8 pb-4 lg:min-h-[calc(100svh-190px)] lg:grid-cols-[46fr_54fr] lg:gap-x-6 lg:pt-4">
        {/* copy — lives directly on the living background, no card */}
        <div className="relative z-10 max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="chip-f !cursor-default !px-4 !py-1.5 !text-xs font-semibold tracking-wide"
          >
            {t("badge")}
          </motion.span>

          <h1 className="h1-hero mt-5">
            {words.map((w, i) => (
              <motion.span
                key={i}
                className="mr-[.24em] inline-block"
                initial={{ opacity: 0, y: "45%", filter: "blur(14px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-[var(--muted)]"
          >
            {t("lead")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.62 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link href="/catalog" className="btn btn-primary">
              {t("ctaCatalog")}
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => window.dispatchEvent(new CustomEvent("ai:open"))}
            >
              {t("ctaAsk")}
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-7 text-[13px] tracking-wide text-[var(--muted)]"
          >
            {t("microItems", { n: stats.items })} <span className="mx-1 text-[var(--gold)]">·</span>{" "}
            {t("microBrands", { n: stats.brands })} <span className="mx-1 text-[var(--gold)]">·</span>{" "}
            <span className="text-[var(--sale)]">{t("microSale", { n: Math.floor(stats.maxDiscount) })}</span>
          </motion.p>
        </div>

        {/* stage — real cut-out products, no frame */}
        <div className="relative z-0 lg:justify-self-end lg:w-full">
          <HeroProducts items={heroItems} />
        </div>
      </div>

      {/* floating glass category rail at the bottom of the hero */}
      <div className="container-page relative z-10 pb-8 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="glass mx-auto flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-full p-1.5"
        >
          <span className="hidden shrink-0 pl-3 pr-1 text-[13px] font-medium text-[var(--muted)] sm:inline">
            {tCats("rail_label")}
          </span>
          {CATEGORY_CHIPS.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[rgba(232,213,176,.55)]"
            >
              {tCats(c.label)}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
