import "server-only";
import type { CatalogResponse, Product } from "./types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export const API_TIMEOUT = 8000;

async function fetchJson<T>(url: string, revalidate = 60): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`Backend responded ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function getCatalog(): Promise<CatalogResponse> {
  return fetchJson<CatalogResponse>(`${BACKEND_URL}/api/catalog`, 30);
}

export async function getProduct(id: string): Promise<Product> {
  return fetchJson<Product>(`${BACKEND_URL}/api/catalog/${encodeURIComponent(id)}`, 60);
}

export async function getSaleProducts(limit = 10): Promise<Product[]> {
  return fetchJson<Product[]>(`${BACKEND_URL}/api/catalog/sale?limit=${limit}`, 30);
}

export async function getCutoutIds(): Promise<Set<string>> {
  try {
    const data = await fetchJson<{ ids: string[] }>(`${BACKEND_URL}/api/cutouts`, 60);
    return new Set(data.ids);
  } catch {
    return new Set<string>();
  }
}

export { BACKEND_URL };
