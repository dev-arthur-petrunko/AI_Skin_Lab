"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/request";
import { formatPrice, pluralUk } from "@/lib/format";
import type { Product } from "@/lib/types";

const SKIN_TYPES = [
  "РќРѕСЂРјР°Р»СЊРЅР°", "РЎСѓС…Р°", "Р–РёСЂРЅР°", "РљРѕРјР±С–РЅРѕРІР°РЅР°", "Р§СѓС‚Р»РёРІР°", "РџСЂРѕР±Р»РµРјРЅР°", "Р’СЃС– С‚РёРїРё",
];

const PURPOSES = [
  "Р—РІРѕР»РѕР¶РµРЅРЅСЏ", "Р’С–РґРЅРѕРІР»РµРЅРЅСЏ", "Р—Р°СЃРїРѕРєРѕС”РЅРЅСЏ С‚Р° РїРѕС‡РµСЂРІРѕРЅС–РЅРЅСЏ",
  "РћСЃРІС–С‚Р»РµРЅРЅСЏ С‚Р° РїС–РіРјРµРЅС‚Р°С†С–СЏ", "РђРЅС‚РёРІС–РєРѕРІРёР№ РґРѕРіР»СЏРґ", "РђРЅС‚РёРѕРєСЃРёРґР°РЅС‚РЅРёР№ Р·Р°С…РёСЃС‚",
  "РћС‡РёС‰РµРЅРЅСЏ", "РћСЃРІС–Р¶РµРЅРЅСЏ С‚Р° С‚РѕРЅС–Р·Р°С†С–СЏ", "РњР°С‚СѓРІР°РЅРЅСЏ С‚Р° РїРѕСЂРё",
  "РђРєРЅРµ С‚Р° РїСЂРѕР±Р»РµРјРЅР° С€РєС–СЂР°", "РЎРѕРЅС†РµР·Р°С…РёСЃС‚", "Р”РѕРіР»СЏРґ Р·Р° РѕС‡РёРјР°",
  "Р”РµР»С–РєР°С‚РЅС– Р·РѕРЅРё",
];

export default function DirectionsSection() {
  const t = useTranslations("directions");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [skin, setSkin] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (skin) p.set("skin", skin);
    if (purpose) p.set("purpose", purpose);
    return p.toString();
  }, [skin, purpose]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const [c, list] = await Promise.all([
          fetch(`/api/products/count${qs ? `?${qs}` : ""}`).then((r) => r.json()),
          fetch(`/api/products?limit=4&sort=match${qs ? `&${qs}` : ""}`).then((r) => r.json()),
        ]);
        if (!alive) return;
        setCount(typeof c.count === "number" ? c.count : null);
        setPreview(Array.isArray(list) ? list : []);
      } catch {
        if (alive) {
          setCount(null);
          setPreview([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [qs]);

  const go = () => {
    const p = new URLSearchParams();
    if (skin) p.set("skin", skin);
    if (purpose) p.set("purpose", purpose);
    const qsStr = p.toString();
    router.push(`/catalog${qsStr ? `?${qsStr}` : ""}`);
  };

  const toggle = (value: string, current: string | null, set: (v: string | null) => void) =>
    set(current === value ? null : value);

  const chipClass = (active: boolean) =>
    active ? "chip-f !border-[var(--gold)] !text-[var(--noir)]" : "chip-f";
  const chipStyle = (active: boolean) =>
    active ? { background: "var(--gold-gradient)" } : undefined;

  const showLabel =
    count === null
      ? t("show")
      : pluralUk(count, [t("show_one"), t("show_few"), t("show_many")]);

  return (
    <section className="container-page py-16" id="directions">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="section-title">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{t("subtitle")}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* Panel 1 вЂ” skin type */}
          <div className="tile glass p-5">
            <h3 className="section-label flex items-center gap-2">
              <span className="text-[var(--gold)]">в—Џ</span>
              {t("skin_title")}
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {SKIN_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={skin === s}
                  onClick={() => toggle(s, skin, setSkin)}
                  className={chipClass(skin === s)}
                  style={chipStyle(skin === s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Panel 2 вЂ” purpose */}
          <div className="tile glass p-5">
            <h3 className="section-label flex items-center gap-2">
              <span className="text-[var(--gold)]">в—Џ</span>
              {t("purpose_title")}
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={purpose === p}
                  onClick={() => toggle(p, purpose, setPurpose)}
                  className={chipClass(purpose === p)}
                  style={chipStyle(purpose === p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* result line */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={go}
            disabled={loading && count === null}
            className="btn btn-primary"
          >
            {showLabel}
            {count !== null && (
              <span className="rounded-full bg-black/15 px-2 py-0.5 text-sm font-bold">
                {count}
              </span>
            )}
          </button>
          {(skin || purpose) && (
            <button
              type="button"
              onClick={() => {
                setSkin(null);
                setPurpose(null);
              }}
              className="chip-f"
            >
              вњ• {t("reset")}
            </button>
          )}
          {count === 0 && <span className="text-sm text-[var(--muted)]">{t("no_results")}</span>}
        </div>

        {/* preview of best matches */}
        {preview.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {preview.map((p) => (
              <a
                key={p.id}
                href={`/product/${encodeURIComponent(p.id)}`}
                className="tile group flex flex-col items-center gap-2 p-3 text-center transition hover:border-[var(--gold)]"
              >
                <span className="block h-24 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg";
                    }}
                  />
                </span>
                <span className="line-clamp-2 text-xs leading-snug">{p.name_uk || p.name}</span>
                <span className="text-sm font-bold text-[var(--gold)]">
                  {formatPrice(p.promo_price ?? p.price)} {tCommon("currency")}
                </span>
              </a>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
