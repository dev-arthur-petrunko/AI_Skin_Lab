import { getCatalog, getSaleProducts } from "@/lib/api";
import { Hero } from "@/components/Hero";
import type { HeroItem } from "@/components/HeroProducts";
import type { BrandGroup } from "@/components/BrandsSection";
import Marquee from "@/components/Marquee";
import DirectionsSection from "@/components/DirectionsSection";
import SaleSection from "@/components/SaleSection";
import BrandsSection from "@/components/BrandsSection";
import AiSection from "@/components/AiSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats = { items: 0, brands: 0, sales: 0, maxDiscount: 0 };
  let saleProducts: Awaited<ReturnType<typeof getSaleProducts>> = [];
  let heroItems: HeroItem[] = [];
  let brands: BrandGroup[] = [];

  try {
    const [cat, sale] = await Promise.all([
      getCatalog(),
      getSaleProducts(10),
    ]);
    saleProducts = sale;

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

    // hero: sale items first, biggest discount in front, only products with a photo
    heroItems = cat.items
      .filter((p) => p.has_image)
      .sort((a, b) => {
        const sale = Number(b.is_on_sale) - Number(a.is_on_sale);
        return sale !== 0 ? sale : b.discount_percent - a.discount_percent;
      })
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name_uk || p.name,
        brand: p.brand,
        price: p.price,
        promo_price: p.promo_price,
        discount: p.discount_percent,
        image: p.image,
      }));

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
      <DirectionsSection />
      <SaleSection products={saleProducts} maxDiscount={stats.maxDiscount} />
      <BrandsSection brands={brands} />
      <AiSection />
    </>
  );
}
