import Link from "next/link";
import type { PerfumeFacets } from "@/lib/perfume/api";
import { T } from "@/lib/perfume/texts";
import { toSearchParams } from "@/lib/perfume/query";

type Props = { families: PerfumeFacets["families"] };

function arcPos(i: number, n: number, radius: number) {
  const start = -Math.PI * 0.92;
  const end = Math.PI * 0.92;
  const angle = n <= 1 ? Math.PI : start + ((end - start) * i) / (n - 1);
  return {
    left: `${50 + radius * Math.cos(angle)}%`,
    top: `${50 + radius * Math.sin(angle)}%`,
  };
}

export default function AromaCircle({ families }: Props) {
  const items = families.slice(0, 12);

  return (
    <div className="pf-circle-wrap">
      <div className="pf-circle-ring" aria-hidden />
      <div className="pf-circle-core">
        <span className="section-label">
          <span className="text-[var(--gold)]">●</span> {T.families_title}
        </span>
        <p className="mt-2 font-serif text-xl leading-tight text-[var(--ink)]">
          {items.length}
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          {T.families_word}
        </p>
      </div>
      {items.map((f, i) => {
        const pos = arcPos(i, items.length, 42);
        return (
          <span key={f.value} className="pf-orbit" style={pos}>
            <Link
              href={`/perfume${toSearchParams({ family: f.value })}#pf-collection`}
              className="chip-f"
            >
              {f.value}
              <span className="ml-1.5 text-xs opacity-60">{f.count}</span>
            </Link>
          </span>
        );
      })}
    </div>
  );
}
