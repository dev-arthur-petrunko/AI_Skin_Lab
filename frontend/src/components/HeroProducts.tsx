"use client";

import Image from "next/image";
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

export type HeroItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  promo_price: number | null;
  discount: number;
  cutout: string;
  image: string;
};

/** left / centre / right slots of the product cluster */
const SLOTS = [
  { cls: "left-[3%] top-[28%] h-[52%] w-[30%] z-10", depth: 18, rot: -7, delay: 0 },
  { cls: "left-[32%] top-[5%] h-[74%] w-[36%] z-20", depth: 34, rot: 0, delay: 0.4 },
  { cls: "right-[3%] top-[32%] h-[48%] w-[30%] z-10", depth: 22, rot: 8, delay: 0.8 },
];

export function HeroProducts({ items }: { items: HeroItem[] }) {
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
      className="relative h-[64vw] max-h-[640px] min-h-[250px] w-full md:h-[540px] lg:h-[600px]"
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
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square h-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #fff, var(--champagne) 55%, transparent 72%)",
          filter: "blur(6px)",
        }}
      />
      {items.slice(0, 3).map((p, i) => (
        <Layer key={p.id} item={p} slot={SLOTS[i]} sx={sx} sy={sy} i={i} />
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
  item: HeroItem;
  slot: (typeof SLOTS)[number];
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  i: number;
}) {
  const x = useTransform(sx, (v) => v * slot.depth * -2);
  const y = useTransform(sy, (v) => v * slot.depth * -2);
  const sale = item.promo_price != null && item.promo_price < item.price;
  const price = sale ? (item.promo_price as number) : item.price;
  const href = `/product/${encodeURIComponent(item.id)}`;
  const isCutout = Boolean(item.cutout);

  return (
    <motion.div
      className={`absolute ${slot.cls}`}
      style={{ x, y }}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ y: [0, -14, 0], rotate: [slot.rot, slot.rot + 1.5, slot.rot] }}
        transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: slot.delay }}
      >
        <Link
          href={href}
          className="group absolute inset-0 block rounded-[28px] transition-transform duration-500 hover:scale-[1.03]"
          aria-label={item.name}
        >
          <Image
            src={isCutout ? item.cutout : item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 45vw, 26vw"
            priority={i === 1}
            className={`object-contain transition-transform duration-500 ${
              isCutout
                ? "drop-shadow-[0_30px_30px_rgba(58,42,30,.28)]"
                : "rounded-3xl bg-white p-3 mix-blend-multiply"
            }`}
          />
        </Link>
        <span className="glass pointer-events-none absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs">
          {item.brand} · <b className="text-[var(--ink)]">{price.toLocaleString("uk-UA")} грн</b>
          {sale && item.discount > 0 && (
            <span className="ml-1 font-bold text-[var(--sale)]">
              −{Math.floor(item.discount)}%
            </span>
          )}
        </span>
      </motion.div>
    </motion.div>
  );
}
