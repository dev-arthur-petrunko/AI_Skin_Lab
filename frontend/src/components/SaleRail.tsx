"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "@/i18n/request";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export default function SaleRail({ products }: Props) {
  const t = useTranslations("sale");
  const dupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dupRef.current) dupRef.current.inert = true;
  }, []);

  if (products.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--muted)]">{t("empty")}</p>;
  }

  const duration = Math.max(40, products.length * 7);

  const group = (copy: string, duplicate: boolean) => (
    <div
      ref={duplicate ? dupRef : undefined}
      aria-hidden={duplicate || undefined}
      className="sale-rail-group"
    >
      {products.map((product, index) => (
        <div key={`${copy}-${product.id}`} className="sale-rail-item">
          <ProductCard product={product} index={index} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="sale-rail-wrap">
      <div
        className="sale-rail-track"
        style={{ animationDuration: `${duration}s` }}
      >
        {group("a", false)}
        {group("b", true)}
      </div>
    </div>
  );
}
