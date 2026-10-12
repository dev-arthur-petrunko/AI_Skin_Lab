"use client";

import { useLocale, useTranslations } from "@/i18n/request";
import { formatPrice } from "@/lib/format";
import { cutoutSrc } from "@/lib/cutouts";
import { localizedField, type Product } from "@/lib/types";
import { useCart } from "@/providers/CartProvider";
import { useOrderModal } from "@/providers/OrderModalProvider";
import { ShoppingCart, MessageSquare } from "lucide-react";

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const t = useTranslations("card");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { add } = useCart();
  const { open } = useOrderModal();

  const name = localizedField(product, "name", locale);
  const price = product.promo_price ?? product.price;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 10;
    el.style.setProperty("--gx", `${x}px`);
    el.style.setProperty("--gy", `${y}px`);
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      id: product.id,
      name: localizedField(product, "name", locale),
      sku: product.sku,
      price: product.promo_price ?? product.price,
      promo_price: product.promo_price,
      brand: product.brand,
      image: product.image,
    }, 1);
    open(product);
  };

  const productUrl = `/product/${encodeURIComponent(product.id)}`;

  return (
    <div className="h-full" onMouseMove={handleMove}>
      <a
        href={productUrl}
        className={`tile pearl-edge group relative flex h-full flex-col overflow-hidden !p-0 ${
          product.is_on_sale ? "is-sale" : ""
        }`}
      >
        {product.is_set && (
          <span className="glass absolute left-3 top-3 z-10 rounded-full border border-[var(--gl)] px-2.5 py-1 text-[11px] font-semibold text-[var(--gold)]">
            🎁 {t("set_badge")}
          </span>
        )}
        {product.is_on_sale && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-[var(--sale)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            {t("badge")}
          </span>
        )}

        <div className="pic relative aspect-[4/5] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cutoutSrc(product.id)}
            alt={name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              if (el.dataset.fallback !== "original") {
                el.dataset.fallback = "original";
                el.src = product.image;
              } else {
                el.src = "/images/placeholder.svg";
              }
            }}
          />
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-center text-xs font-medium text-white transition-transform duration-300 group-hover:translate-y-0">
            {t("view")}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--azure)]">
            {product.brand}
          </div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{name}</h3>

          <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
            {product.is_on_sale ? (
              <>
                <span className="price-new">
                  {formatPrice(price)} {tCommon("currency")}
                </span>
                <span className="price-old">
                  {formatPrice(product.price)} {tCommon("currency")}
                </span>
                <span className="ml-auto rounded-full bg-[var(--sale)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--sale)]">
                  {t("discount", { value: Math.floor(product.discount_percent) })}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold">
                {formatPrice(product.price)} {tCommon("currency")}
              </span>
            )}
          </div>
        </div>
      </a>

      <div className="flex flex-col gap-2 px-4 pb-4">
        <button
          type="button"
          className="btn btn-primary w-full text-center py-2 text-xs sm:text-sm"
          onClick={handleOrderClick}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? t("buy") : t("out_of_stock")}
        </button>
        <button
          type="button"
          className="btn btn-secondary w-full text-center py-2 text-xs sm:text-sm"
          onClick={handleOrderClick}
          disabled={product.stock === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Замовити в Telegram
        </button>
        <a
          href="https://www.instagram.com/ai_skin_lab?exln=MXJlbTE4b25vdGNsMQ%3D%3D&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost w-full text-center py-2 text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Instagram
        </a>
      </div>
    </div>
  );
}