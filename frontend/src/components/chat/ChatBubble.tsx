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
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-sand px-4 py-3 text-sm leading-relaxed text-espresso">
        {displayed}
        {isTyping && displayed.length < content.length && (
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-espresso align-middle" />
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
                className="group flex items-center gap-3 rounded-xl border border-espresso/10 bg-white p-2 transition hover:border-mocha/50 hover:shadow-md"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
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
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-mocha">
                    {p.brand}
                  </div>
                  <div className="truncate text-xs font-medium text-espresso group-hover:text-mocha">
                    {p.name}
                  </div>
                </div>
                <div className="text-right">
                  {p.promo_price ? (
                    <>
                      <div className="text-sm font-semibold text-berry">{p.promo_price} ₴</div>
                      <div className="text-[10px] text-espresso/40 line-through">{p.price} ₴</div>
                    </>
                  ) : (
                    <div className="text-sm font-semibold text-espresso">{p.price} ₴</div>
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
