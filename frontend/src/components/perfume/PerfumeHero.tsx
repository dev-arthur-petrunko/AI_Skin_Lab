"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { formatPrice } from "@/lib/format";
import { T } from "@/lib/perfume/texts";

export type PerfumeHeroItem = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  promo_price: number | null;
  discount: number;
};

type Props = {
  items: PerfumeHeroItem[];
  stats: { count: number; brands: number; maxDiscount: number };
};

const SLOTS = [
  { cls: "pf-slot-a", depth: 18, rot: -7, delay: 0 },
  { cls: "pf-slot-b", depth: 34, rot: 0, delay: 0.4 },
  { cls: "pf-slot-c", depth: 22, rot: 8, delay: 0.8 },
];

export default function PerfumeHero({ items, stats }: Props) {
  return (
    <section className="pf-hero pf-hero-grid">
      <div className="pf-hero-copy">
        <motion.span
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="section-label"
        >
          <span className="text-[var(--gold)]">●</span> {T.subtitle}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          className="section-title pf-hero-title mt-3"
        >
          {T.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="pf-hero-lead"
        >
          {T.hero_lead}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="pf-hero-stats"
        >
          <span className="pf-hero-stat"><b>{stats.count}</b> {T.aromatics}</span>
          <span className="pf-hero-stat"><b>{stats.brands}</b> {T.brands_word}</span>
          {stats.maxDiscount > 0 && (
            <span className="pf-hero-stat">{T.up_to.replace("{n}", String(stats.maxDiscount))}</span>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.68 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          <a href="#pf-collection" className="btn btn-primary">{T.cta_pick}</a>
          <a href="/perfume?sale=1#pf-collection" className="btn btn-ghost">{T.cta_sale}</a>
        </motion.div>
      </div>

      <div className="pf-hero-stage">
        {items.length > 0 && <HeroCluster items={items} />}
      </div>
    </section>
  );
}

function HeroCluster({ items }: { items: PerfumeHeroItem[] }) {
  const reduce = useReducedMotion();
  const [parallax, setParallax] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 18 });
  const sy = useSpring(my, { stiffness: 70, damping: 18 });

  useEffect(() => {
    setParallax(
      !reduce && window.matchMedia("(hover: hover)").matches && window.innerWidth >= 768
    );
  }, [reduce]);

  return (
    <div
      className="absolute inset-0"
      onPointerMove={
        parallax
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              mx.set((e.clientX - r.left) / r.width - 0.5);
              my.set((e.clientY - r.top) / r.height - 0.5);
            }
          : undefined
      }
      onPointerLeave={
        parallax
          ? () => {
              mx.set(0);
              my.set(0);
            }
          : undefined
      }
    >
      <div aria-hidden className="pf-hero-glow" />
      {items.slice(0, 3).map((p, i) => (
        <Layer key={p.slug} item={p} slot={SLOTS[i]} sx={sx} sy={sy} i={i} />
      ))}
    </div>
  );
}

function Layer({
  item,
  slot,
  sx,
  sy,
  i,
}: {
  item: PerfumeHeroItem;
  slot: (typeof SLOTS)[number];
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  i: number;
}) {
  const x = useTransform(sx, (v) => v * slot.depth * -2);
  const y = useTransform(sy, (v) => v * slot.depth * -2);
  const sale = item.promo_price != null && item.promo_price < item.price;
  const price = sale ? (item.promo_price as number) : item.price;
  const href = `/perfume/${encodeURIComponent(item.slug)}`;

  return (
    <motion.div
      className={`pf-slot ${slot.cls}`}
      style={{ x, y }}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.div
        className="pf-slot-inner"
        animate={{ y: [0, -14, 0], rotate: [slot.rot, slot.rot + 1.5, slot.rot] }}
        transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: slot.delay }}
      >
        <Link href={href} className="pf-slot-link" aria-label={item.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/perfumes/image/${encodeURIComponent(item.slug)}?w=960`}
            alt={item.name}
            loading={i === 1 ? "eager" : "lazy"}
          />
        </Link>
        <span className="glass pf-slot-tag">
          {item.brand} · <b>{formatPrice(price)} {T.currency}</b>
          {sale && item.discount > 0 && (
            <span className="pf-slot-off"> −{Math.floor(item.discount)}%</span>
          )}
        </span>
      </motion.div>
    </motion.div>
  );
}
