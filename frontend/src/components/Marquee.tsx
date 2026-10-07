"use client";

import { useTranslations } from "@/i18n/request";

export default function Marquee() {
  const t = useTranslations("marquee");
  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5")];
  const row = [...items, ...items];
  return (
    <div className="container-page">
      <div className="glass overflow-hidden rounded-full py-3">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap px-6">
          {row.map((label, i) => (
            <span key={i} className="text-sm text-[var(--muted)]">
              {label}
              <span className="ml-10 text-[var(--aqua)]">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
