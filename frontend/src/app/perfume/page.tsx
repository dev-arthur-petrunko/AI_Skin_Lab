import { getPerfumeFacets, getPerfumeList, getPerfumeMeta, type PerfumeItem } from "@/lib/perfume/api";
import { normalizeQuery, toSearchParams } from "@/lib/perfume/query";
import { T, pluralAromatic } from "@/lib/perfume/texts";
import PerfumeFinder from "@/components/perfume/PerfumeFinder";
import AromaCircle from "@/components/perfume/AromaCircle";
import BrandsPanel from "@/components/perfume/BrandsPanel";
import SaleRail from "@/components/perfume/SaleRail";
import PerfumeCollection from "@/components/perfume/PerfumeCollection";
import HowToWear from "@/components/perfume/HowToWear";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function PerfumePage({ searchParams }: { searchParams: SP }) {
  const query = normalizeQuery(searchParams);
  const params = toSearchParams(query).slice(1);

  const [meta, facets, list, sale] = await Promise.all([
    safe(() => getPerfumeMeta(), { count: 0, brands: 0, max_discount: 0, last_updated: null, reason: null }),
    safe(() => getPerfumeFacets(params), {
      brands: [], genders: [], families: [], volumes: [], notes: [],
      price_range: { min: 0, max: 0 },
    }),
    safe(() => getPerfumeList(params), { items: [] as PerfumeItem[], total: 0, page: 1, pages: 1 }),
    safe(
      () => getPerfumeList("sale=1&sort=discount&limit=10"),
      { items: [] as PerfumeItem[], total: 0, page: 1, pages: 1 }
    ),
  ]);

  return (
    <>
      {/* hero */}
      <section className="pf-hero">
        <span className="section-label">
          <span className="text-[var(--gold)]">●</span> {T.subtitle}
        </span>
        <h1 className="section-title mt-3">{T.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          Оберіть аромат за нотами, брендом чи сімейством — колекція парфумованої води з
          доставкою по Україні.
        </p>
        <div className="pf-hero-stats">
          <span className="pf-hero-stat"><b>{meta.count}</b> {T.aromatics}</span>
          <span className="pf-hero-stat"><b>{meta.brands}</b> {T.brands_word}</span>
          {meta.max_discount > 0 && (
            <span className="pf-hero-stat">{T.up_to.replace("{n}", String(meta.max_discount))}</span>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#pf-collection" className="btn btn-primary">{T.cta_pick}</a>
          <a href="/perfume?sale=1#pf-collection" className="btn btn-ghost">{T.cta_sale}</a>
        </div>
      </section>

      {/* finder */}
      <section className="mt-12 tile" aria-label={T.cta_pick}>
        <PerfumeFinder facets={facets} query={query} />
      </section>

      {/* aroma circle */}
      <section className="mt-14">
        <h2 className="section-label">
          <span className="text-[var(--gold)]">●</span> {T.families_title}
        </h2>
        <div className="mt-6">
          <AromaCircle families={facets.families} />
        </div>
      </section>

      {/* brands */}
      <section className="mt-14">
        <BrandsPanel brands={facets.brands} query={query} />
      </section>

      {/* sale rail */}
      {sale.items.length > 0 && (
        <section className="mt-14">
          <h2 className="section-label">
            <span className="text-[var(--gold)]">●</span> {T.sale_title}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{T.sale_subtitle}</p>
          <div className="mt-5">
            <SaleRail items={sale.items} />
          </div>
        </section>
      )}

      {/* collection */}
      <section className="mt-14" id="pf-collection">
        <PerfumeCollection
          key={params || "all"}
          items={list.items}
          total={list.total}
          page={list.page}
          pages={list.pages}
          query={query}
          countLabel={pluralAromatic(list.total)}
        />
      </section>

      {/* how to wear */}
      <section className="mt-14">
        <HowToWear />
      </section>
    </>
  );
}
