"use client";

import { useTranslations } from "next-intl";

export default function Marquee() {
  const t = useTranslations("marquee");

  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5")];
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-espresso/10 bg-espresso py-3 text-cream">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-6 whitespace-nowrap px-6 text-xs font-medium uppercase tracking-[0.2em]"
          >
            {item}
            <span className="text-mocha">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
