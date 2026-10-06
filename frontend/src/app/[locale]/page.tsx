import { getCatalog, getSaleProducts } from "@/lib/api";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import SaleSection from "@/components/SaleSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats = { products: 0, brands: 0, sale: 0 };
  let saleProducts: Awaited<ReturnType<typeof getSaleProducts>> = [];

  try {
    const [catalog, sale] = await Promise.all([getCatalog(), getSaleProducts(10)]);
    stats = {
      products: catalog.total,
      brands: catalog.brands.length,
      sale: catalog.items.filter((p) => p.is_on_sale).length,
    };
    saleProducts = sale;
  } catch {
    // backend offline — render page with empty stats
  }

  return (
    <>
      <Hero stats={stats} picks={saleProducts} />
      <Marquee />

      <SaleSection products={saleProducts} />
    </>
  );
}
