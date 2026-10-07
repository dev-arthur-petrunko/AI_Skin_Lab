"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/request";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { pluralUk } from "@/lib/format";
import type { CatalogResponse, Product, SortOption } from "@/lib/types";

interface Props {
  initial: CatalogResponse | null;
}

const PAGE_SIZE = 12;

export default function CatalogClient({ initial }: Props) {
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [onSale, setOnSale] = useState(searchParams.get("sale") === "1");
  const [sort, setSort] = useState<SortOption>("default");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const items = useMemo(() => initial?.items ?? [], [initial]);
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
          p.category.toLowerCase().includes(q) ||
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
        <h1 className="section-title">Каталог</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {filtered.length} {pluralUk(filtered.length, [t("results_one"), t("results_few"), t("results_many")])}
          {initial?.last_updated && (
            <> · оновлено {new Date(initial.last_updated).toLocaleString("uk-UA", { dateStyle: "medium" })}</>
          )}
        </p>
      </motion.div>

      <div className="sticky top-20 z-10 tile mt-8 p-4 sm:p-5">
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
              className="chip-f"
              aria-pressed={onSale}
            >
              {t("on_sale")}
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className="chip-f"
                aria-pressed={false}
                aria-label={t("reset")}
                title={t("reset")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-[var(--muted)]">{t("empty")}</div>
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
                className="btn btn-ghost"
              >
                {t("load_more")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
