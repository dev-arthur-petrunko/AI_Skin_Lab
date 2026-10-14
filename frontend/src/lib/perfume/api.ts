export type PerfumeNotes = { top: string[]; heart: string[]; base: string[] };

export type PerfumeItem = {
  slug: string;
  sku: string;
  name: string;
  display_name: string;
  brand: string;
  gender: string | null;
  type: string | null;
  price: number;
  promo_price: number | null;
  discount: number;
  in_stock: boolean;
  low_stock: number | null;
  volume_ml: number | null;
  country: string;
  families: string[];
  notes: PerfumeNotes;
  note_list: string[];
  description: string;
  has_photo: boolean;
};

export type PerfumeDetail = PerfumeItem & { similar: PerfumeItem[] };

export type FacetBucket = { value: string; count: number };
export type PerfumeFacets = {
  brands: FacetBucket[];
  genders: FacetBucket[];
  families: FacetBucket[];
  volumes: FacetBucket[];
  notes: FacetBucket[];
  price_range: { min: number; max: number };
};

export type PerfumeMeta = {
  count: number;
  brands: number;
  max_discount: number;
  last_updated: string | null;
  reason: string | null;
};

const BACKEND = process.env.BACKEND_URL || "http://backend:8000";

async function j<T>(path: string, revalidate = 30): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`perfumes ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export function getPerfumeMeta() {
  return j<PerfumeMeta>("/api/perfumes/meta", 30);
}

export function getPerfumeList(params: string) {
  return j<{ items: PerfumeItem[]; total: number; page: number; pages: number }>(
    `/api/perfumes${params ? `?${params}` : ""}`,
    30
  );
}

export function getPerfumeFacets(params: string) {
  return j<PerfumeFacets>(`/api/perfumes/facets${params ? `?${params}` : ""}`, 30);
}

export function getPerfume(slug: string) {
  return j<PerfumeDetail>(`/api/perfumes/${encodeURIComponent(slug)}`, 60);
}

export function perfumeImg(slug: string, w: 480 | 960 = 480) {
  return `/api/perfumes/image/${encodeURIComponent(slug)}?w=${w}`;
}
