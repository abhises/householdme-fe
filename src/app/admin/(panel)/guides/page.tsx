"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination, usePaging, type Paged } from "@/components/admin/Pagination";
import { adminApi, errorText } from "@/lib/admin-api";
import { POST_TYPES, postTypeLabel, type AllSettings, type Guide } from "@/lib/types";

type Row = Guide & { category: { name: string }; author: { name: string }; updatedAt: string };

/** Posts list, as in the BrasQ admin (/admin/posts). */
export default function PostsPage() {
  const [posts, setPosts] = useState<Row[] | null>(null);
  const [heroSlug, setHeroSlug] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePaging();
  const [meta, setMeta] = useState<Paged | null>(null);
  // a new filter starts again at page 1
  const filter = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { fn(e.target.value); if (page > 1) setPage(1); };

  useEffect(() => {
    adminApi<{ values: AllSettings }>("/settings").then((d) => setHeroSlug(d.values.home.heroGuideSlug)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort: "updated" });
      if (type) sp.set("type", type);
      if (status) sp.set("published", status === "published" ? "true" : "false");
      if (q) sp.set("q", q);
      adminApi<{ items: Row[] } & Paged>(`/guides?${sp}`).then((d) => { setPosts(d.items); setMeta(d); }).catch((e) => setError(errorText(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [type, status, q, page, pageSize]);

  return (
    <>
      <div className="ad-head">
        <h1>Posts</h1>
        <Link href="/admin/guides/new" className="ad-btn ad-btn--primary">+ New post</Link>
      </div>
      <div className="ad-filters">
        <input placeholder="Search title or slug" value={q} onChange={filter(setQ)} />
        <select value={type} onChange={filter(setType)}>
          <option value="">All types</option>{POST_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={status} onChange={filter(setStatus)}>
          <option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option>
        </select>
      </div>
      {error && <p className="ad-error">{error}</p>}
      {!posts ? <p>Loading…</p> : (
        <table className="ad-table">
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Category</th><th>Author</th><th>Updated</th><th></th></tr></thead>
          <tbody>
            {posts.map((p) => {
              const status = p.published ? "published" : "draft";
              return (
                <tr key={p.id}>
                  <td className="ad-cell-main"><Link href={`/admin/guides/${p.id}`}>{p.title}</Link>{p.slug === heroSlug && <span className="ad-pill" style={{ marginLeft: 6 }}>Home hero</span>}<div className="ad-hint">/guide/{p.slug}</div></td>
                  <td>{postTypeLabel(p.type)}</td>
                  <td><span className={`ad-pill ad-pill--${status}`}>{status}</span></td>
                  <td>{p.category?.name ?? "—"}</td>
                  <td>{p.author?.name ?? "—"}</td>
                  <td className="ad-cell-hide">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="ad-cell-corner"><a className="ad-btn ad-btn--sm" href={`/guide/${p.slug}${p.published ? "" : "?preview=1"}`} target="_blank" rel="noreferrer">View ↗</a></td>
                </tr>
              );
            })}
            {posts.length === 0 && <tr><td colSpan={7}>No posts found.</td></tr>}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
