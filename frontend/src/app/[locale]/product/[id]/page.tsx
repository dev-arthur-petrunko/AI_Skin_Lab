import { notFound } from "next/navigation";
import { getCatalog, getProduct } from "@/lib/api";
import ProductDetailView from "@/components/product/ProductDetailView";

export const dynamic = "force-dynamic";

interface Props {
  params: { locale: string; id: string };
}

export default async function ProductPage({ params: { id } }: Props) {
  let product = null;
  try {
    product = await getProduct(id);
  } catch {
    product = null;
  }

  if (!product) {
    notFound();
  }

  // похожие товары той же категории
  let related: Awaited<ReturnType<typeof getCatalog>>["items"] = [];
  try {
    const catalog = await getCatalog();
    related = catalog.items
      .filter((p) => p.id !== product!.id && (p.category === product!.category || p.brand === product!.brand))
      .slice(0, 4);
  } catch {
    related = [];
  }

  return <ProductDetailView product={product} related={related} />;
}
