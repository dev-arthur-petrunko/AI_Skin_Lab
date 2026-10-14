import { BadgeCheck, Search, Send, Truck } from "lucide-react";
import { T } from "@/lib/perfume/texts";

const FEATURES = [
  { Icon: Truck, t: T.about_f1_t, d: T.about_f1_d },
  { Icon: BadgeCheck, t: T.about_f2_t, d: T.about_f2_d },
  { Icon: Search, t: T.about_f3_t, d: T.about_f3_d },
  { Icon: Send, t: T.about_f4_t, d: T.about_f4_d },
] as const;

export default function PerfumeAbout() {
  return (
    <section className="mt-14 tile pearl-edge pf-about" aria-labelledby="pf-about-title">
      <div className="pf-about-grid">
        <div>
          <h2 className="section-label" id="pf-about-title">
            <span className="text-[var(--gold)]">●</span> {T.about_title}
          </h2>
          <p className="pf-about-lead mt-5">{T.about_p1}</p>
          <p className="pf-about-text mt-4">{T.about_p2}</p>
          <p className="pf-about-text mt-4">{T.about_p3}</p>
        </div>

        <div className="pf-about-features">
          {FEATURES.map(({ Icon, t, d }) => (
            <div key={t} className="pf-about-f">
              <span className="pf-about-f-icon">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="pf-about-f-t">{t}</p>
                <p className="pf-about-f-d">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
