"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/request";
import { X, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  promo_price: number | null;
  brand: string;
  image: string;
  quantity: number;
}

interface ProductData {
  id: string;
  name: string;
  sku: string;
  price: number;
  promo_price: number | null;
  brand: string;
  image: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: ProductData;
  onAddProduct?: () => void;
}

const ORDERS_API = "/api/orders";

export default function TelegramOrderModal({ isOpen, onClose, initialProduct, onAddProduct }: Props) {
  const t = useTranslations("order");
  const [step, setStep] = useState<"cart" | "form" | "success" | "error">("cart");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    comment: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize cart with initial product if provided
  useEffect(() => {
    if (initialProduct && cart.length === 0) {
      setCart([{
        id: initialProduct.id,
        name: initialProduct.name,
        sku: initialProduct.sku,
        price: initialProduct.promo_price ?? initialProduct.price,
        promo_price: initialProduct.promo_price,
        brand: initialProduct.brand,
        image: initialProduct.image,
        quantity: 1,
      }]);
      setStep("cart");
    }
  }, [initialProduct, cart.length]);

  const getItemTotal = (item: CartItem) => item.price * item.quantity;
  const getCartTotal = () => cart.reduce((sum, item) => sum + getItemTotal(item), 0);
  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    if (cart.length === 1) setStep("cart");
  };

  const clearCart = () => {
    setCart([]);
    setStep("cart");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("name_error");
    if (!formData.phone.trim()) newErrors.phone = t("phone_error");
    if (!/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone)) newErrors.phone = t("phone_format_error");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && cart.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || loading) return;

    setLoading(true);
    const total = getCartTotal();
    const itemsCount = getCartCount();

    const itemsMessage = cart.map(item => 
      `${item.name} (${item.sku}) × ${item.quantity} = ${item.price * item.quantity} грн`
    ).join("\n");

    const message = `
🛒 <b>Нове замовлення з AI Skin Lab</b>

${itemsMessage}

💵 <b>Разом:</b> ${total} грн (${itemsCount} шт.)

👤 <b>Ім'я:</b> ${formData.name}
📞 <b>Телефон:</b> ${formData.phone}
💬 <b>Коментар:</b> ${formData.comment || "—"}
    `.trim();

    try {
      const res = await fetch(ORDERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.id, qty: item.quantity })),
          name: formData.name,
          phone: formData.phone,
          comment: formData.comment,
          locale: "uk",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Telegram API error");
      }
      setStep("success");
      clearCart();
    } catch {
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="tile w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--gl)]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[var(--gold)]" />
            <h3 className="font-serif text-xl">{t("title")}</h3>
            <span className="bg-[var(--gold)]/20 text-[var(--gold)] text-xs px-2 py-0.5 rounded-full font-medium">
              {getCartCount()} {getCartCount() === 1 ? "товар" : getCartCount() < 5 ? "товари" : "товарів"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--ga)] transition text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label={t("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {step === "cart" && (
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[var(--muted)]">
                  <ShoppingCart className="mx-auto mb-3 w-12 h-12 text-[var(--gl)]" />
                  <p className="font-medium">{t("cart_empty")}</p>
                  <p className="text-sm mt-1">{t("cart_empty_hint")}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="tile flex items-start gap-3 p-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[var(--ink)] truncate">{item.name}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{item.sku}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-[var(--gold)]">
                              {item.price} грн
                            </span>
                            {item.promo_price && (
                              <span className="text-xs line-through text-[var(--muted)]">
                                {item.promo_price + item.price - item.price} грн
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded hover:bg-[var(--ga)] transition text-[var(--muted)]"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 rounded hover:bg-[var(--ga)] transition text-[var(--muted)]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-1 p-1 rounded hover:bg-red-100 transition text-[var(--muted)] hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--gl)] pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">{t("subtotal")}</span>
                      <span className="font-medium text-[var(--ink)]">{cart.reduce((s, i) => s + i.price * i.quantity, 0)} грн</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>{t("total")}</span>
                      <span className="text-[var(--gold)]">{cart.reduce((s, i) => s + i.price * i.quantity, 0)} грн</span>
                    </div>

                    <button
                      onClick={() => setStep("form")}
                      className="btn btn-primary w-full py-3"
                      disabled={cart.length === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t("checkout")}
                    </button>

                    {onAddProduct && (
                      <button
                        onClick={() => { setStep("cart"); onClose(); }}
                        className="btn btn-ghost w-full py-2 text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("add_more")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-t border-[var(--gl)] pt-4">
                <h4 className="font-medium mb-3">{t("contact_info")}</h4>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--ink)] mb-1">
                    {t("name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("name_placeholder")}
                    className="input w-full"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--ink)] mb-1">
                    {t("phone")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t("phone_placeholder")}
                    className="input w-full"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-[var(--ink)] mb-1">
                    {t("comment")}
                  </label>
                  <textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder={t("comment_placeholder")}
                    rows={3}
                    className="input w-full resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-[var(--gl)]">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--muted)]">{t("total")}</span>
                    <span className="font-bold text-[var(--gold)]">{cart.reduce((s, i) => s + i.price * i.quantity, 0)} грн</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || cart.length === 0}
                    className="btn btn-primary w-full py-3"
                  >
                    {loading ? t("sending") : t("submit_order")}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="btn btn-ghost w-full py-2"
                >
                  {t("back_to_cart")}
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-serif text-xl text-[var(--ink)]">{t("success_title")}</h4>
              <p className="mt-2 text-[var(--muted)]">{t("success_text")}</p>
              <button
                onClick={onClose}
                className="mt-6 btn btn-primary"
              >
                {t("close")}
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h4 className="font-serif text-xl text-[var(--ink)]">{t("error_title")}</h4>
              <p className="mt-2 text-[var(--muted)]">{t("error_text")}</p>
              <button
                onClick={() => setStep("form")}
                className="mt-6 btn btn-primary"
              >
                {t("retry")}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}