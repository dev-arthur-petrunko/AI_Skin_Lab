"use client";

import { useTranslations } from "@/i18n/request";

export default function Marquee() {
  const t = useTranslations("marquee");
  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5")];
  const group = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((label, i) => (
        <span key={`${key}-${i}`} className="marquee-item">
          {label}
          <span className="marquee-sep">●</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee-wrap" aria-hidden>
      <div className="marquee-track">
        {group("a")}
        {group("b")}
      </div>
    </div>
  );
}
