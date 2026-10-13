import Link from "next/link";
import uk from "@/messages/uk.json";
import { INSTAGRAM_URL, INSTAGRAM_GRADIENT } from "@/lib/instagram";

export const dynamic = "force-dynamic";

const g = uk.guide;

const SKINS: [string, string][] = Object.entries(g.skin);
const PURPOSES: [string, string][] = Object.entries(g.purpose);

export default function GuidePage() {
  const steps = [
    { title: g.step1_title, text: g.step1_text },
    { title: g.step2_title, text: g.step2_text },
    { title: g.step3_title, text: g.step3_text },
  ];

  return (
    <div className="container-page py-14">
      <header className="max-w-3xl">
        <h1 className="section-title">{g.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          {g.subtitle}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/#directions" className="btn btn-primary">
            {g.cta}
          </Link>
          <Link href="/catalog" className="btn btn-ghost">
            {g.catalog_cta}
          </Link>
        </div>
      </header>

      {/* steps */}
      <section className="mt-14">
        <h2 className="section-label">
          <span className="text-[var(--gold)]">●</span> {g.steps_label}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="tile p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-gradient)] text-sm font-bold text-[var(--noir)]">
                {i + 1}
              </span>
              <h3 className="mt-3 font-serif text-lg">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* skin types */}
      <section className="mt-14">
        <h2 className="section-label">
          <span className="text-[var(--gold)]">●</span> {g.skins_label}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKINS.map(([name, desc]) => (
            <div key={name} className="tile flex flex-col p-5">
              <h3 className="font-serif text-lg text-[var(--gold)]">{name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              <Link
                href={`/catalog?skin=${encodeURIComponent(name)}`}
                className="mt-4 self-start text-sm font-semibold text-[var(--azure)] transition hover:text-[var(--gold)]"
              >
                {g.find_label} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* purposes */}
      <section className="mt-14">
        <h2 className="section-label">
          <span className="text-[var(--gold)]">●</span> {g.purposes_label}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PURPOSES.map(([name, desc]) => (
            <div key={name} className="tile flex flex-col p-5">
              <h3 className="font-serif text-lg text-[var(--gold)]">{name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              <Link
                href={`/catalog?purpose=${encodeURIComponent(name)}`}
                className="mt-4 self-start text-sm font-semibold text-[var(--azure)] transition hover:text-[var(--gold)]"
              >
                {g.find_label} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* instagram CTA */}
      <div className="mt-14 flex flex-wrap items-center gap-4">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn text-white"
          style={{ background: INSTAGRAM_GRADIENT }}
        >
          {uk.order.follow_instagram}
        </a>
        <Link href="/#directions" className="btn btn-ghost">
          {g.cta}
        </Link>
      </div>
    </div>
  );
}
