"use client";

import Link from "next/link";
import { useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText } from "@/lib/admin-api";
import { CONTACT_PAGE_SLUG, type InfoPage } from "@/lib/types";

const kind = (p: InfoPage) =>
  p.slug === CONTACT_PAGE_SLUG ? "Contact form" : p.doc ? "Sections" : p.html.trim() ? "HTML" : "Classic";

export default function InfoPagesPage() {
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const { rows, meta, error, setError, load, page, setPage, setPageSize } = usePagedList<InfoPage>("info-pages", q ? `q=${encodeURIComponent(q)}` : "");

  const remove = async (p: InfoPage) => {
    if (!(await confirm({ title: `Delete "${p.title}"?`, message: `/info/${p.slug} will show “page not found”. Links in the footer may point to it.` }))) return;
    try {
      await adminApi(`/info-pages/${p.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Pages {meta && <span className="ad-hint">({meta.total})</span>}</h1>
          <p className="ad-hint" style={{ margin: "4px 0 0" }}>Site pages such as editorial guidelines, privacy and terms. Built with sections, like posts.</p>
        </div>
        <Link className="ad-btn ad-btn--primary" href="/admin/info-pages/new">+ Add new page</Link>
      </div>
      <div className="ad-filters">
        <input placeholder="Search pages" value={q} onChange={(e) => { setQ(e.target.value); if (page > 1) setPage(1); }} />
      </div>
      {error && <p className="ad-error">{error}</p>}
      {!rows ? <p>Loading…</p> : (
        <table className="ad-table">
          <thead><tr><th>Title</th><th className="ad-cell-hide">URL</th><th>Built with</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const contact = p.slug === CONTACT_PAGE_SLUG;
              return (
                <tr key={p.id}>
                  <td className="ad-cell-main">
                    {contact ? <strong>{p.title}</strong> : <Link href={`/admin/info-pages/${p.id}`}><strong>{p.title}</strong></Link>}
                    {p.lead && <div className="ad-hint">{p.lead}</div>}
                  </td>
                  <td className="ad-cell-hide">{contact ? "/contact" : `/info/${p.slug}`}</td>
                  <td><span className={`ad-pill${kind(p) === "Sections" ? " ad-pill--custom" : ""}`}>{kind(p)}</span></td>
                  <td><span className={`ad-pill ad-pill--${p.published ? "published" : "draft"}`}>{p.published ? "Published" : "Draft"}</span></td>
                  <td className="ad-cell-end" style={{ whiteSpace: "nowrap" }}>
                    {contact ? (
                      <Link className="ad-btn ad-btn--sm" href="/admin/messages">Messages</Link>
                    ) : (
                      <>
                        <Link className="ad-btn ad-btn--sm" href={`/admin/info-pages/${p.id}`}>Edit</Link>{" "}
                        <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(p)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={5}>{q ? "No pages match." : "No pages yet."}</td></tr>}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
