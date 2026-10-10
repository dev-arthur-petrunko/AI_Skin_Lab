"use client";

import React, { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "@/i18n/request";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { cutoutSrc } from "@/lib/cutouts";
import { localizedField, type Product as ProductType } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

interface Props {
  product: ProductType;
  related: ProductType[];
  setComponents?: ProductType[];
}

export default function ProductDetailView({ product, related, setComponents = [] }: Props) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const name = localizedField(product, "name", locale);
  const description = localizedField(product, "description", locale);
  const price = product.promo_price ?? product.price;

  const [hasCutout, setHasCutout] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasCutout(true);
    img.onerror = () => setHasCutout(false);
    img.src = cutoutSrc(product.id);
  }, [product.id]);

  const specs: Array<{ label: string; value: string }> = [
    { label: t("brand"), value: product.brand || "—" },
    { label: t("sku"), value: product.sku },
    { label: t("volume"), value: product.volume || "—" },
    { label: t("country"), value: product.country || "—" },
    { label: t("category"), value: product.category },
  ];

  // Parse description into sections: description, notes, ingredients
  const parseDescription = (text: string) => {
    const sections: Record<string, string[]> = {
      description: [],
      notes: [],
      ingredients: [],
    };
    let current: keyof typeof sections = "description";
    text.split(/\n/).forEach((line) => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("ноти:") || lower.startsWith("notes:")) {
        current = "notes";
        return;
      }
      if (lower.startsWith("склад:") || lower.startsWith("ingredients:") || lower.startsWith("інгредієнти:")) {
        current = "ingredients";
        return;
      }
      if (trimmed) sections[current].push(trimmed);
    });
    return sections;
  };

  const descSections = parseDescription(description);

  return (
    <div className="container-page py-12">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--azure)]"
      >
        ← {t("back")}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Product Image with Cutout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {product.is_set && (
            <span className="glass absolute left-4 top-4 z-10 rounded-full border border-[var(--gl)] px-3 py-1.5 text-xs font-semibold text-[var(--gold)]">
              🎁 {t("set_badge")}
            </span>
          )}
          {product.is_on_sale && (
            <span className="absolute right-4 top-4 z-10 rounded-full bg-[var(--sale)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              Sale -{Math.floor(product.discount_percent)}%
            </span>
          )}

          <div className="aspect-[3/4] relative overflow-hidden">
            {/* Floating cutout image */}
            {hasCutout && (
              <motion.img
                src={cutoutSrc(product.id)}
                alt={name}
                className="absolute inset-0 h-full w-full object-contain"
                style={{ transition: "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
                initial={{ scale: 1.02, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                onError={() => setHasCutout(false)}
              />
            )}
            {/* Fallback original image with mix-blend-multiply */}
            {!hasCutout && (
              <div className="pic absolute inset-0">
                <img
                  src={product.image}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-contain p-6"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
                  }}
                />
              </div>
            )}
            {/* Subtle glow behind product */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 bg-gradient-to-t from-[var(--gold)]/20 to-transparent rounded-full blur-[80px]" />
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="tile pearl-edge flex flex-col"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--azure)]">
            {product.brand}
          </div>
          <h1 className="section-title mt-2 !text-3xl sm:!text-4xl">{name}</h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            {product.is_on_sale ? (
              <>
                <span className="price-new !text-3xl">
                  {formatPrice(price)} {tCommon("currency")}
                </span>
                <span className="price-old !text-lg">
                  {formatPrice(product.price)} {tCommon("currency")}
                </span>
                <span className="ml-auto rounded-full bg-[var(--sale)]/10 px-3 py-1 text-sm font-bold text-[var(--sale)]">
                  -{Math.floor(product.discount_percent)}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-semibold">
                {formatPrice(product.price)} {tCommon("currency")}
              </span>
            )}
          </div>

          {product.is_set && setComponents.length > 0 && (
            <div className="mt-7">
              <h2 className="section-label flex items-center gap-2">
                <span className="text-[var(--gold)]">●</span>
                {t("set_contents")}
              </h2>
              <ul className="mt-3 space-y-2">
                {setComponents.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/product/${encodeURIComponent(item.id)}`}
                      className="tile flex items-center gap-3 !p-2 transition hover:border-[var(--azure)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={localizedField(item, "name", locale)}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
                        }}
                      />
                      <span className="line-clamp-2 flex-1 text-sm">
                        {localizedField(item, "name", locale)}
                      </span>
                      <span className="shrink-0 text-sm font-medium">
                        {formatPrice(item.promo_price ?? item.price)} {tCommon("currency")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <dl className="mt-7 grid grid-cols-2 gap-4 border-y border-[var(--gl)] py-5 text-sm">
            {specs.map((s) => (
              <div key={s.label}>
                <dt className="text-[var(--muted)]">{s.label}</dt>
                <dd className="mt-1 font-medium">{s.value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-[var(--muted)]">{t("availability")}</dt>
              <dd className="mt-1">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--glow)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--glow)]" />
                    {t("in_stock")}
                  </span>
                ) : (
                  <span className="font-medium text-[var(--muted)]">{t("out_of_stock")}</span>
                )}
              </dd>
            </div>
          </dl>

          {/* Beautiful Description & Notes Section */}
          <div className="mt-7 flex-1">
            <h2 className="section-label flex items-center gap-2">
              <span className="text-[var(--gold)]">●</span>
              {t("description")}
            </h2>

            {descSections.description.length > 0 && (
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
                {descSections.description.map((para, i) => (
                  <p key={i} className="last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {descSections.notes.length > 0 && (
              <div className="mt-6">
                <h3 className="section-label text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">
                  {t("notes") || "Ноти"}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {descSections.notes.map((note, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--ga)] border border-[var(--gl)] text-xs font-medium text-[var(--ink)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      {note}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {descSections.ingredients.length > 0 && (
              <div className="mt-6">
                <h3 className="section-label text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">
                  {t("ingredients") || "Склад"}
                </h3>
                <div className="mt-3">
                  <table className="w-full text-sm text-[var(--muted)]">
                    <tbody>
                      {descSections.ingredients.map((ing, i) => (
                        <tr key={i} className="border-b border-[var(--gl)]/30 last:border-0 hover:bg-[var(--ga)]">
                          <td className="py-2 px-3 font-medium text-[var(--ink)]">{ing}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]/30" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* If no structured sections, show raw description */}
            {Object.values(descSections).every((arr) => arr.length === 0) && (
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
                {description.split(/\n\s*\n/).map((para, i) => (
                  <p key={i} className="last:mb-0">
                    {para.split(/\n/).map((line, j) => (
                      <Fragment key={j}>
                        {line}
                        {j < para.split(/\n/).length - 1 && <br />}
                      </Fragment>
                    ))}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-primary flex-1 sm:flex-none"
              disabled={product.stock === 0}
              onClick={() => window.dispatchEvent(new CustomEvent("ai:open"))}
            >
              {product.stock > 0 ? t("buy") : t("out_of_stock")}
            </button>
            <button
              type="button"
              className="btn btn-ghost flex-1 sm:flex-none"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("ai:open", {
                    detail: { message: `${t("ask_ai")}: ${name}` },
                  })
                )
              }
            >
              {t("ask_ai")}
            </button>
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