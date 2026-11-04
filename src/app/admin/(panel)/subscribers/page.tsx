"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText } from "@/lib/admin-api";
import type { Subscriber } from "@/lib/types";

export default function SubscribersPage() {
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const { rows, meta, error, setError, load, page, setPage, setPageSize } = usePagedList<Subscriber>("subscribers", q ? `q=${encodeURIComponent(q)}` : "");
  const remove = async (s: Subscriber) => {
    if (!(await confirm({ title: "Remove subscriber?", message: `${s.email} will be removed from the newsletter list.`, confirmLabel: "Remove" }))) return;
    try {
      await adminApi(`/subscribers/${s.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <>
      <div className="ad-head">
        <h1>Subscribers {meta && <span className="ad-hint">({meta.total})</span>}</h1>
        <a className="ad-btn" href="/api/admin/subscribers/export.csv">Export CSV</a>
      </div>
      <div className="ad-filters">
        <input placeholder="Search email" value={q} onChange={(e) => { setQ(e.target.value); if (page > 1) setPage(1); }} />
      </div>
      {error && <p className="ad-error">{error}</p>}
      {!rows ? <p>Loading…</p> : (
        <table className="ad-table">
          <thead><tr><th>Email</th><th>Source</th><th>Signed up</th><th></th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="ad-cell-main">{s.email}</td>
                <td>{s.source ?? "—"}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td className="ad-cell-end"><button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(s)}>Remove</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4}>No subscribers yet.</td></tr>}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
