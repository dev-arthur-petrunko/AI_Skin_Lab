"use client";

import { useEffect, useMemo, useState } from "react";
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

function skinMatch(p: Product, skin: string): boolean {
  if (!skin) return true;
  const st = p.skin_types ?? [];
  if (!st.length || st.includes("Всі типи") || st.includes(skin)) return true;
  return false;
}

function purposeMatch(p: Product, purpose: string): boolean {
  if (!purpose) return true;
  const pr = p.purposes ?? [];
  if (!pr.length || pr.includes(purpose)) return true;
  return false;
}

function matchScore(p: Product, skin: string, purpose: string): number {
  let s = 0;
  const st = p.skin_types ?? [];
  if (skin && st.length) {
    if (st.includes(skin)) s += 4;
    else if (st.includes("Всі типи")) s += 1;
  }
  if (purpose && (p.purposes ?? []).includes(purpose)) s += 2;
  return s;
}

export default function CatalogClient({ initial }: Props) {
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [onSale, setOnSale] = useState(searchParams.get("sale") === "1");
  const [onlySets, setOnlySets] = useState(searchParams.get("sets") === "1");
  const [skin, setSkin] = useState(() => searchParams.get("skin") ?? "");
  const [purpose, setPurpose] = useState(() => searchParams.get("purpose") ?? "");
  const [sort, setSort] = useState<SortOption>("default");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setOnSale(searchParams.get("sale") === "1");
    setOnlySets(searchParams.get("sets") === "1");
    setSkin(searchParams.get("skin") ?? "");
    setPurpose(searchParams.get("purpose") ?? "");
    setVisible(PAGE_SIZE);
  }, [searchParams]);

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
    if (onlySets) result = result.filter((p) => p.is_set);
    if (skin) result = result.filter((p) => skinMatch(p, skin));
    if (purpose) result = result.filter((p) => purposeMatch(p, purpose));

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
      default:
        if (skin || purpose) {
          result = [...result].sort(
            (a, b) =>
              matchScore(b, skin, purpose) - matchScore(a, skin, purpose) ||
              a.name.localeCompare(b.name)
          );
        }
        break;
    }

    return result;
  }, [items, search, brand, category, onSale, onlySets, skin, purpose, sort]);

  const reset = () => {
    setSearch("");
    setBrand("");
    setCategory("");
    setOnSale(false);
    setOnlySets(false);
    setSkin("");
    setPurpose("");
    setSort("default");
    setVisible(PAGE_SIZE);
  };

  const hasFilters =
    search || brand || category || onSale || onlySets || skin || purpose || sort !== "default";


  return (
    <div className="container-page py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="section-title">Каталог</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {initial !== null && (
            <>
              {filtered.length} {pluralUk(filtered.length, [t("results_one"), t("results_few"), t("results_many")])}
            </>
          )}
          {initial?.last_updated && (
            <> · оновлено {new Date(initial.last_updated).toLocaleString("uk-UA", { dateStyle: "medium" })}</>
          )}
        </p>

        {(skin || purpose) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {skin && (
              <button
                type="button"
                onClick={() => setSkin("")}
                className="chip-f !border-[var(--gold)] !text-[var(--noir)]"
                style={{ background: "var(--gold-gradient)" }}
                aria-label={`${t("direction_clear")}: ${skin}`}
              >
                {skin} ✕
              </button>
            )}
            {purpose && (
              <button
                type="button"
                onClick={() => setPurpose("")}
                className="chip-f !border-[var(--gold)] !text-[var(--noir)]"
                style={{ background: "var(--gold-gradient)" }}
                aria-label={`${t("direction_clear")}: ${purpose}`}
              >
                {purpose} ✕
              </button>
            )}
          </div>
        )}
      </motion.div>

      <div className="z-10 tile mt-8 p-4 sm:p-5 lg:sticky lg:top-20 lg:p-2">
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
            <button
              type="button"
              onClick={() => setOnlySets((v) => !v)}
              className="chip-f"
              aria-pressed={onlySets}
            >
              🎁 {t("sets_chip")}
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

      {initial === null ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-[var(--muted)]">{t("load_error")}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
            {t("retry")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
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
