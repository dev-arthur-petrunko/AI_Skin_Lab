export const SKIN_TYPES = [
  "Нормальна", "Суха", "Жирна", "Комбінована", "Чутлива", "Проблемна", "Всі типи",
];

export const PURPOSES = [
  "Зволоження", "Відновлення", "Заспокоєння та почервоніння",
  "Освітлення та пігментація", "Антивіковий догляд", "Антиоксидантний захист",
  "Очищення", "Освіження та тонізація", "Матування та пори",
  "Акне та проблемна шкіра", "Сонцезахист", "Догляд за очима",
  "Делікатні зони",
];

export const SORT_VALUES = [
  "default", "price_asc", "price_desc", "discount", "name",
] as const;

export interface CatalogFilters {
  q: string;
  brand: string;
  category: string;
  sale: boolean;
  sets: boolean;
  skin: string;
  purpose: string;
  sort: string;
}

export const CATALOG_SNAPSHOT_KEY = "asl_catalog_filters.v1";

export function filtersToQuery(f: CatalogFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.brand) p.set("brand", f.brand);
  if (f.category) p.set("category", f.category);
  if (f.sale) p.set("sale", "1");
  if (f.sets) p.set("sets", "1");
  if (f.skin) p.set("skin", f.skin);
  if (f.purpose) p.set("purpose", f.purpose);
  if (f.sort && f.sort !== "default") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function writeCatalogSnapshot(f: CatalogFilters): void {
  try {
    window.sessionStorage.setItem(CATALOG_SNAPSHOT_KEY, JSON.stringify(f));
  } catch {
    // sessionStorage unavailable (private mode) — back link just loses filters
  }
}

export function readCatalogSnapshot(): CatalogFilters | null {
  try {
    const raw = window.sessionStorage.getItem(CATALOG_SNAPSHOT_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as Partial<CatalogFilters>;
    return {
      q: typeof f.q === "string" ? f.q : "",
      brand: typeof f.brand === "string" ? f.brand : "",
      category: typeof f.category === "string" ? f.category : "",
      sale: f.sale === true,
      sets: f.sets === true,
      skin: typeof f.skin === "string" ? f.skin : "",
      purpose: typeof f.purpose === "string" ? f.purpose : "",
      sort: typeof f.sort === "string" && (SORT_VALUES as readonly string[]).includes(f.sort)
        ? f.sort
        : "default",
    };
  } catch {
    return null;
  }
}
