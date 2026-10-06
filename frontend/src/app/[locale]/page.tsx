import { getCatalog, getSaleProducts } from "@/lib/api";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ProductCarousel from "@/components/ProductCarousel";
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
      <Hero stats={stats} />
      <Marquee />

      <SaleSection products={saleProducts} />

      <section className="container-page mt-16">
        <div className="rounded-3xl bg-gradient-to-r from-espresso to-mocha/80 px-6 py-10 text-center text-cream sm:px-12">
          <h2 className="font-serif text-3xl">Не знаєте, що обрати? 🌿</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-cream/80">
            Наш AI-консультант підбере ідеальний аромат або засіб догляду за кілька секунд —
            просто опишіть вашу потребу.
          </p>
          <a href="#catalog-preview" className="btn mt-6 bg-cream text-espresso hover:bg-cream/90">
            ✨ Спробувати AI-підбір
          </a>
        </div>
      </section>
    </>
  );
}
