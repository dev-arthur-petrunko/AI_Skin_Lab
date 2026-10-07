"use client";

import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";
import { CountUp } from "./CountUp";
import SaleRail from "./SaleRail";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  maxDiscount: number;
}

export default function SaleSection({ products, maxDiscount }: Props) {
  const t = useTranslations("sale");
  const value = Math.floor(maxDiscount);

  return (
    <section className="section-noir relative mt-16 py-16 sm:mt-20 sm:py-20">
      <div className="container-page flex flex-wrap items-end justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <span className="section-label">{t("eyebrow")}</span>
          <h2 className="section-title mt-3">{t("title")}</h2>
          <p className="mt-3 text-[15px] text-[var(--muted)]">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-right"
        >
          <span className="block font-serif text-[clamp(46px,7vw,88px)] leading-none text-[var(--champagne)]">
            {t("up_to_prefix")}
            <CountUp to={value} />
            {t("up_to_suffix")}
          </span>
          <span className="mt-2 block text-[12px] uppercase tracking-[.2em] text-[var(--muted)]">
            {t("drag_hint")}
          </span>
        </motion.div>
      </div>

      <div className="container-page mt-8">
        <SaleRail products={products} />
      </div>

      <div className="container-page mt-8 flex justify-center">
        <Link href="/catalog?sale=1" className="btn btn-primary">
          {t("view_all")}
        </Link>
      </div>
    </section>
  );
}
