"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/i18n/request";

type Msg = { role: "user" | "ai"; text: string };

export default function AiSection() {
  const t = useTranslations("ai_section");
  const tChat = useTranslations("chat");
  const reduce = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<Msg[]>([]);
  const [typing, setTyping] = useState<Msg | null>(null);

  const script: Msg[] = [
    { role: "user", text: t("demo_user1") },
    { role: "ai", text: t("demo_ai1") },
    { role: "user", text: t("demo_user2") },
    { role: "ai", text: t("demo_ai2") },
    { role: "user", text: t("demo_user3") },
    { role: "ai", text: t("demo_ai3") },
  ];
  const scriptKey = script.map((m) => m.text).join("|");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let started = false;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const run = async () => {
      while (!cancelled) {
        setShown([]);
        setTyping(null);
        await wait(700);
        for (let i = 0; i < script.length; i++) {
          if (cancelled) return;
          const m = script[i];
          if (m.role === "user") {
            setShown((prev) => [...prev, m]);
            await wait(850);
          } else if (reduce) {
            setShown((prev) => [...prev, m]);
            await wait(1500);
          } else {
            for (let c = 1; c <= m.text.length; c++) {
              if (cancelled) return;
              setTyping({ role: "ai", text: m.text.slice(0, c) });
              await wait(26);
            }
            setTyping(null);
            setShown((prev) => [...prev, m]);
            await wait(1500);
          }
        }
        await wait(3400);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          run();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(host);
    return () => {
      cancelled = true;
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptKey, reduce]);

  return (
    <section className="container-page mt-16 grid items-center gap-10 sm:mt-24 lg:grid-cols-2 lg:gap-14">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="section-label">{t("eyebrow")}</span>
        <h2 className="section-title mt-3">{t("title")}</h2>
        <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-[var(--muted)]">
          {t("text")}
        </p>
        <button
          type="button"
          className="btn btn-primary mt-7"
          onClick={() => window.dispatchEvent(new CustomEvent("ai:open"))}
        >
          {t("cta")}
        </button>
      </motion.div>

      <motion.div
        ref={hostRef}
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.12 }}
        className="glass !rounded-[28px] p-4 sm:p-5"
      >
        <div className="flex items-center gap-3 px-1 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gl)] text-lg">
            ✨
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">{tChat("title")}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {tChat("subtitle")}
            </div>
          </div>
          <span className="text-[11px] uppercase tracking-[.2em] text-[var(--muted)]">24/7</span>
        </div>

        <div className="min-h-[250px] space-y-3 sm:min-h-[290px]">
          {shown.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {typing && <Bubble m={typing} typing />}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full border border-[var(--gl)] px-4 py-2.5 text-sm text-[var(--muted)]">
          <span className="truncate">{tChat("placeholder")}</span>
          <span className="ml-auto inline-block h-4 w-[2px] animate-pulse bg-[var(--azure)]" />
        </div>
      </motion.div>
    </section>
  );
}

function Bubble({ m, typing }: { m: Msg; typing?: boolean }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-2xl rounded-tr-sm bg-[var(--ink)] text-[var(--bg)]"
            : "rounded-2xl rounded-tl-sm border border-[var(--gl)] bg-gradient-to-br from-[var(--ga)] to-[var(--gb)] text-[var(--ink)]"
        }`}
      >
        {m.text}
        {typing && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse bg-current align-middle" />}
      </div>
    </div>
  );
}
