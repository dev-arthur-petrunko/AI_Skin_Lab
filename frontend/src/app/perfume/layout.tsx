import "./perfume.css";
import type { Metadata } from "next";
import { PerfumeCartProvider } from "@/lib/perfume/cart";
import PerfumeCart from "@/components/perfume/PerfumeCart";

export const metadata: Metadata = {
  title: "Духи — AI Skin Lab",
  description:
    "Парфумована вода та аромати: колекція духів AI Skin Lab. Підбір за нотами, брендами та сімействами ароматів, знижки, швидке замовлення.",
};

export default function PerfumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <PerfumeCartProvider>
      <div className="pf-page container-page pt-8">{children}</div>
      <PerfumeCart />
    </PerfumeCartProvider>
  );
}
