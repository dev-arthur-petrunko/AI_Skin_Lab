"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PerfumeFacets } from "@/lib/perfume/api";
import { applyPerfumeQuery, subscribePerfumeQuery } from "@/lib/perfume/filterBus";
import { T } from "@/lib/perfume/texts";

type Props = { brands: PerfumeFacets["brands"]; query: { brand?: string } };

export default function BrandsPanel({ brands, query }: Props) {
  const [brandList, setBrandList] = useState(query.brand || "");
  useEffect(() => subscribePerfumeQuery((q) => setBrandList(q.brand || "")), [query.brand]);
  if (brands.length === 0) return null;
  const selected = new Set(brandList.split(",").filter(Boolean));

  return (
    <>
      <h2 className="section-label">
        <span className="text-[var(--gold)]">●</span> {T.brands}
      </h2>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {brands.map((b) => {
          const next = selected.has(b.value)
            ? Array.from(selected).filter((x) => x !== b.value).join(",")
            : Array.from(selected).concat(b.value).join(",");
          return (
            <Link
              key={b.value}
              href={
                next
                  ? `/perfume?brand=${encodeURIComponent(next)}#pf-collection`
                  : "/perfume#pf-collection"
              }
              className="chip-f"
              aria-pressed={selected.has(b.value)}
              onClick={(e) => {
                e.preventDefault();
                applyPerfumeQuery({ brand: next || undefined }, { hash: true, scroll: true });
              }}
            >
              {b.value}
              <span className="ml-1.5 text-xs opacity-60">{b.count}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
