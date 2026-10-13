"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/i18n/request";
import { formatPrice } from "@/lib/format";
import { localizedField, type Product } from "@/lib/types";
import { useCart, type CartItem } from "@/providers/CartProvider";
import { INSTAGRAM_URL, INSTAGRAM_GRADIENT } from "@/lib/instagram";
import {
  X, Plus, Minus, Trash2, ShoppingCart, Search, ArrowLeft,
  Check, Loader2, Send, Camera, Sparkles,
} from "lucide-react";

type Step = "cart" | "contacts" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OrderDrawer({ open, onClose }: Props) {
  const t = useTranslations("order");
  const tCommon = useTranslations("common");
  const { items, setQty, remove, clear, count, total } = useCart();
  const reduce = useReducedMotion();

  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState({ name: "", phone: "", comment: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [remember, setRemember] = useState(false);

  // restore saved contact info
  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem("asl_order_contact");
      if (saved) {
        const c = JSON.parse(saved);
        setForm((f) => ({ ...f, name: c.name || "", phone: c.phone || "" }));
        setRemember(true);
      }
    } catch {}
  }, [open]);

  // deep-link ?order=1 opens the drawer
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("order") === "1") {
      const id = window.setTimeout(() => window.dispatchEvent(new CustomEvent("cart:open")), 400);
      return () => window.clearTimeout(id);
    }
  }, []);

  // lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // reset to cart step when reopened after success
  useEffect(() => {
    if (open && step === "done") {
      setStep("cart");
      setSubmitError(false);
    }
  }, [open, step]);

  const validate = () => {
    const e: Record<string, string> = {};
    const name = form.name.trim();
    if (name.length < 2 || name.length > 80) e.name = t("name_error");
    const digits = form.phone.replace(/\D/g, "");
    if (!digits) e.phone = t("phone_error");
    else if (!(digits.length >= 10 && digits.length <= 15)) e.phone = t("phone_format_error");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const normalizePhone = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.startsWith("0") && d.length === 10) return "+380 " + d.slice(1, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 8) + " " + d.slice(8);
    if (d.startsWith("380") && d.length === 12) return "+380 " + d.slice(2, 4) + " " + d.slice(4, 7) + " " + d.slice(7, 9) + " " + d.slice(9);
    if (d.startsWith("38") && d.length === 12) return "+380 " + d.slice(2, 4) + " " + d.slice(4, 7) + " " + d.slice(7, 9) + " " + d.slice(9);
    return raw;
  };

  const submit = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          name: form.name.trim(),
          phone: normalizePhone(form.phone),
          comment: form.comment.trim(),
          website: form.website,
          locale: "uk",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "error");
      setOrderNo(data.order_no || "");
      if (remember) {
        try {
          localStorage.setItem("asl_order_contact", JSON.stringify({ name: form.name, phone: form.phone }));
        } catch {}
      }
      clear();
      setStep("done");
    } catch {
      setSubmitError(true);
    } finally {
      setLoading(false);
    }
  };

  const steps: { key: Step; n: number }[] = [
    { key: "cart", n: 1 },
    { key: "contacts", n: 2 },
    { key: "done", n: 3 },
  ];
  const stepIdx = steps.findIndex((s) => s.key === step);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[480px] flex-col border-l border-[var(--gl)] bg-[var(--bg)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("cart_title")}
          >
            {/* header + progress */}
            <div className="border-b border-[var(--gl)] px-5 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-serif text-xl">
                  <ShoppingCart className="h-5 w-5 text-[var(--gold)]" />
                  {t("cart_title")}
                  {step === "cart" && count > 0 && (
                    <span className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-xs font-sans font-semibold text-[var(--gold)]">
                      {count}
                    </span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("close")}
                  className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--gl)] hover:text-[var(--ink)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* progress dots */}
              <div className="mt-3 flex items-center gap-2 pb-3">
                {steps.map((s, i) => (
                  <div key={s.key} className="flex flex-1 items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                        i <= stepIdx
                          ? "bg-[var(--gold)] text-white"
                          : "bg-[var(--gl)] text-[var(--muted)]"
                      }`}
                    >
                      {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : s.n}
                    </span>
                    {i < steps.length - 1 && (
                      <span className={`h-0.5 flex-1 rounded ${i < stepIdx ? "bg-[var(--gold)]" : "bg-[var(--gl)]"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {step === "cart" && (
                <CartStep items={items} setQty={setQty} remove={remove} />
              )}
              {step === "contacts" && (
                <ContactsStep
                  form={form}
                  setForm={setForm}
                  errors={errors}
                  remember={remember}
                  setRemember={setRemember}
                  total={total}
                  count={count}
                />
              )}
              {step === "done" && <DoneStep orderNo={orderNo} onClose={onClose} />}
            </div>

            {/* footer */}
            {step !== "done" && (
              <div className="border-t border-[var(--gl)] px-5 py-4">
                {submitError && (
                  <div className="mb-3 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                    <p>{t("error_text")}</p>
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ background: INSTAGRAM_GRADIENT }}
                    >
                      <Camera className="h-3.5 w-3.5" /> {t("instagram_fallback")}
                    </a>
                  </div>
                )}
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{t("total")}</span>
                  <motion.span
                    key={total}
                    initial={reduce ? false : { y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-lg font-bold text-[var(--gold)]"
                  >
                    {formatPrice(total)} {tCommon("currency")}
                  </motion.span>
                </div>
                <div className="flex gap-2">
                  {step === "contacts" && (
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="btn btn-ghost flex items-center gap-1 px-4"
                      disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4" /> {t("back_to_cart")}
                    </button>
                  )}
                  {step === "cart" ? (
                    <button
                      type="button"
                      onClick={() => items.length > 0 && setStep("contacts")}
                      disabled={items.length === 0}
                      className="btn btn-primary flex-1"
                    >
                      {t("checkout")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submit}
                      disabled={loading}
                      className="btn btn-primary flex flex-1 items-center justify-center gap-2"
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> {t("sending")}</>
                      ) : (
                        <><Send className="h-4 w-4" /> {t("submit_order")}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------- Step 1: cart ---------- */
function CartStep({
  items, setQty, remove,
}: {
  items: CartItem[];
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
}) {
  const t = useTranslations("order");
  const tCommon = useTranslations("common");

  if (items.length === 0) return <EmptyCart />;

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22 }}
            className="tile flex gap-3 p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image || "/images/placeholder.svg"}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg"; }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-[var(--muted)]">{t("sku")}: {item.sku}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="-"
                    onClick={() => setQty(item.id, item.qty - 1)}
                    disabled={item.qty <= 1}
                    className="rounded-md border border-[var(--gl)] p-1 text-[var(--muted)] transition hover:text-[var(--gold)] disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <motion.span
                    key={item.qty}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-7 text-center text-sm font-semibold"
                  >
                    {item.qty}
                  </motion.span>
                  <button
                    type="button"
                    aria-label="+"
                    onClick={() => setQty(item.id, item.qty + 1)}
                    className="rounded-md border border-[var(--gl)] p-1 text-[var(--muted)] transition hover:text-[var(--gold)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-sm font-bold text-[var(--gold)]">
                  {formatPrice((item.promo_price ?? item.price) * item.qty)} {tCommon("currency")}
                </span>
                <button
                  type="button"
                  aria-label={t("remove")}
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1 text-[var(--muted)] transition hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <AddProductSearch />
    </div>
  );
}

function EmptyCart() {
  const t = useTranslations("order");
  return (
    <div className="py-14 text-center text-[var(--muted)]">
      <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-[var(--gl)]" />
      <p className="font-medium">{t("cart_empty")}</p>
      <p className="mt-1 text-sm">{t("cart_empty_hint")}</p>
      <a href="/catalog" className="btn btn-ghost mt-5 inline-flex">
        {t("go_to_catalog")}
      </a>
    </div>
  );
}

function AddProductSearch() {
  const t = useTranslations("order");
  const tCommon = useTranslations("common");
  const { add, items } = useCart();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [openList, setOpenList] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpenList(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/catalog?search=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults((data.items || []).slice(0, 6));
        setOpenList(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);
  };

  const pick = (p: Product) => {
    add(
      {
        id: p.id,
        name: localizedField(p, "name", "uk"),
        sku: p.sku,
        price: p.promo_price ?? p.price,
        promo_price: p.promo_price,
        brand: p.brand,
        image: p.image,
      },
      1
    );
    setQ("");
    setResults([]);
    setOpenList(false);
  };

  return (
    <div className="relative mt-4">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--gl)] bg-[var(--ga)] px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); search(e.target.value); }}
          onFocus={() => results.length > 0 && setOpenList(true)}
          placeholder={t("add_search")}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />}
      </div>
      <AnimatePresence>
        {openList && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--gl)] bg-[var(--bg)] shadow-xl"
          >
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pick(p)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-[var(--gl)]/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt=""
                    className="h-10 w-10 rounded object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/placeholder.svg"; }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{localizedField(p, "name", "uk")}</span>
                    <span className="block text-xs text-[var(--muted)]">{p.sku}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--gold)]">
                    {formatPrice(p.promo_price ?? p.price)} {tCommon("currency")}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Step 2: contacts ---------- */
function ContactsStep({
  form, setForm, errors, remember, setRemember, total, count,
}: {
  form: { name: string; phone: string; comment: string; website: string };
  setForm: (f: typeof form) => void;
  errors: Record<string, string>;
  remember: boolean;
  setRemember: (v: boolean) => void;
  total: number;
  count: number;
}) {
  const t = useTranslations("order");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="ord-name">
          {t("name")} *
        </label>
        <input
          id="ord-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("name_placeholder")}
          maxLength={80}
          className={`w-full rounded-xl border bg-[var(--ga)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--gold)] ${
            errors.name ? "border-red-500/70" : "border-[var(--gl)]"
          }`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="ord-phone">
          {t("phone")} *
        </label>
        <input
          id="ord-phone"
          type="tel"
          required
          inputMode="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+380 XX XXX XX XX"
          className={`w-full rounded-xl border bg-[var(--ga)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--gold)] ${
            errors.phone ? "border-red-500/70" : "border-[var(--gl)]"
          }`}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="ord-comment">
          {t("comment")}
        </label>
        <textarea
          id="ord-comment"
          rows={3}
          maxLength={500}
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          placeholder={t("comment_placeholder")}
          className="w-full resize-none rounded-xl border border-[var(--gl)] bg-[var(--ga)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--gold)]"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 accent-[var(--gold)]"
        />
        {t("remember_me")}
      </label>

      {/* honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between rounded-xl bg-[var(--gold)]/10 px-4 py-3 text-sm">
        <span className="text-[var(--muted)]">
          {t("items_count", { count })}
        </span>
        <span className="text-base font-bold text-[var(--gold)]">
          {formatPrice(total)} {tCommon("currency")}
        </span>
      </div>
    </div>
  );
}

/* ---------- Step 3: done ---------- */
function DoneStep({ orderNo, onClose }: { orderNo: string; onClose: () => void }) {
  const t = useTranslations("order");
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col items-center py-8 text-center">
      {/* checkmark */}
      <motion.div
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="relative mb-5"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gold)] to-[#e0b551] shadow-lg shadow-[var(--gold)]/40">
          <Check className="h-10 w-10 text-white" strokeWidth={3} />
        </span>
        {/* gold sparks */}
        {!reduce &&
          Array.from({ length: 8 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1,
                x: Math.cos((i / 8) * Math.PI * 2) * 46,
                y: Math.sin((i / 8) * Math.PI * 2) * 46,
              }}
              transition={{ duration: 0.9, delay: 0.25 }}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]"
            />
          ))}
      </motion.div>

      {/* flying plane */}
      {!reduce && (
        <motion.svg
          viewBox="0 0 24 24"
          className="absolute pointer-events-none"
          initial={{ x: -80, y: 40, opacity: 0, rotate: -12 }}
          animate={{ x: 140, y: -90, opacity: [0, 1, 1, 0], rotate: -12 }}
          transition={{ duration: 1.4, delay: 0.3 }}
          style={{ left: "50%", top: "30%" }}
          width="34"
          height="34"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.6"
        >
          <path d="M2 12l19-9-5 19-4-8-10-2z" />
        </motion.svg>
      )}

      <motion.h4
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="font-serif text-2xl"
      >
        {t("success_title")}
      </motion.h4>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-sm text-[var(--muted)]"
      >
        {orderNo ? t("order_no", { no: orderNo }) : ""}
      </motion.p>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-1 text-sm text-[var(--muted)]"
      >
        {t("success_text")}
      </motion.p>

      <div className="mt-7 flex w-full flex-col gap-3">
        <button type="button" onClick={onClose} className="btn btn-primary w-full">
          {t("continue_shopping")}
        </button>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          style={{ background: INSTAGRAM_GRADIENT }}
        >
          <Camera className="h-4 w-4" />
          {t("follow_instagram")}
          <Sparkles className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
