import { normalizeQuery, toSearchParams, type PerfumeQuery } from "./query";

export const PF_QUERY_EVENT = "pf:query";
export const PF_RESULT_EVENT = "pf:result";

export function queryFromSearch(search: string): PerfumeQuery {
  const raw: Record<string, string> = {};
  new URLSearchParams(search.replace(/^\?/, "")).forEach((v, k) => {
    raw[k] = v;
  });
  return normalizeQuery(raw);
}

export function currentPerfumeQuery(): PerfumeQuery {
  return queryFromSearch(window.location.search);
}

/**
 * Client-side filter navigation for /perfume: updates the URL without a
 * Next router soft-navigation (App Router RSC fetches stall in this build)
 * and notifies subscribers to refetch results.
 */
export function applyPerfumeQuery(
  next: PerfumeQuery,
  opts?: { hash?: boolean; scroll?: boolean }
): void {
  const qs = toSearchParams(next);
  const url = `/perfume${qs}${opts?.hash ? "#pf-collection" : ""}`;
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new CustomEvent(PF_QUERY_EVENT, { detail: qs }));
  if (opts?.scroll) {
    requestAnimationFrame(() => {
      document.getElementById("pf-collection")?.scrollIntoView({ behavior: "smooth" });
    });
  }
}

export function subscribePerfumeQuery(cb: (q: PerfumeQuery) => void): () => void {
  const onEvent = (e: Event) => {
    cb(queryFromSearch((e as CustomEvent<string>).detail || window.location.search));
  };
  const onPop = () => cb(currentPerfumeQuery());
  window.addEventListener(PF_QUERY_EVENT, onEvent);
  window.addEventListener("popstate", onPop);
  return () => {
    window.removeEventListener(PF_QUERY_EVENT, onEvent);
    window.removeEventListener("popstate", onPop);
  };
}

export function emitPerfumeResult(total: number): void {
  window.dispatchEvent(new CustomEvent(PF_RESULT_EVENT, { detail: total }));
}

export function subscribePerfumeResult(cb: (total: number) => void): () => void {
  const on = (e: Event) => cb((e as CustomEvent<number>).detail);
  window.addEventListener(PF_RESULT_EVENT, on);
  return () => window.removeEventListener(PF_RESULT_EVENT, on);
}
