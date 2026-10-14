import type { PerfumeNotes } from "@/lib/perfume/api";
import { T } from "@/lib/perfume/texts";

type Props = { notes: PerfumeNotes; description?: string };

export default function NotePyramid({ notes, description }: Props) {
  const groups = [
    { key: "top", label: T.notes_top, items: notes.top },
    { key: "heart", label: T.notes_heart, items: notes.heart },
    { key: "base", label: T.notes_base, items: notes.base },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="pf-pyramid">
      {groups.length > 0 ? (
        groups.map((g) => (
          <div className="pf-note-group" key={g.key}>
            <h3>{g.label}</h3>
            <div className="pf-note-list">
              {g.items.map((n) => (
                <span className="pf-note" key={n}>{n}</span>
              ))}
            </div>
          </div>
        ))
      ) : description ? (
        <div className="pf-note-group">
          <h3>{T.notes_top}</h3>
          <p className="text-sm leading-relaxed text-[var(--muted)]">{description}</p>
        </div>
      ) : null}
    </div>
  );
}
