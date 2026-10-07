"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import { useTranslations } from "@/i18n/request";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export default function SaleRail({ products }: Props) {
  const t = useTranslations("sale");

  if (products.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--muted)]">{t("empty")}</p>;
  }

  return (
    <Swiper
      modules={[FreeMode]}
      freeMode={{ momentum: true, sticky: true }}
      grabCursor
      spaceBetween={20}
      slidesPerView={1.15}
      breakpoints={{
        640: { slidesPerView: 2.3 },
        1024: { slidesPerView: 3.4 },
        1280: { slidesPerView: 4.4 },
      }}
      className="!pb-4"
    >
      {products.map((product, index) => (
        <SwiperSlide key={product.id} className="!h-auto">
          <ProductCard product={product} index={index} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
