"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/i18n/request";
import { pluralUk } from "@/lib/format";

export type CategoryTileData = {
  name: string;
  count: number;
  image: string;
  isCutout: boolean;
};

interface Props {
  categories: CategoryTileData[];
}

export default function CategoriesSection({ categories }: Props) {
  const t = useTranslations("categories");

  return (
    <section className="container-page mt-14 sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <span className="section-label">{t("eyebrow")}</span>
          <h2 className="section-title mt-2">{t("title")}</h2>
        </div>
        <p className="max-w-sm text-sm text-[var(--muted)]">{t("subtitle")}</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <CategoryTile key={cat.name} cat={cat} index={i} />
        ))}
      </div>
    </section>
  );
}

function CategoryTile({ cat, index }: { cat: CategoryTileData; index: number }) {
  const t = useTranslations("categories");
  const word = pluralUk(cat.count, [t("items_one"), t("items_few"), t("items_many")]);
  const reduce = useReducedMotion();

  const { scrollY } = useScroll({ target: undefined, offset: ["start end", "end start"] });
  const y = useTransform(scrollY, [0, 1], [20, -20]);
  const tileStyle = reduce ? {} : { y };

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
  };
  const reset = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      style={{ perspective: "900px", ...tileStyle }}
    >
      <Link
        href={`/catalog?q=${encodeURIComponent(cat.name)}`}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        className="cat-tile group relative flex h-full min-h-[190px] flex-col justify-between overflow-hidden rounded-[28px] p-5 sm:min-h-[230px] sm:p-6"
      >
        <div className="relative z-10">
          <div className="font-serif text-xl leading-tight sm:text-[26px]">{cat.name}</div>
          <div className="mt-1.5 text-[13px] text-[var(--muted)]">
            {cat.count} {word}
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-8 -right-6 h-[68%] w-[64%] rotate-[14deg] transition-transform duration-500 group-hover:-translate-y-3 group-hover:rotate-[6deg]">
          <Image
            src={cat.isCutout ? cat.image : cat.image}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, 22vw"
            className={`object-contain drop-shadow-[0_18px_26px_rgba(58,42,30,.28)] ${
              cat.isCutout ? "" : "rounded-2xl bg-white p-2 mix-blend-multiply"
            }`}
          />
        </div>

        <span className="cat-shine" aria-hidden />
      </Link>
    </motion.div>
  );
}
