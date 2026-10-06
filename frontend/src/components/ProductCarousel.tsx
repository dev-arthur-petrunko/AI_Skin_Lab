"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useTranslations } from "next-intl";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export default function ProductCarousel({ products }: Props) {
  const t = useTranslations("sale");

  if (products.length === 0) {
    return <p className="text-sm text-espresso/60">{t("empty")}</p>;
  }

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      spaceBetween={24}
      slidesPerView={1.15}
      pagination={{ clickable: true }}
      navigation
      loop={products.length > 4}
      autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
      breakpoints={{
        640: { slidesPerView: 2.2 },
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
