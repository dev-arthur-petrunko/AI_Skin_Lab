"use client";

import { useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";
import ProductCarousel from "./ProductCarousel";
import type { Product } from "@/lib/types";
import { motion } from "framer-motion";

interface Props {
  products: Product[];
}

export default function SaleSection({ products }: Props) {
  const t = useTranslations("sale");

  return (
    <section id="catalog-preview" className="container-page mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <span className="section-label">{t("title")}</span>
          <h2 className="section-title mt-2">{t("subtitle")}</h2>
        </div>
        <Link href="/catalog?sale=1" className="btn btn-ghost">
          {t("view_all")}
        </Link>
      </motion.div>

      <div className="tile pearl-edge is-sale mt-8">
        <ProductCarousel products={products} />
      </div>
    </section>
  );
}
