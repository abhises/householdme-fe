"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination, usePaging, type Paged } from "@/components/admin/Pagination";
import { adminApi, errorText } from "@/lib/admin-api";
import { POST_TYPES, postTypeLabel, type Category, type Guide } from "@/lib/types";

type Row = Guide & { category: { name: string }; author: { name: string }; products: { id: string }[]; updatedAt: string };

export default function GuidesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePaging();
  const [meta, setMeta] = useState<Paged | null>(null);
  // a new filter starts again at page 1
  const filter = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    fn(e.target.value);
    if (page > 1) setPage(1);
  };

  useEffect(() => {
    adminApi<{ items: Category[] }>("/categories").then((d) => setCats(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (category) sp.set("categoryId", category);
      if (type) sp.set("type", type);
      if (status) sp.set("published", status === "published" ? "true" : "false");
      if (q) sp.set("q", q);
      adminApi<{ items: Row[] } & Paged>(`/guides?${sp}`)
        .then((d) => {
          setRows(d.items);
          setMeta(d);
        })
        .catch((e) => setError(errorText(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [category, type, status, q, page, pageSize]);

  return (
    <>
      <div className="ad-head">
        <h1>All posts</h1>
        <Link href="/admin/guides/new" className="ad-btn ad-btn--primary">+ Add new post</Link>
      </div>
      <div className="ad-filters">
        <input placeholder="Search title or slug" value={q} onChange={filter(setQ)} />
        <select value={type} onChange={filter(setType)}>
          <option value="">All post types</option>
          {POST_TYPES.map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select value={category} onChange={filter(setCategory)}>
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={filter(setStatus)}>
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      {error && <p className="ad-error">{error}</p>}
      {!rows ? (
        <p>Loading…</p>
      ) : (
        <table className="ad-table">
          <thead>
            <tr><th></th><th>Title</th><th>Type</th><th>Status</th><th>Category</th><th>Author</th><th>Picks</th><th>Updated</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id}>
                <td className="ad-cell-hide" style={{ width: 52 }}>{g.coverImage ? <img src={g.coverImage} alt="" className="ad-thumb" /> : <span className="ad-thumb" />}</td>
                <td className="ad-cell-main">
                  <Link href={`/admin/guides/${g.id}`}>{g.title}</Link>
                  {g.full && <span className="ad-pill" style={{ marginLeft: 6 }}>Long-form</span>}
                  <div className="ad-hint">/guide/{g.slug}</div>
                </td>
                <td><span className="ad-pill">{postTypeLabel(g.type)}</span></td>
                <td><span className={`ad-pill ad-pill--${g.published ? "published" : "draft"}`}>{g.published ? "published" : "draft"}</span></td>
                <td>{g.category?.name ?? "—"}</td>
                <td>{g.author?.name ?? "—"}</td>
                <td>{g.products.length}<span className="ad-sm-only"> picks</span></td>
                <td className="ad-cell-hide">{new Date(g.updatedAt).toLocaleDateString()}</td>
                <td className="ad-cell-corner">
                  <a className="ad-btn ad-btn--sm" href={`/guide/${g.slug}${g.published ? "" : "?preview=1"}`} target="_blank" rel="noreferrer">View ↗</a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9}>No posts found.</td></tr>}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
