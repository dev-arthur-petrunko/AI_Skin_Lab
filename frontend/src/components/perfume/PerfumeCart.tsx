"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { INSTAGRAM_URL } from "@/lib/instagram";
import { formatPrice } from "@/lib/format";
import { usePerfumeCart } from "@/lib/perfume/cart";
import { T } from "@/lib/perfume/texts";

type Step = 1 | 2 | 3;

export default function PerfumeCart() {
  const { items, setQty, remove, clear, count, total, hydrated } = usePerfumeCart();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openCart = () => {
    setStep(1);
    setSendError(null);
    setOpen(true);
  };

  const submit = async () => {
    const errs: { name?: string; phone?: string } = {};
    if (name.trim().length < 2) errs.name = T.name_error;
    if (phone.replace(/\D/g, "").length < 9) errs.phone = T.phone_error;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/perfumes/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((x) => ({ slug: x.slug, qty: x.qty })),
          name: name.trim(),
          phone: phone.trim(),
          comment: comment.trim(),
          website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { detail?: string }
          | null;
        throw new Error(data?.detail || T.error_text);
      }
      clear();
      setStep(3);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : T.error_text);
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    setOpen(false);
    if (step === 3) setStep(1);
  };

  return (
    <>
      <button type="button" className="pf-fab" onClick={openCart} aria-label={T.cart_title}>
        <ShoppingBag className="h-4 w-4" />
        {T.checkout}
        {hydrated && count > 0 && <span className="pf-fab-count">{count}</span>}
      </button>

      {open && (
        <>
          <div className="pf-overlay" onClick={close} aria-hidden />
          <aside className="pf-panel" role="dialog" aria-modal="true" aria-label={T.cart_title}>
            <div className="pf-panel-head">
              <div>
                <h2 className="font-serif text-lg">{T.cart_title}</h2>
                <div className="pf-steps mt-1.5">
                  <span className={`pf-step-dot ${step >= 1 ? "is-active" : ""}`}>1</span>
                  <span>—</span>
                  <span className={`pf-step-dot ${step >= 2 ? "is-active" : ""}`}>2</span>
                  <span>—</span>
                  <span className={`pf-step-dot ${step >= 3 ? "is-active" : ""}`}>3</span>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="✕"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gl)] transition hover:border-[var(--azure)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="pf-panel-body">
              {step === 1 && (
                items.length === 0 ? (
                  <div className="pf-empty">
                    <p className="font-serif text-lg text-[var(--ink)]">{T.cart_empty}</p>
                    <p className="mt-2 text-sm">{T.cart_empty_hint}</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div className="pf-line" key={item.slug}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="pf-line-img" src={item.image} alt={item.name} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--azure)]">
                          {item.brand}
                        </span>
                        <span className="line-clamp-2 text-sm">{item.name}</span>
                        <span className="mt-1 text-sm font-semibold text-[var(--gold)]">
                          {formatPrice(item.price)} {T.currency}
                        </span>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <span className="pf-qty">
                            <button type="button" aria-label="−" onClick={() => setQty(item.slug, item.qty - 1)}>
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[22px] text-center text-xs font-bold">{item.qty}</span>
                            <button type="button" aria-label="+" onClick={() => setQty(item.slug, item.qty + 1)}>
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </span>
                          <button
                            type="button"
                            aria-label={T.remove}
                            onClick={() => remove(item.slug)}
                            className="text-[var(--muted)] transition hover:text-[var(--sale)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {step === 2 && (
                <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
                  <p className="text-sm font-semibold text-[var(--ink)]">{T.contact_info}</p>

                  <div className="pf-field">
                    <label htmlFor="pf-name">{T.name}</label>
                    <input
                      id="pf-name"
                      className="pf-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={T.name_placeholder}
                      maxLength={80}
                      autoComplete="name"
                    />
                    {errors.name && <span className="pf-field-error">{errors.name}</span>}
                  </div>

                  <div className="pf-field">
                    <label htmlFor="pf-phone">{T.phone}</label>
                    <input
                      id="pf-phone"
                      className="pf-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={T.phone_placeholder}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    {errors.phone && <span className="pf-field-error">{errors.phone}</span>}
                  </div>

                  <div className="pf-field">
                    <label htmlFor="pf-comment">{T.comment}</label>
                    <textarea
                      id="pf-comment"
                      className="pf-input"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={T.comment_placeholder}
                      maxLength={500}
                    />
                  </div>

                  {/* honeypot */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
                  />

                  {sendError && (
                    <div className="mt-3 rounded-2xl border border-[var(--sale)]/40 bg-[var(--sale)]/10 p-3 text-sm">
                      <p className="font-semibold text-[var(--sale)]">{T.error_title}</p>
                      <p className="mt-1 text-[var(--muted)]">{sendError}</p>
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-[var(--azure)]"
                      >
                        {T.instagram} →
                      </a>
                    </div>
                  )}
                </form>
              )}

              {step === 3 && (
                <div className="py-8 text-center">
                  <span className="pf-success-mark">
                    <Check className="h-7 w-7" />
                  </span>
                  <p className="mt-4 font-serif text-xl">{T.success_title}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{T.success_text}</p>
                </div>
              )}
            </div>

            <div className="pf-panel-foot">
              {step === 1 && items.length > 0 && (
                <>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">{T.total}</span>
                    <span className="text-lg font-bold text-[var(--gold)]">
                      {formatPrice(total)} {T.currency}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={() => setStep(2)}
                  >
                    {T.checkout}
                  </button>
                </>
              )}

              {step === 2 && (
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(1)}>
                    ←
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-[3]"
                    onClick={submit}
                    disabled={sending}
                  >
                    {sending ? T.sending : T.submit}
                  </button>
                </div>
              )}

              {step === 3 && (
                <button type="button" className="btn btn-primary w-full" onClick={close}>
                  {T.back_to_shop}
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
