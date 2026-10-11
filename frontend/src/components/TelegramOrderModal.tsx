"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/request";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    promo_price: number | null;
    brand: string;
  };
}

const BOT_TOKEN = "REDACTED_BOT_TOKEN";
const CHAT_ID = "480749021";
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

export default function TelegramOrderModal({ isOpen, onClose, product }: Props) {
  const t = useTranslations("order");
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    quantity: 1,
    comment: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("name_error");
    if (!formData.phone.trim()) newErrors.phone = t("phone_error");
    if (!/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone)) newErrors.phone = t("phone_format_error");
    if (formData.quantity < 1) newErrors.quantity = t("quantity_error");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || loading) return;

    setLoading(true);
    const price = product.promo_price ?? product.price;
    const total = price * formData.quantity;

    const message = `
🛒 <b>Нове замовлення з AI Skin Lab</b>

📦 <b>Товар:</b> ${product.name}
🏷 <b>Артикул:</b> ${product.sku}
💰 <b>Ціна:</b> ${price} грн
🔢 <b>Кількість:</b> ${formData.quantity}
💵 <b>Разом:</b> ${total} грн

👤 <b>Ім'я:</b> ${formData.name}
📞 <b>Телефон:</b> ${formData.phone}
💬 <b>Коментар:</b> ${formData.comment || "—"}

🔗 <b>Посилання на товар:</b> https://ai-skinlab.com/product/${encodeURIComponent(product.id)}
    `.trim();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      });

      if (!res.ok) throw new Error("Telegram API error");
      setStep("success");
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
        className="tile w-full max-w-md rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--gl)]">
          <h3 className="font-serif text-xl">{t("title")}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--ga)] transition text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label={t("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1">
                {t("product")} <span className="font-normal text-[var(--muted)]">({product.sku})</span>
              </label>
              <p className="text-sm text-[var(--ink)] font-medium">{product.name}</p>
              <p className="text-sm text-[var(--gold)] font-semibold">
                {product.promo_price ? `${product.promo_price} грн <span className="line-through text-[var(--muted)] text-xs">${product.price} грн</span>` : `${product.price} грн`}
              </p>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-[var(--ink)] mb-1">
                {t("quantity")}
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                max="99"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="input w-full"
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? t("sending") : t("submit")}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="p-8 text-center">
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
          <div className="p-8 text-center">
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
      </motion.div>
    </div>
  );
}