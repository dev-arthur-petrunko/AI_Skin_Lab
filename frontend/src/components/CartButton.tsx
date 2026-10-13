"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "@/i18n/request";
import { useCart } from "@/providers/CartProvider";

export default function CartButton() {
  const t = useTranslations("order");
  const { count, bump, toggle } = useCart();
  const reduce = useReducedMotion();
  const prev = useRef(count);

  useEffect(() => {
    if (bump > 0 && bump !== 0 && !reduce) navigator.vibrate?.(15);
    prev.current = count;
  }, [bump, count, reduce]);

  return (
    <button
      type="button"
      id="header-cart"
      onClick={toggle}
      aria-label={t("cart_title")}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gl)] transition hover:border-[var(--gold)]"
    >
      <motion.span
        key={bump}
        initial={reduce || bump === 0 ? false : { scale: 0.6, rotate: -18 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 10, stiffness: 320 }}
        className="flex"
      >
        <ShoppingCart className="h-[18px] w-[18px]" />
      </motion.span>
      {count > 0 && (
        <motion.span
          key={`b${bump}-${count}`}
          initial={reduce ? false : { scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 380 }}
          className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[11px] font-bold leading-none text-white shadow"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </button>
  );
}
