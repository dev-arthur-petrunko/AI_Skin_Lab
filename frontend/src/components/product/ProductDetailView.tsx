"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { localizedField, type Product as ProductType } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

interface Props {
  product: ProductType;
  related: ProductType[];
}

export default function ProductDetailView({ product, related }: Props) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const name = localizedField(product, "name", locale);
  const description = localizedField(product, "description", locale);
  const price = product.promo_price ?? product.price;

  const specs: Array<{ label: string; value: string }> = [
    { label: t("brand"), value: product.brand || "—" },
    { label: t("sku"), value: product.sku },
    { label: t("volume"), value: product.volume || "—" },
    { label: t("country"), value: product.country || "—" },
    { label: t("category"), value: product.category },
  ];

  return (
    <div className="container-page py-12">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1 text-sm text-espresso/60 transition hover:text-mocha"
      >
        ← {t("back")}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-sand"
        >
          {product.is_on_sale && (
            <span className="absolute left-4 top-4 z-10 animate-pulse rounded-full bg-berry px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-berry/30">
              Sale -{product.discount_percent}%
            </span>
          )}
          <div className="aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-mocha">
            {product.brand}
          </div>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-espresso sm:text-4xl">
            {name}
          </h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            {product.is_on_sale ? (
              <>
                <span className="text-3xl font-semibold text-berry">
                  {formatPrice(price)} {tCommon("currency")}
                </span>
                <span className="text-lg text-espresso/40 line-through">
                  {formatPrice(product.price)} {tCommon("currency")}
                </span>
              </>
            ) : (
              <span className="text-3xl font-semibold text-espresso">
                {formatPrice(product.price)} {tCommon("currency")}
              </span>
            )}
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-4 border-y border-espresso/10 py-5 text-sm">
            {specs.map((s) => (
              <div key={s.label}>
                <dt className="text-espresso/50">{s.label}</dt>
                <dd className="mt-1 font-medium text-espresso">{s.value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-espresso/50">{t("availability")}</dt>
              <dd className="mt-1">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {t("in_stock")}
                  </span>
                ) : (
                  <span className="font-medium text-espresso/50">{t("out_of_stock")}</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-7">
            <h2 className="section-label">{t("description")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-espresso/75">{description}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" disabled={product.stock === 0}>
              {product.stock > 0 ? "🛒 Додати в кошик" : t("out_of_stock")}
            </button>
            <Link href="/catalog" className="btn-ghost">
              ✨ {t("ask_ai")}
            </Link>
          </div>
        </motion.div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title">{t("related")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

