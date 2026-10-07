import { getCatalog, getSaleProducts } from "@/lib/api";
import { Hero } from "@/components/Hero";
import Marquee from "@/components/Marquee";
import SaleSection from "@/components/SaleSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats = { items: 0, brands: 0, sales: 0 };
  let saleProducts: Awaited<ReturnType<typeof getSaleProducts>> = [];
  let catalog: Awaited<ReturnType<typeof getCatalog>> | null = null;

  try {
    const [cat, sale] = await Promise.all([getCatalog(), getSaleProducts(10)]);
    catalog = cat;
    stats = {
      items: catalog.total,
      brands: catalog.brands.length,
      sales: catalog.items.filter((p) => p.is_on_sale).length,
    };
    saleProducts = sale;
  } catch {
    // backend offline — render page with empty stats
  }

  return (
    <>
      <Hero products={catalog?.items || []} stats={stats} />
      <Marquee />

      <SaleSection products={saleProducts} />
    </>
  );
}

