"use client";

import { useEffect, useRef } from "react";

const DUST = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 2 + (i % 3),
  delay: -(i * 1.7),
  dur: 14 + (i % 7) * 3,
}));

export function LivingBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // warm light follows the pointer (only on real pointers)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) return;
    const el = glowRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX - 210}px, ${e.clientY - 210}px, 0)`;
      el.style.opacity = "1";
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // the base gradient darkens while a noir band is on screen
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bands = Array.from(document.querySelectorAll<HTMLElement>(".section-noir"));
    if (!bands.length) return;
    const active = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) active.add(entry.target);
          else active.delete(entry.target);
        });
        root.dataset.dim = active.size > 0 ? "1" : "0";
      },
      { threshold: 0.12 }
    );
    bands.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} aria-hidden className="living" data-dim="0">
      <div className="living-base" />
      <i
        className="blob"
        style={{ width: "46vw", height: "46vw", left: "-10vw", top: "-8vw", background: "var(--champagne)" }}
      />
      <i
        className="blob"
        style={{
          width: "38vw",
          height: "38vw",
          right: "-8vw",
          top: "18vh",
          background: "var(--blush)",
          animationDelay: "-8s",
        }}
      />
      <i
        className="blob"
        style={{
          width: "44vw",
          height: "44vw",
          left: "30vw",
          bottom: "-22vw",
          background: "var(--gold)",
          opacity: 0.25,
          animationDelay: "-14s",
        }}
      />
      {DUST.map((d, i) => (
        <b
          key={i}
          className="dust"
          style={{
            left: d.left,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        />
      ))}
      <div className="beam" />
      <div className="grain" />
      <div ref={glowRef} className="cursor-glow" />
    </div>
  );
}
