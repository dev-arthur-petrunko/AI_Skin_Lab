"use client";
import { useTranslations } from "next-intl";
import { useMood } from "./MoodProvider";
import type { Mood } from "@/lib/mood";

export function MoodToggle() {
  const t = useTranslations("mood");
  const { mood, setMood } = useMood();
  const items: { v: Mood; label: string }[] = [
    { v: "all", label: t("all") },
    { v: "daily", label: t("daily") },
    { v: "evening", label: t("evening") },
    { v: "fresh", label: t("fresh") },
    { v: "gift", label: t("gift") },
  ];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("label")}>
      {items.map((it) => (
        <button
          key={it.v}
          type="button"
          className="chip-f"
          aria-pressed={mood === it.v}
          onClick={() => setMood(it.v)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
