import { getCatalog } from "@/lib/api";
import CatalogClient from "@/components/catalog/CatalogClient";

export const dynamic = "force-dynamic";

async function loadCatalogWithRetry() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getCatalog();
    } catch {
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  return null;
}

export default async function CatalogPage() {
  const catalog = await loadCatalogWithRetry();
  return <CatalogClient initial={catalog} />;
}
