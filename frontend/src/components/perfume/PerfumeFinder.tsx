"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PerfumeFacets } from "@/lib/perfume/api";
import { hasActiveFilters, toSearchParams, type PerfumeQuery } from "@/lib/perfume/query";
import { T } from "@/lib/perfume/texts";

type Props = { facets: PerfumeFacets; query: PerfumeQuery };

function toggleList(list: string, value: string): string {
  const set = new Set((list || "").split(",").filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set).join(",");
}

function ChipGroup({
  label,
  values,
  current,
  onToggle,
}: {
  label: string;
  values: { value: string; count: number }[];
  current: string;
  onToggle: (value: string) => void;
}) {
  if (values.length === 0) return null;
  const selected = new Set((current || "").split(",").filter(Boolean));
  return (
    <div className="pf-finder-row">
      <span className="pf-finder-label">{label}</span>
      <div className="pf-finder-chips">
        {values.map((v) => (
          <button
            key={v.value}
            type="button"
            className="chip-f"
            aria-pressed={selected.has(v.value)}
            onClick={() => onToggle(v.value)}
          >
            {v.value}
            <span className="ml-1.5 text-xs opacity-60">{v.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const SORTS: { value: string; label: string }[] = [
  { value: "", label: T.sort_default },
  { value: "price_asc", label: T.sort_price_asc },
  { value: "price_desc", label: T.sort_price_desc },
  { value: "discount", label: T.sort_discount },
  { value: "name", label: T.sort_name },
];

export default function PerfumeFinder({ facets, query }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<PerfumeQuery>({ ...query });
  const searchRef = useRef<HTMLInputElement>(null);

  const applied = useMemo(() => toSearchParams(query), [query]);

  useEffect(() => {
    setDraft({ ...query });
    if (searchRef.current) searchRef.current.value = query.q || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const go = (next: PerfumeQuery) => {
    router.replace(`/perfume${toSearchParams(next)}`, { scroll: false });
  };

  const patch = (p: Partial<PerfumeQuery>) => {
    const next = { ...draft, ...p };
    setDraft(next);
    go(next);
  };

  const reset = () => {
    const empty: PerfumeQuery = draft.sort ? { sort: draft.sort } : {};
    setDraft(empty);
    go(empty);
    if (searchRef.current) searchRef.current.value = "";
  };

  const showAll = () => {
    document.getElementById("pf-collection")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="pf-finder">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="pf-finder-label">{T.cta_pick}</span>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {T.notes_title} · {facets.brands.length} {T.brands_word} · {T.volume_title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="pf-select"
            aria-label={T.sort_default}
            value={draft.sort || ""}
            onChange={(e) => patch({ sort: e.target.value || undefined })}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="button" className="btn btn-primary px-5 py-2 text-sm" onClick={showAll}>
            {T.show}
          </button>
          {hasActiveFilters(query) && (
            <button type="button" className="btn btn-ghost px-5 py-2 text-sm" onClick={reset}>
              {T.reset}
            </button>
          )}
        </div>
      </div>

      <div className="pf-finder-row">
        <span className="pf-finder-label">{T.title}</span>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            patch({ q: searchRef.current?.value.trim() || undefined, page: undefined });
          }}
        >
          <input
            ref={searchRef}
            className="pf-input"
            type="search"
            name="q"
            defaultValue={query.q || ""}
            placeholder={T.search_ph}
            aria-label={T.search_ph}
          />
          <button type="submit" className="btn btn-ghost px-5 py-2 text-sm">{T.show}</button>
        </form>
      </div>

      <ChipGroup
        label={T.gender_title}
        values={facets.genders}
        current={draft.gender || ""}
        onToggle={(v) => patch({ gender: toggleList(draft.gender || "", v), page: undefined })}
      />
      <ChipGroup
        label={T.brand_title}
        values={facets.brands}
        current={draft.brand || ""}
        onToggle={(v) => patch({ brand: toggleList(draft.brand || "", v), page: undefined })}
      />
      <ChipGroup
        label={T.families_title}
        values={facets.families}
        current={draft.family || ""}
        onToggle={(v) => patch({ family: toggleList(draft.family || "", v), page: undefined })}
      />
      <ChipGroup
        label={T.volume_title}
        values={facets.volumes}
        current={draft.volume || ""}
        onToggle={(v) => patch({ volume: toggleList(draft.volume || "", v), page: undefined })}
      />
      <ChipGroup
        label={T.notes_title}
        values={facets.notes}
        current={draft.note || ""}
        onToggle={(v) => patch({ note: toggleList(draft.note || "", v), page: undefined })}
      />

      <div className="pf-finder-row">
        <span className="pf-finder-label">{T.price_title}</span>
        <div className="flex max-w-md gap-2">
          <input
            className="pf-input"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={`${facets.price_range.min}`}
            aria-label={`${T.price_title} min`}
            defaultValue={query.price_min || ""}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (draft.price_min || "")) {
                patch({ price_min: v || undefined, page: undefined });
              }
            }}
          />
          <input
            className="pf-input"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={`${facets.price_range.max}`}
            aria-label={`${T.price_title} max`}
            defaultValue={query.price_max || ""}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (draft.price_max || "")) {
                patch({ price_max: v || undefined, page: undefined });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
