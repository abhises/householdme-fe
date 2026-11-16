import Link from "next/link";
import { PendingHint } from "./PendingHint";

export const SITE_PAGE_SIZE = 25;

/** Read ?page= from a page's searchParams (1 when missing or invalid). */
export function pageParam(sp: Record<string, string | string[] | undefined>) {
  return Math.max(1, Math.floor(Number(sp.page)) || 1);
}

/** 1 … 4 5 [6] 7 8 … 20: the first and last page, two either side of the current one. */
function pageList(page: number, pages: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 2) out.push(p);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

/** Server-rendered page links (?page=N), keeping any other query params such as ?q=. Hidden when there's one page. */
export function SitePagination({
  page,
  total,
  pageSize = SITE_PAGE_SIZE,
  path,
  params = {},
}: {
  page: number;
  total: number;
  pageSize?: number;
  path: string;
  params?: Record<string, string>;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(params);
    if (p > 1) q.set("page", String(p));
    return q.size ? `${path}?${q}` : path;
  };
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">‹ Prev</Link> : <span aria-disabled="true">‹ Prev</span>}
      {pageList(page, pages).map((p, i) =>
        p === "…" ? (
          <span key={`gap${i}`} className="pager-gap">…</span>
        ) : (
          <Link key={p} href={href(p)} aria-current={p === page ? "page" : undefined} style={{ position: "relative" }}>
            {p}
            <PendingHint />
          </Link>
        ),
      )}
      {page < pages ? <Link href={href(page + 1)} rel="next">Next ›</Link> : <span aria-disabled="true">Next ›</span>}
    </nav>
  );
}
