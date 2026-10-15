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
  purposes?: string[];
  skin_types?: string[];
  qty?: number;
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
  link?: string;
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
  _lang: string
): string {
  if (field === "name") return product.name_uk || product.name;
  return product.description_uk;
}
