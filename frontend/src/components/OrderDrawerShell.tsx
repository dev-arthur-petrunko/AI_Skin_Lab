"use client";

import OrderDrawer from "@/components/OrderDrawer";
import { useCart } from "@/providers/CartProvider";

export default function OrderDrawerShell() {
  const { isOpen, close } = useCart();
  return <OrderDrawer open={isOpen} onClose={close} />;
}
