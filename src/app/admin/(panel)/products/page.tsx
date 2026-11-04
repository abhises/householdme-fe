"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination, usePaging, type Paged } from "@/components/admin/Pagination";
import { adminApi, errorText } from "@/lib/admin-api";
import { score, usd } from "@/lib/format";
import type { Guide, Product } from "@/lib/types";

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[] | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [guide, setGuide] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePaging();
  const [meta, setMeta] = useState<Paged | null>(null);
  const filter = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    fn(e.target.value);
    if (page > 1) setPage(1);
  };

  useEffect(() => {
    adminApi<{ items: Guide[] }>("/guides?pageSize=500").then((d) => setGuides(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (guide) sp.set("guideId", guide);
      if (q) sp.set("q", q);
      adminApi<{ items: Product[] } & Paged>(`/products?${sp}`)
        .then((d) => {
          setRows(d.items);
          setMeta(d);
        })
        .catch((e) => setError(errorText(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [guide, q, page, pageSize]);

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Products &amp; reviews</h1>
          <p className="ad-hint" style={{ margin: "4px 0 0" }}>Each product is a pick in a buying guide and has its own review page.</p>
        </div>
        <Link href={`/admin/products/new${guide ? `?guideId=${guide}` : ""}`} className="ad-btn ad-btn--primary">+ New product</Link>
      </div>
      <div className="ad-filters">
        <input placeholder="Search products" value={q} onChange={filter(setQ)} />
        <select value={guide} onChange={filter(setGuide)}>
          <option value="">All guides</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>{g.short}</option>
          ))}
        </select>
      </div>
      {error && <p className="ad-error">{error}</p>}
      {!rows ? (
        <p>Loading…</p>
      ) : (
        <table className="ad-table">
          <thead>
            <tr><th>Product</th><th>Guide</th><th>Rank</th><th>Score</th><th>Price</th><th>Helpful</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="ad-cell-main">
                  <span className="pr-name">
                    {p.images[0] ? <img src={p.images[0]} alt="" /> : <span className="sf-image__empty" />}
                    <span>
                      <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                      <span className="ad-hint">/review/{p.slug}</span>
                    </span>
                  </span>
                </td>
                <td>{p.guide?.short ?? "—"}</td>
                <td><span className="ad-pill">{p.label}</span></td>
                <td>{score(p.score)}</td>
                <td>{usd(p.price)}</td>
                <td className="ad-cell-hide">👍 {p.helpfulYes} · 👎 {p.helpfulNo}</td>
                <td className="ad-cell-corner">
                  <a className="ad-btn ad-btn--sm" href={`/review/${p.slug}?preview=1`} target="_blank" rel="noreferrer">View ↗</a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}>No products found.</td></tr>}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
