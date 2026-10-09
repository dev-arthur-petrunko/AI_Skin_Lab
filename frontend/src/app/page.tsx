import { getCatalog, getSaleProducts, getCutoutIds } from "@/lib/api";
import { cutoutSrc } from "@/lib/cutouts";
import { Hero } from "@/components/Hero";
import type { HeroItem } from "@/components/HeroProducts";
import type { CategoryTileData } from "@/components/CategoriesSection";
import type { BrandGroup } from "@/components/BrandsSection";
import Marquee from "@/components/Marquee";
import CategoriesSection from "@/components/CategoriesSection";
import SaleSection from "@/components/SaleSection";
import BrandsSection from "@/components/BrandsSection";
import AiSection from "@/components/AiSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats = { items: 0, brands: 0, sales: 0, maxDiscount: 0 };
  let saleProducts: Awaited<ReturnType<typeof getSaleProducts>> = [];
  let heroItems: HeroItem[] = [];
  let categories: CategoryTileData[] = [];
  let brands: BrandGroup[] = [];

  try {
    const [cat, sale, cutoutIds] = await Promise.all([
      getCatalog(),
      getSaleProducts(10),
      getCutoutIds(),
    ]);
    saleProducts = sale;

    const cutoutFor = (id: string): string | null =>
      cutoutIds.has(id) ? cutoutSrc(id) : null;

    const maxDiscount = cat.items.reduce(
      (max, p) => (p.is_on_sale ? Math.max(max, p.discount_percent) : max),
      0
    );
    stats = {
      items: cat.total,
      brands: cat.brands.length,
      sales: cat.items.filter((p) => p.is_on_sale).length,
      maxDiscount,
    };

    // hero: real cut-outs, sale items first, biggest discount in front
    const ranked = cat.items
      .map((p) => ({ p, cutout: cutoutFor(p.id) }))
      .sort((a, b) => {
        const sale = Number(b.p.is_on_sale) - Number(a.p.is_on_sale);
        return sale !== 0 ? sale : b.p.discount_percent - a.p.discount_percent;
      });
    const picked = ranked.filter((x) => x.cutout).slice(0, 3);
    const filler = ranked.filter((x) => !x.cutout).slice(0, 3 - picked.length);
    heroItems = [...picked, ...filler].map(({ p, cutout }) => ({
      id: p.id,
      name: p.name_uk || p.name,
      brand: p.brand,
      price: p.price,
      promo_price: p.promo_price,
      discount: p.discount_percent,
      cutout: cutout ?? "",
      image: p.image,
    }));

    // category tiles: prefer a transparent cut-out as the corner product
    categories = cat.categories
      .map((name) => {
        const items = cat.items.filter((p) => p.category === name);
        const cut = items.find((p) => cutoutFor(p.id));
        const cutPath = cut ? cutoutFor(cut.id) : null;
        const sample = cut ?? items[0];
        return {
          name,
          count: items.length,
          image: cutPath ?? sample?.image ?? "/images/placeholder.svg",
          isCutout: Boolean(cutPath),
        };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);

    brands = cat.brands.map((name) => {
      const items = cat.items.filter((p) => p.brand === name);
      const top = [...items]
        .sort(
          (a, b) =>
            Number(b.is_on_sale) - Number(a.is_on_sale) ||
            b.discount_percent - a.discount_percent
        )
        .slice(0, 3);
      return { name, products: top, total: items.length };
    });
  } catch {
    // backend offline - render page with empty stats
  }

  return (
    <>
      <Hero stats={stats} heroItems={heroItems} />
      <Marquee />
      <CategoriesSection categories={categories} />
      <SaleSection products={saleProducts} maxDiscount={stats.maxDiscount} />
      <BrandsSection brands={brands} />
      <AiSection />
    </>
  );
}
