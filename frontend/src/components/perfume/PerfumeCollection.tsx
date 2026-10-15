"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PerfumeItem } from "@/lib/perfume/api";
import { emitPerfumeResult, subscribePerfumeQuery } from "@/lib/perfume/filterBus";
import { toSearchParams, type PerfumeQuery } from "@/lib/perfume/query";
import { T, pluralAromatic } from "@/lib/perfume/texts";
import PerfumeCard from "./PerfumeCard";

type Props = {
  items: PerfumeItem[];
  total: number;
  page: number;
  pages: number;
  query: PerfumeQuery;
  countLabel: string;
};

export default function PerfumeCollection({
  items: initial,
  total: initialTotal,
  page: initialPage,
  pages: initialPages,
  query: initialQuery,
  countLabel: initialLabel,
}: Props) {
  const [items, setItems] = useState(initial);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(initialPages);
  const [query, setQuery] = useState(initialQuery);
  const [countLabel, setCountLabel] = useState(initialLabel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const reqId = useRef(0);

  const fetchList = useCallback(async (q: PerfumeQuery) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/perfumes${toSearchParams(q)}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        items: PerfumeItem[];
        total: number;
        page: number;
        pages: number;
      };
      if (id !== reqId.current) return;
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
      setQuery(q);
      setCountLabel(pluralAromatic(data.total));
      emitPerfumeResult(data.total);
    } catch {
      if (id === reqId.current) setError(true);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => subscribePerfumeQuery((q) => fetchList(q)), [fetchList]);

  const loadMore = async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(false);
    try {
      const next = page + 1;
      const base = toSearchParams({ ...query, page: String(next) }).slice(1);
      const res = await fetch(`/api/perfumes?${base}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: PerfumeItem[] };
      if (id !== reqId.current) return;
      setItems((prev) => [...prev, ...data.items]);
      setPage(next);
    } catch {
      if (id === reqId.current) setError(true);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-label">
            <span className="text-[var(--gold)]">●</span> {T.collection}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]" aria-live="polite">{countLabel}</p>
        </div>
      </div>

      <div className="transition-opacity" style={loading ? { opacity: 0.55 } : undefined}>
        {items.length === 0 ? (
          <p className="pf-empty">{T.empty_search}</p>
        ) : (
          <div className="mt-6 pf-grid">
            {items.map((item) => (
              <PerfumeCard key={item.slug} item={item} />
            ))}
          </div>
        )}
      </div>

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
