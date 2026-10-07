"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { localizedField, type Product } from "@/lib/types";

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const t = useTranslations("card");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const name = localizedField(product, "name", locale);
  const price = product.promo_price ?? product.price;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 10;
    el.style.setProperty("--gx", `${x}px`);
    el.style.setProperty("--gy", `${y}px`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.4), ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="h-full"
      onMouseMove={handleMove}
    >
      <Link
        href={`/product/${encodeURIComponent(product.id)}`}
        className={`tile pearl-edge group relative flex h-full flex-col overflow-hidden !p-0 ${
          product.is_on_sale ? "is-sale" : ""
        }`}
      >
        {product.is_on_sale && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[var(--sale)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            {t("badge")}
          </span>
        )}

        <div className="pic relative aspect-[4/5] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
            }}
          />
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-center text-xs font-medium text-white transition-transform duration-300 group-hover:translate-y-0">
            {t("view")}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--azure)]">
            {product.brand}
          </div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{name}</h3>

          <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
            {product.is_on_sale ? (
              <>
                <span className="price-new">
                  {formatPrice(price)} {tCommon("currency")}
                </span>
                <span className="price-old">
                  {formatPrice(product.price)} {tCommon("currency")}
                </span>
                <span className="ml-auto rounded-full bg-[var(--sale)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--sale)]">
                  {t("discount", { value: Math.floor(product.discount_percent) })}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold">
                {formatPrice(product.price)} {tCommon("currency")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
