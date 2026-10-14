"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { perfumeImg, type PerfumeItem } from "@/lib/perfume/api";
import { usePerfumeCart } from "@/lib/perfume/cart";
import { T } from "@/lib/perfume/texts";

export function StockBadge({ item }: { item: PerfumeItem }) {
  if (!item.in_stock) {
    return <span className="pf-stock is-out">{T.out_of_stock}</span>;
  }
  if (item.low_stock !== null && item.low_stock > 0) {
    return (
      <span className="pf-stock is-low">
        {T.low_stock.replace("{n}", String(item.low_stock))}
      </span>
    );
  }
  return null;
}

export default function PerfumeCard({ item }: { item: PerfumeItem }) {
  const { items, add, setQty } = usePerfumeCart();
  const inCart = items.find((x) => x.slug === item.slug);
  const price = item.promo_price ?? item.price;
  const hasSale = Boolean(item.discount && item.promo_price);

  const handleAdd = () => {
    if (!item.in_stock) return;
    if (navigator.vibrate) navigator.vibrate(15);
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
  };

  return (
    <div className="pf-card tile pearl-edge !p-0">
      <Link href={`/perfume/${encodeURIComponent(item.slug)}`} className="flex h-full flex-col">
        <div className="pf-card-media">
          {hasSale && (
            <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-[var(--sale)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              −{item.discount}%
            </span>
          )}
          <StockBadge item={item} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={perfumeImg(item.slug, 480)}
            alt={item.display_name || item.name}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
            }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-4 pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--azure)]">
            {item.brand}
          </span>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">
            {item.display_name || item.name}
          </h3>
          <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
            {hasSale ? (
              <>
                <span className="price-new">{formatPrice(price)} {T.currency}</span>
                <span className="price-old">{formatPrice(item.price)} {T.currency}</span>
              </>
            ) : (
              <span className="text-lg font-semibold">
                {formatPrice(price)} {T.currency}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        {inCart ? (
          <div className="flex items-center justify-between rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-2 py-1.5">
            <button
              type="button"
              aria-label="−"
              onClick={() => setQty(inCart.slug, inCart.qty - 1)}
              disabled={inCart.qty <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gold)] transition hover:bg-[var(--gold)]/20 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[86px] text-center text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
              {inCart.qty}
            </span>
            <button
              type="button"
              aria-label="+"
              onClick={() => setQty(inCart.slug, inCart.qty + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary w-full py-2 text-xs sm:text-sm"
            onClick={handleAdd}
            disabled={!item.in_stock}
          >
            {item.in_stock ? T.add : T.out_of_stock}
          </button>
        )}
      </div>
    </div>
  );
}
