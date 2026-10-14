"use client";

import { useState } from "react";
import type { PerfumeItem } from "@/lib/perfume/api";
import { toSearchParams, type PerfumeQuery } from "@/lib/perfume/query";
import { T } from "@/lib/perfume/texts";
import PerfumeCard from "./PerfumeCard";

type Props = {
  items: PerfumeItem[];
  total: number;
  page: number;
  pages: number;
  query: PerfumeQuery;
  countLabel: string;
};

export default function PerfumeCollection({ items: initial, total, page: initialPage, pages, query, countLabel }: Props) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    setError(false);
    try {
      const next = page + 1;
      const base = toSearchParams(query).slice(1);
      const sep = base ? "&" : "";
      const res = await fetch(`/api/perfumes?${base}${sep}page=${next}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: PerfumeItem[] };
      setItems((prev) => [...prev, ...data.items]);
      setPage(next);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-label">
            <span className="text-[var(--gold)]">●</span> {T.collection}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{countLabel}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="pf-empty">{T.empty_search}</p>
      ) : (
        <div className="mt-6 pf-grid">
          {items.map((item) => (
            <PerfumeCard key={item.slug} item={item} />
          ))}
        </div>
      )}

      {page < pages && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "…" : T.show_more}
          </button>
        </div>
      )}
      {error && <p className="pf-empty">{T.error_text}</p>}
      <span className="sr-only">{total}</span>
    </>
  );
}
