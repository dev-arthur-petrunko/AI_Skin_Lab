"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductDetailView from "@/components/product/ProductDetailView";
import type { Product } from "@/lib/types";

interface Props {
  params: { id: string };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

interface Props {
  params: { id: string };
}

export default function ProductPage({ params: { id } }: Props) {
  const searchParams = useSearchParams();
  const autoOpenOrder = searchParams.get("order") === "1";
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [setComponents, setSetComponents] = useState<Product[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(autoOpenOrder);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [prod, cat] = await Promise.all([
          fetchJson<Product>(`${BACKEND_URL}/api/catalog/${id}`),
          fetchJson<{ items: Product[] }>(`${BACKEND_URL}/api/catalog`),
        ]);
        setProduct(prod);
        const rel = cat.items
          .filter((p) => p.id !== prod.id && (p.category === prod.category || p.brand === prod.brand))
          .slice(0, 4);
        setRelated(rel);
        if (prod.is_set && prod.set_items?.length) {
          const byId = new Map(cat.items.map((p) => [p.id, p]));
          setSetComponents(prod.set_items.map((sid) => byId.get(sid)).filter((p): p is NonNullable<typeof p> => Boolean(p)));
        }
      } catch {
        notFound();
      } finally {
        setLoaded(true);
      }
    }
    loadData();
  }, [id]);

  if (!loaded) {
    return <div className="container-page py-20 text-center text-[var(--muted)]">Завантаження…</div>;
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} related={related} setComponents={setComponents} initialOpenOrder={showOrderModal} onCloseOrder={() => setShowOrderModal(false)} />;
}
