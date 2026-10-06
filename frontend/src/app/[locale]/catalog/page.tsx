import { getCatalog } from "@/lib/api";
import CatalogClient from "@/components/catalog/CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  let catalog: Awaited<ReturnType<typeof getCatalog>> | null = null;

  try {
    catalog = await getCatalog();
  } catch {
    catalog = null;
  }

  return <CatalogClient initial={catalog} />;
}
