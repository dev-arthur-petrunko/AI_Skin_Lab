"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import TelegramOrderModal from "@/components/TelegramOrderModal";
import type { Product } from "@/lib/types";

interface OrderModalContextValue {
  isOpen: boolean;
  initialProduct: Product | null;
  open: (product: Product) => void;
  close: () => void;
}

const OrderModalContext = createContext<OrderModalContextValue | null>(null);

export function useOrderModal() {
  const ctx = useContext(OrderModalContext);
  if (!ctx) throw new Error("useOrderModal must be used within OrderModalProvider");
  return ctx;
}

export function OrderModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialProduct, setInitialProduct] = useState<Product | null>(null);

  const open = useCallback((product: Product) => {
    setInitialProduct(product);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInitialProduct(null);
  }, []);

  // Listen for custom event to open modal from anywhere (e.g., ProductCard)
  useEffect(() => {
    const handleOrderOpen = (e: CustomEvent<Product>) => {
      open(e.detail);
    };
    window.addEventListener("order:open", handleOrderOpen as EventListener);
    return () => window.removeEventListener("order:open", handleOrderOpen as EventListener);
  }, []);

  return (
    <OrderModalContext.Provider value={{ isOpen, initialProduct, open, close }}>
      {children}
    </OrderModalContext.Provider>
  );
}

// Global modal component that renders at the root level
export function GlobalOrderModal() {
  const { isOpen, initialProduct, close } = useOrderModal();
  // We need to dynamically import TelegramOrderModal to avoid circular dependency
  // For now, we'll import it directly
  const TelegramOrderModal = require("@/components/TelegramOrderModal").default;

  if (!isOpen) return null;

  return (
    <TelegramOrderModal
      isOpen={true}
      onClose={() => { /* handled by provider */ }}
      initialProduct={initialProduct}
    />
  );
}

export function useOrderModalTrigger() {
  const { open } = useOrderModal();
  return useCallback((product: Product) => {
    open(product);
  }, [open]);
}