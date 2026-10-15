import Link from "next/link";
import type { PerfumeFacets } from "@/lib/perfume/api";
import { T } from "@/lib/perfume/texts";

type Props = { brands: PerfumeFacets["brands"]; query: { brand?: string } };

export default function BrandsPanel({ brands, query }: Props) {
  if (brands.length === 0) return null;
  const selected = new Set((query.brand || "").split(",").filter(Boolean));

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
