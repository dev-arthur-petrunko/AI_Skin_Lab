"use client";

import { Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { perfumeImg, type PerfumeItem } from "@/lib/perfume/api";
import { usePerfumeCart } from "@/lib/perfume/cart";
import { T } from "@/lib/perfume/texts";

export default function AddToCartButton({ item }: { item: PerfumeItem }) {
  const { items, add, setQty } = usePerfumeCart();
  const inCart = items.find((x) => x.slug === item.slug);
  const price = item.promo_price ?? item.price;

  if (!item.in_stock) {
    return (
      <span className="pf-stock is-out" style={{ position: "static", display: "inline-block" }}>
        {T.out_of_stock}
      </span>
    );
  }

  if (inCart) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-3 py-2">
        <button
          type="button"
          aria-label="−"
          onClick={() => setQty(inCart.slug, inCart.qty - 1)}
          disabled={inCart.qty <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--gold)] transition hover:bg-[var(--gold)]/20 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold uppercase tracking-wider text-[var(--gold)]">
          {inCart.qty} × {formatPrice(price)} {T.currency}
        </span>
        <button
          type="button"
          aria-label="+"
          onClick={() => setQty(inCart.slug, inCart.qty + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-primary w-full"
      onClick={() => {
        add(
          {
            slug: item.slug,
            name: item.display_name || item.name,
            brand: item.brand,
            price,
            image: perfumeImg(item.slug, 480),
          },
          1
        );
        try {
          if (navigator.vibrate) navigator.vibrate(15);
        } catch {
          /* vibration not available */
        }
      }}
    >
      {T.add}
    </button>
  );
}
