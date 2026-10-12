"use client";

import { useLocale, useTranslations } from "@/i18n/request";
import { useCart } from "@/providers/CartProvider";
import { useOrderModal } from "@/providers/OrderModalProvider";

export default function TestComponent2() {
  const t = useTranslations("card");
  const locale = useLocale();
  const { add } = useCart();
  const { open } = useOrderModal();

  return (
    <div>
      <a href="/test">
        <div>Test</div>
      </a>
      <div>
        <button>Test</button>
      </div>
    </div>
  );
}