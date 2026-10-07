"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/request";
import { formatPrice, pluralUk } from "@/lib/format";
import { localizedField, type Product } from "@/lib/types";

export type BrandGroup = { name: string; products: Product[]; total: number };

interface Props {
  brands: BrandGroup[];
}

export default function BrandsSection({ brands }: Props) {
  const t = useTranslations("brands");

  return (
    <section className="container-page mt-16 sm:mt-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <span className="section-label">{t("eyebrow")}</span>
          <h2 className="section-title mt-2">{t("title")}</h2>
        </div>
        <p className="max-w-sm text-sm text-[var(--muted)]">{t("subtitle")}</p>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {brands.map((brand, i) => (
          <BrandPanel key={brand.name} brand={brand} index={i} />
        ))}
      </div>
    </section>
  );
}

function BrandPanel({ brand, index }: { brand: BrandGroup; index: number }) {
  const t = useTranslations("brands");
  const tCat = useTranslations("categories");
  const word = pluralUk(brand.total, [
    tCat("items_one"),
    tCat("items_few"),
    tCat("items_many"),
  ]);

  const reveal = {
    hidden: { clipPath: "inset(0 0 100% 0)" },
    show: { clipPath: "inset(0 0 0% 0)", transition: { duration: 0.7 } },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
      className="tile !p-6 sm:!p-8"
    >
      <motion.div variants={reveal} initial="hidden" animate="show" className="h-full">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-2xl sm:text-3xl">{brand.name}</h3>
        <span className="text-[13px] text-[var(--muted)]">
          {brand.total} {word}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {brand.products.map((p) => (
          <BrandProduct key={p.id} product={p} />
        ))}
      </div>

      <Link
        href={`/catalog?q=${encodeURIComponent(brand.name)}`}
        className="btn btn-ghost mt-6 w-full"
      >
        {t("view_all")}
      </Link>
      </motion.div>
    </motion.div>
  );
}

function BrandProduct({ product }: { product: Product }) {
  const tCommon = useTranslations("common");
  const price = product.promo_price ?? product.price;
  const name = localizedField(product, "name", "uk");

  return (
    <Link href={`/product/${encodeURIComponent(product.id)}`} className="group block">
      <div className="pic relative aspect-square overflow-hidden [&_img]:p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
          }}
        />
      </div>
      <div className="mt-2 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug">{name}</div>
      <div className="mt-1 text-sm font-semibold">
        {formatPrice(price)} {tCommon("currency")}
      </div>
    </Link>
  );
}
