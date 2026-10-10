export interface Product {
  id: string;
  sku: string;
  name: string;
  name_uk: string;
  name_ru: string;
  name_en: string;
  brand: string;
  category: string;
  price: number;
  promo_price: number | null;
  discount_percent: number;
  stock: number;
  volume: string;
  country: string;
  description_uk: string;
  description_ru: string;
  description_en: string;
  image: string;
  has_image: boolean;
  is_on_sale: boolean;
  tags: string[];
  is_set?: boolean;
  set_items?: string[];
}

export interface CatalogResponse {
  items: Product[];
  total: number;
  brands: string[];
  categories: string[];
  last_updated: string;
}

export interface ChatProductCard {
  id: string;
  name: string;
  brand: string;
  price: number;
  promo_price: number | null;
  image: string;
  discount_percent: number;
  reason?: string;
}

export interface ChatResponse {
  reply: string;
  products: ChatProductCard[];
}

export type SortOption =
  | "default"
  | "price_asc"
  | "price_desc"
  | "discount"
  | "name";

export function localizedField(
  product: Product,
  field: "name" | "description",
  lang: string
): string {
  if (field === "name") {
    if (lang === "ru" && product.name_ru) return product.name_ru;
    if (lang === "en" && product.name_en) return product.name_en;
    return product.name_uk || product.name;
  }
  if (lang === "ru" && product.description_ru) return product.description_ru;
  if (lang === "en" && product.description_en) return product.description_en;
  return product.description_uk;
}
