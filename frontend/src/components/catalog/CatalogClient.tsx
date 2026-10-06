"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import type { CatalogResponse, Product, SortOption } from "@/lib/types";

interface Props {
  initial: CatalogResponse | null;
}

const PAGE_SIZE = 12;

export default function CatalogClient({ initial }: Props) {
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [onSale, setOnSale] = useState(searchParams.get("sale") === "1");
  const [sort, setSort] = useState<SortOption>("default");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const items = initial?.items ?? [];
  const brands = initial?.brands ?? [];
  const categories = initial?.categories ?? [];

  const filtered = useMemo(() => {
    let result = items;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description_uk.toLowerCase().includes(q)
      );
    }
    if (brand) result = result.filter((p) => p.brand === brand);
    if (category) result = result.filter((p) => p.category === category);
    if (onSale) result = result.filter((p) => p.is_on_sale);

    switch (sort) {
      case "price_asc":
        result = [...result].sort((a, b) => (a.promo_price ?? a.price) - (b.promo_price ?? b.price));
        break;
      case "price_desc":
        result = [...result].sort((a, b) => (b.promo_price ?? b.price) - (a.promo_price ?? a.price));
        break;
      case "discount":
        result = [...result].sort((a, b) => b.discount_percent - a.discount_percent);
        break;
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [items, search, brand, category, onSale, sort]);

  const reset = () => {
    setSearch("");
    setBrand("");
    setCategory("");
    setOnSale(false);
    setSort("default");
    setVisible(PAGE_SIZE);
  };

  const hasFilters = search || brand || category || onSale || sort !== "default";


  return (
    <div className="container-page py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="section-label">{t("title")}</span>
        <h1 className="section-title mt-2">{t("subtitle")}</h1>
      </motion.div>

      <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-espresso/5 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder={t("search")}
            className="input"
          />

          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="select"
            aria-label={t("brand")}
          >
            <option value="">
              {t("brand")}: {t("all")}
            </option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select"
            aria-label={t("category")}
          >
            <option value="">
              {t("category")}: {t("all")}
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="select"
            aria-label={t("sort")}
          >
            <option value="default">{t("sort_default")}</option>
            <option value="price_asc">{t("sort_price_asc")}</option>
            <option value="price_desc">{t("sort_price_desc")}</option>
            <option value="discount">{t("sort_discount")}</option>
            <option value="name">{t("sort_name")}</option>
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOnSale((v) => !v)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                onSale
                  ? "bg-berry text-white shadow-md shadow-berry/30"
                  : "border border-espresso/15 text-espresso/70 hover:border-berry/50 hover:text-berry"
              }`}
            >
              🔥 {t("on_sale")}
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-espresso/15 px-4 py-2.5 text-sm text-espresso/60 transition hover:border-espresso/40"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>


      <div className="mt-6 flex items-center justify-between text-sm text-espresso/60">
        <span>
          {filtered.length} {t("results_many")}
        </span>
        {initial && initial.last_updated && (
          <span className="text-xs">
            {new Date(initial.last_updated).toLocaleString("uk-UA")}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-espresso/60">{t("empty")}</div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.slice(0, visible).map((product: Product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="btn-ghost"
              >
                {t("load_more")} ↓
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
