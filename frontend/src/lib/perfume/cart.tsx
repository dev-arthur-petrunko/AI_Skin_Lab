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
import { useCart } from "@/providers/CartProvider";

export type PerfumeCartItem = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  promo_price: number | null;
  image: string;
  qty: number;
};

/** perfume lines live inside the site-wide cart under this id prefix */
const PREFIX = "perfume:";
/** previous standalone perfume-cart storage (migrated once on load) */
const LEGACY_KEY = "asl_perfume_cart_v1";

type CartCtx = {
  items: PerfumeCartItem[];
  hydrated: boolean;
  add: (item: Omit<PerfumeCartItem, "qty" | "promo_price"> & { promo_price?: number | null }, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const PerfumeCartContext = createContext<CartCtx | null>(null);

export function PerfumeCartProvider({ children }: { children: ReactNode }) {
  const main = useCart();
  const [hydrated, setHydrated] = useState(false);

  // one-time migration of carts saved before the merge with the site cart
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(LEGACY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const x of parsed) {
              if (!x || typeof x.slug !== "string") continue;
              main.add(
                {
                  id: PREFIX + x.slug,
                  name: String(x.name || ""),
                  sku: x.slug,
                  brand: String(x.brand || ""),
                  price: Number(x.price) || 0,
                  promo_price: null,
                  image: String(x.image || ""),
                },
                typeof x.qty === "number" && x.qty > 0 ? x.qty : 1
              );
            }
          }
          window.localStorage.removeItem(LEGACY_KEY);
        }
      } catch {
        /* corrupted storage — ignore */
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo<PerfumeCartItem[]>(
    () =>
      main.items
        .filter((x) => x.id.startsWith(PREFIX))
        .map((x) => ({
          slug: x.id.slice(PREFIX.length),
          name: x.name,
          brand: x.brand,
          price: x.promo_price ?? x.price,
          promo_price: x.promo_price,
          image: x.image,
          qty: x.qty,
        })),
    [main.items]
  );

  const add = useCallback(
    (
      item: Omit<PerfumeCartItem, "qty" | "promo_price"> & { promo_price?: number | null },
      qty = 1
    ) => {
      main.add(
        {
          id: PREFIX + item.slug,
          name: item.name,
          sku: item.slug,
          brand: item.brand,
          price: item.price,
          promo_price: item.promo_price ?? null,
          image: item.image,
        },
        qty
      );
      try {
        window.dispatchEvent(new CustomEvent("pf:cart-added", { detail: { slug: item.slug } }));
      } catch {
        /* non-browser environment */
      }
    },
    [main.add]
  );

  const setQty = useCallback(
    (slug: string, qty: number) => {
      if (qty <= 0) main.remove(PREFIX + slug);
      else main.setQty(PREFIX + slug, qty);
    },
    [main]
  );

  const remove = useCallback((slug: string) => main.remove(PREFIX + slug), [main]);

  const clear = useCallback(() => {
    for (const x of main.items) {
      if (x.id.startsWith(PREFIX)) main.remove(x.id);
    }
  }, [main]);

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
