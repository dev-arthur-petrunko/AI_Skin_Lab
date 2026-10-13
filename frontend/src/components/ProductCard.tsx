"use client";

import { useLocale, useTranslations } from "@/i18n/request";
import { formatPrice } from "@/lib/format";
import { localizedField, type Product } from "@/lib/types";
import { useCart } from "@/providers/CartProvider";
import { Minus, Plus } from "lucide-react";

interface Props {
  product: Product;
  index?: number;
}

function flyToCart(from: HTMLElement, imgSrc: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.getElementById("header-cart");
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const ghost = document.createElement("div");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - 24}px`,
    top: `${a.top + a.height / 2 - 24}px`,
    width: "48px",
    height: "48px",
    backgroundImage: `url(${imgSrc})`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    borderRadius: "50%",
    zIndex: "9999",
    pointerEvents: "none",
    transition: "transform 0.65s cubic-bezier(.4,.2,.2,1), opacity 0.65s ease",
    transform: "translate(0,0) scale(1)",
    opacity: "1",
  } as CSSStyleDeclaration);
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.18)`;
    ghost.style.opacity = "0.25";
  });
  window.setTimeout(() => ghost.remove(), 700);
}

export default function ProductCard({ product, index = 0 }: Props) {
  const t = useTranslations("card");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { items, add, setQty } = useCart();

  const name = localizedField(product, "name", locale);
  const price = product.promo_price ?? product.price;
  const inCart = items.find((x) => x.id === product.id);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 10;
    el.style.setProperty("--gx", `${x}px`);
    el.style.setProperty("--gy", `${y}px`);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    const img = (e.currentTarget as HTMLElement)
      .closest("div.h-full")
      ?.querySelector("img") as HTMLImageElement | null;
    if (img) flyToCart(img, img.src);
    if (navigator.vibrate) navigator.vibrate(15);
    add(
      {
        id: product.id,
        name,
        sku: product.sku,
        price: product.promo_price ?? product.price,
        promo_price: product.promo_price,
        brand: product.brand,
        image: product.image,
      },
      1
    );
  };

  const productUrl = `/product/${encodeURIComponent(product.id)}`;

  return (
    <div className="flex h-full flex-col" onMouseMove={handleMove}>
      <a
        href={productUrl}
        className={`tile pearl-edge group relative flex flex-1 flex-col overflow-hidden !p-0 ${
          product.is_on_sale ? "is-sale" : ""
        }`}
      >
        {product.is_set && (
          <span className="glass absolute left-3 top-3 z-10 rounded-full border border-[var(--gl)] px-2.5 py-1 text-[11px] font-semibold text-[var(--gold)]">
            рџЋЃ {t("set_badge")}
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
            src={product.image}
            alt={name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
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
        {inCart ? (
          <div className="flex items-center justify-between rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-2 py-1.5">
            <button
              type="button"
              aria-label="-"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(inCart.id, inCart.qty - 1); }}
              disabled={inCart.qty <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gold)] transition hover:bg-[var(--gold)]/20 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[92px] text-center text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
              {t("in_cart")} В· {inCart.qty}
            </span>
            <button
              type="button"
              aria-label="+"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(inCart.id, inCart.qty + 1); }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary w-full py-2 text-center text-xs sm:text-sm"
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {product.stock > 0 ? t("buy") : t("out_of_stock")}
          </button>
        )}
      </div>
    </div>
  );
}