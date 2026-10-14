import { T } from "@/lib/perfume/texts";

const TIPS = [
  { icon: "◇", title: T.how_1_t, text: T.how_1_d },
  { icon: "◈", title: T.how_2_t, text: T.how_2_d },
  { icon: "◉", title: T.how_3_t, text: T.how_3_d },
  { icon: "◆", title: T.how_4_t, text: T.how_4_d },
  { icon: "❖", title: T.how_5_t, text: T.how_5_d },
];

export default function HowToWear() {
  return (
    <>
      <h2 className="section-label">
        <span className="text-[var(--gold)]">●</span> {T.how_title}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{T.how_subtitle}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TIPS.map((tip, i) => (
          <div key={tip.title} className="tile p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-gradient)] text-sm font-bold text-[var(--noir)]">
              {i + 1}
            </span>
            <h3 className="mt-3 font-serif text-lg">{tip.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{tip.text}</p>
          </div>
        ))}
      </div>
      <p className="pf-disclaimer mt-6">{T.how_disclaimer}</p>
    </>
  );
}
