import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPerfume, perfumeImg } from "@/lib/perfume/api";
import { formatPrice } from "@/lib/format";
import { T, buildDescription } from "@/lib/perfume/texts";
import PerfumeCard from "@/components/perfume/PerfumeCard";
import NotePyramid from "@/components/perfume/NotePyramid";
import AddToCartButton from "@/components/perfume/AddToCartButton";
import PerfumeImage from "@/components/perfume/PerfumeImage";
import { StockBadge } from "@/components/perfume/PerfumeCard";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const item = await getPerfume(decodeURIComponent(params.slug)).catch(() => null);
  if (!item) return { title: `${T.title} — AI Skin Lab` };
  const name = item.display_name || item.name;
  const desc = item.description || buildDescription(item);
  return {
    title: `${name} — ${T.title} | AI Skin Lab`,
    description: desc || `${item.brand} · ${T.title}`,
  };
}

export default async function PerfumeDetailPage({ params }: Params) {
  const item = await getPerfume(decodeURIComponent(params.slug)).catch(() => null);
  if (!item) notFound();

  const name = item.display_name || item.name;
  const price = item.promo_price ?? item.price;
  const hasSale = Boolean(item.discount && item.promo_price);
  const desc = item.description || buildDescription(item);

  const specs: [string, string][] = [
    [T.brand_title, item.brand],
    item.gender ? [T.gender_title, item.gender] : null,
    item.type ? ["Тип", item.type] : null,
    item.volume_ml ? [T.volume_title, `${item.volume_ml} мл`] : null,
    item.country ? ["Країна", item.country] : null,
    item.sku ? ["Артикул", item.sku] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <Link
        href="/perfume"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--azure)] transition hover:text-[var(--gold)]"
      >
        ← {T.back}
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="tile pearl-edge !p-0 overflow-hidden">
          <div className="pf-card-media !aspect-square">
            <StockBadge item={item} />
            <PerfumeImage src={perfumeImg(item.slug, 960)} alt={name} />
          </div>
        </div>

        <div className="tile flex flex-col gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--azure)]">
              {item.brand}
            </span>
            <h1 className="mt-1 font-serif text-2xl leading-tight text-[var(--ink)] sm:text-3xl">
              {name}
            </h1>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            {hasSale ? (
              <>
                <span className="price-new text-3xl">{formatPrice(price)} {T.currency}</span>
                <span className="price-old text-lg">{formatPrice(item.price)} {T.currency}</span>
                <span className="rounded-full bg-[var(--sale)]/10 px-2.5 py-1 text-xs font-bold text-[var(--sale)]">
                  −{item.discount}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-semibold">{formatPrice(price)} {T.currency}</span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {specs.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-[11px] uppercase tracking-widest text-[var(--label)]">{k}</dt>
                <dd className="text-[var(--ink)]">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto">
            <AddToCartButton item={item} />
          </div>

          {desc && (
            <div className="pf-desc">
              <span className="section-label">
                <span className="text-[var(--gold)]">●</span> {T.about_item}
              </span>
              <p className="pf-desc-text">{desc}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="section-label">
          <span className="text-[var(--gold)]">●</span> {T.families_title}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.families.map((f) => (
            <Link key={f} href={`/perfume?family=${encodeURIComponent(f)}`} className="chip-f">
              {f}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-label">
          <span className="text-[var(--gold)]">●</span> {T.notes_title}
        </h2>
        <div className="mt-4">
          <NotePyramid notes={item.notes} description={item.description} />
        </div>
      </section>

      {item.similar.length > 0 && (
        <section className="mt-10">
          <h2 className="section-label">
            <span className="text-[var(--gold)]">●</span> {T.similar}
          </h2>
          <div className="mt-5 pf-grid">
            {item.similar.map((s) => (
              <PerfumeCard key={s.slug} item={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
