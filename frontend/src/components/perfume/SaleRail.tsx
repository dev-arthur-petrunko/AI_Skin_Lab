import type { PerfumeItem } from "@/lib/perfume/api";
import PerfumeCard from "./PerfumeCard";

export default function SaleRail({ items }: { items: PerfumeItem[] }) {
  return (
    <div className="pf-rail">
      {items.map((item) => (
        <PerfumeCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
