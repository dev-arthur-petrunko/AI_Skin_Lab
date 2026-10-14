"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PerfumeCartItem = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  qty: number;
};

const STORAGE_KEY = "asl_perfume_cart_v1";

type CartCtx = {
  items: PerfumeCartItem[];
  hydrated: boolean;
  add: (item: Omit<PerfumeCartItem, "qty">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const PerfumeCartContext = createContext<CartCtx | null>(null);

export function PerfumeCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PerfumeCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (x): x is PerfumeCartItem =>
                x && typeof x.slug === "string" && typeof x.qty === "number"
            )
          );
        }
      }
    } catch {
      /* corrupted storage — start empty */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full/unavailable */
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<PerfumeCartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((x) => x.slug === item.slug);
      if (found) {
        return prev.map((x) =>
          x.slug === item.slug ? { ...x, qty: Math.min(99, x.qty + qty) } : x
        );
      }
      return [...prev, { ...item, qty: Math.max(1, qty) }];
    });
    try {
      window.dispatchEvent(new CustomEvent("pf:cart-added", { detail: { slug: item.slug } }));
    } catch {
      /* non-browser environment */
    }
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((x) => x.slug !== slug)
        : prev.map((x) => (x.slug === slug ? { ...x, qty: Math.min(99, qty) } : x))
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((x) => x.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, x) => s + x.qty, 0);
    const total = items.reduce((s, x) => s + x.qty * x.price, 0);
    return { items, hydrated, add, setQty, remove, clear, count, total };
  }, [items, hydrated, add, setQty, remove, clear]);

  return <PerfumeCartContext.Provider value={value}>{children}</PerfumeCartContext.Provider>;
}

export function usePerfumeCart(): CartCtx {
  const ctx = useContext(PerfumeCartContext);
  if (!ctx) throw new Error("usePerfumeCart must be used inside PerfumeCartProvider");
  return ctx;
}
