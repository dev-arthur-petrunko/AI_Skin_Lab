"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  promo_price: number | null;
  brand: string;
  image: string;
  qty: number;
}

type Action =
  | { type: "ADD"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "SET_QTY"; id: string; qty: number }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  bump: number;
}

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "SET_QTY"; id: string; qty: number }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" }
  | { type: "TOGGLE_OPEN" }
  | { type: "CLOSE" }
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "BUMP" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const { item, qty = 1 } = action;
      return {
        ...state,
        items: state.items.some((x) => x.id === item.id)
          ? state.items.map((x) =>
              x.id === item.id ? { ...x, qty: Math.min(99, x.qty + qty) } : x
            )
          : [...state.items, { ...item, qty }],
      };
    }
    case "SET_QTY":
      return {
        ...state,
        items: state.items.map((x) =>
          x.id === action.id ? { ...x, qty: Math.max(1, Math.min(99, action.qty)) } : x
        ),
      };
    case "REMOVE":
      return { ...state, items: state.items.filter((x) => x.id !== action.id) };
    case "CLEAR":
      return { ...state, items: [] };
    case "TOGGLE_OPEN":
      return { ...state, isOpen: !state.isOpen };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "HYDRATE":
      return { ...state, items: action.items };
    case "BUMP":
      return { ...state, bump: state.bump + 1 };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  bump: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  count: number;
  total: number;
  bumpKey: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

function generateSessionId(): string {
  if (typeof window === 'undefined') {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  let sid = sessionStorage.getItem("asl_session_id");
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("asl_session_id", sid);
  }
  return sid;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => generateSessionId());

  const [state, dispatch] = useReducer(reducer, {
    items: [],
    isOpen: false,
    bump: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(`asl_cart_v1_${sessionId}`);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        dispatch({ type: "HYDRATE", items });
      }
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`asl_cart_v1_${sessionId}`, JSON.stringify(state.items));
    } catch {}
  }, [state.items, sessionId]);

  const actions = useMemo(
    () => ({
      add: (item: Omit<CartItem, "qty">, qty = 1) => {
        dispatch({ type: "ADD", item, qty });
        dispatch({ type: "BUMP" });
      },
      setQty: (id: string, qty: number) => dispatch({ type: "SET_QTY", id, qty }),
      remove: (id: string) => dispatch({ type: "REMOVE", id }),
      clear: () => dispatch({ type: "CLEAR" }),
      open: () => dispatch({ type: "TOGGLE_OPEN" }),
      close: () => dispatch({ type: "CLOSE" }),
      hydrate: (items: CartItem[]) => dispatch({ type: "HYDRATE", items }),
    }),
    []
  );

  const value = useMemo(
    () => ({
      items: state.items,
      isOpen: state.isOpen,
      bump: state.bump,
      bumpKey: state.bump,
      count: state.items.reduce((s, x) => s + x.qty, 0),
      total: state.items.reduce((s, x) => s + x.qty * x.price, 0),
      ...actions,
    }),
    [state, dispatch]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}