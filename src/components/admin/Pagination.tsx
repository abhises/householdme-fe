'use client';

// Same paging behaviour as the BrasQ admin: ?page= and ?perPage= live in the URL.
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/** Response shape of a paged admin list (`?page=` sent). */
export type Paged = { page: number; pageSize: number; total: number };

export const PAGE_SIZES = [5, 10, 20, 40];
export const DEFAULT_PAGE_SIZE = 10;

export type Paging = { page: number; pageSize: number; setPage: (p: number) => void; setPageSize: (n: number) => void };

/**
 * `?page=` and `?perPage=` from the URL. Changes push a history entry, so Back returns to the previous page;
 * a new page size starts again at page 1.
 */
export function usePaging(): Paging {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Math.floor(Number(params.get('page'))) || 1);
  const perPage = Number(params.get('perPage'));
  const pageSize = PAGE_SIZES.includes(perPage) ? perPage : DEFAULT_PAGE_SIZE;

  const push = useCallback((change: (q: URLSearchParams) => void) => {
    const q = new URLSearchParams(params);
    change(q);
    router.push(q.size ? `${pathname}?${q}` : pathname);
  }, [params, router, pathname]);
  const setPage = useCallback((p: number) => push((q) => { if (p > 1) q.set('page', String(p)); else q.delete('page'); }), [push]);
  const setPageSize = useCallback((n: number) => push((q) => {
    q.delete('page');
    if (n === DEFAULT_PAGE_SIZE) q.delete('perPage'); else q.set('perPage', String(n));
  }), [push]);
  return { page, pageSize, setPage, setPageSize };
}

/** 1 … 4 5 [6] 7 8 … 20 — always the first and last page, two either side of the current one. */
function pageList(page: number, pages: number): (number | '…')[] {
  const out: (number | '…')[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 2) out.push(p);
    else if (out[out.length - 1] !== '…') out.push('…');
  }
  return out;
}

export function Pagination({ page, pageSize, total, onChange, onPageSizeChange }: Paged & {
  onChange: (page: number) => void; onPageSizeChange: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  // e.g. the last item on the last page was deleted: fall back to the new last page
  useEffect(() => { if (total > 0 && page > pages) onChange(pages); }, [page, pages, total, onChange]);

  if (!total || !pageSize) return null; // also covers a backend without paging (no total)
  const go = (p: number) => { onChange(p); window.scrollTo({ top: 0 }); };
  const from = (page - 1) * pageSize + 1;
  return (
    <nav className="ad-pager" aria-label="Pagination">
      {pages > 1 && (
        <div className="ad-pager__pages">
          <button className="ad-btn ad-btn--sm" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous page">‹<span className="ad-pager__word"> Prev</span></button>
          {pageList(page, pages).map((p, i) => p === '…'
            ? <span key={`gap${i}`} className="ad-pager__gap">…</span>
            : <button key={p} className={`ad-btn ad-btn--sm${p === page ? ' ad-btn--primary' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}>{p}</button>)}
          <button className="ad-btn ad-btn--sm" disabled={page >= pages} onClick={() => go(page + 1)} aria-label="Next page"><span className="ad-pager__word">Next </span>›</button>
        </div>
      )}
      <div className="ad-pager__info">
        <label className="ad-pager__size">Per page
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span className="ad-hint">Showing {from}–{Math.min(page * pageSize, total)} of {total}</span>
      </div>
    </nav>
  );
}
