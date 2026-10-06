"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";

export interface ChatProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  promo_price: number | null;
  image: string;
  discount_percent: number;
}

interface Props {
  content: string;
  isTyping: boolean;
  onFinish: () => void;
  products: ChatProduct[];
}

export default function ChatBubble({ content, isTyping, onFinish, products }: Props) {
  const [displayed, setDisplayed] = useState(content);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isTyping) {
      setDisplayed(content);
      return;
    }
    setDisplayed("");
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 2;
      setDisplayed(content.slice(0, i));
      if (i >= content.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        onFinish();
      }
    }, 18);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, isTyping]);

  return (
    <div className="flex flex-col gap-2">
      <div className="glass max-w-[85%] rounded-2xl rounded-tl-sm !p-3 px-4 py-3 text-sm leading-relaxed">
        {displayed}
        {isTyping && displayed.length < content.length && (
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[var(--azure)] align-middle" />
        )}
      </div>

      <AnimatePresence>
        {products.length > 0 && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/product/${encodeURIComponent(p.id)}`}
                className="group flex items-center gap-3 glass rounded-xl !p-2 transition hover:shadow-md"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--pic)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--azure)]">
                    {p.brand}
                  </div>
                  <div className="truncate text-xs font-medium group-hover:text-[var(--azure)]">
                    {p.name}
                  </div>
                </div>
                <div className="text-right">
                  {p.promo_price ? (
                    <>
                      <div className="price-new text-sm">{p.promo_price} ₴</div>
                      <div className="price-old text-[10px]">{p.price} ₴</div>
                    </>
                  ) : (
                    <div className="text-sm font-semibold">{p.price} ₴</div>
                  )}
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
