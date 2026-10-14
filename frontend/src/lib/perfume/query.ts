export type PerfumeQuery = {
  q?: string;
  brand?: string;
  gender?: string;
  family?: string;
  note?: string;
  volume?: string;
  price_min?: string;
  price_max?: string;
  sale?: string;
  in_stock?: string;
  sort?: string;
  page?: string;
};

const KEYS: (keyof PerfumeQuery)[] = [
  "q", "brand", "gender", "family", "note", "volume",
  "price_min", "price_max", "sale", "in_stock", "sort", "page",
];

export function normalizeQuery(raw: Record<string, string | string[] | undefined>): PerfumeQuery {
  const out: PerfumeQuery = {};
  for (const k of KEYS) {
    const v = raw[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s) out[k] = String(s);
  }
  if (out.page === "1") delete out.page;
  if (out.sort === "default") delete out.sort;
  if (out.sale === "0") delete out.sale;
  if (out.in_stock === "0") delete out.in_stock;
  return out;
}

export function toSearchParams(q: PerfumeQuery): string {
  const usp = new URLSearchParams();
  for (const k of KEYS) {
    const v = q[k];
    if (v) usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export function hasActiveFilters(q: PerfumeQuery): boolean {
  return KEYS.some((k) => k !== "sort" && k !== "page" && Boolean(q[k]));
}
