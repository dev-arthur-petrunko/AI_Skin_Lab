import { notFound } from "next/navigation";
import { getCatalog, getProduct } from "@/lib/api";
import ProductDetailView from "@/components/product/ProductDetailView";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
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
  // состав набора (для is_set=true карточек)
  let setComponents: Awaited<ReturnType<typeof getCatalog>>["items"] = [];
  try {
    const catalog = await getCatalog();
    related = catalog.items
      .filter((p) => p.id !== product!.id && (p.category === product!.category || p.brand === product!.brand))
      .slice(0, 4);
    if (product!.is_set && product!.set_items?.length) {
      const byId = new Map(catalog.items.map((p) => [p.id, p]));
      setComponents = product!.set_items
        .map((sid) => byId.get(sid))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
    }
  } catch {
    related = [];
  }

  return <ProductDetailView product={product} related={related} setComponents={setComponents} />;
}
