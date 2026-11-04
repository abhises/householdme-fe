"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText, slugify } from "@/lib/admin-api";
import type { Category } from "@/lib/types";

type Row = Category & { _count: { guides: number } };
const blank = { id: "", name: "", slug: "", intro: "", sortOrder: 0 };

export default function CategoriesPage() {
  const confirm = useConfirm();
  const { rows, meta, error: loadError, load, setPage, setPageSize } = usePagedList<Row>("categories");
  const [edit, setEdit] = useState<typeof blank | null>(null);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError("");
    const { id, ...body } = edit;
    try {
      await adminApi(id ? `/categories/${id}` : "/categories", { method: id ? "PUT" : "POST", json: { ...body, slug: body.slug || slugify(body.name), sortOrder: Number(body.sortOrder) } });
      setEdit(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (c: Row) => {
    if (!(await confirm({ title: `Delete category "${c.name}"?`, message: c._count.guides ? `It still has ${c._count.guides} guides. Move them to another category first.` : "This cannot be undone." }))) return;
    try {
      await adminApi(`/categories/${c.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <>
      <div className="ad-head">
        <h1>Categories</h1>
        <button className="ad-btn ad-btn--primary" onClick={() => setEdit({ ...blank, sortOrder: meta?.total ?? 0 })}>+ New category</button>
      </div>
      {edit && (
        <form className="ad-card ad-form" style={{ marginBottom: 16, maxWidth: 640 }} onSubmit={save}>
          <div className="ad-2">
            <label>Name<input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label>Slug<input value={edit.slug} placeholder="from name" onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></label>
          </div>
          <label>Intro<textarea className="sf-text" value={edit.intro} onChange={(e) => setEdit({ ...edit, intro: e.target.value })} /></label>
          <label>Sort order<input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} />
            <span className="ad-hint">Order in the main navigation.</span>
          </label>
          {error && <p className="ad-error">{error}</p>}
          <div className="ad-savebar">
            <button className="ad-btn ad-btn--primary">Save</button>
            <button type="button" className="ad-btn" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </form>
      )}
      {!edit && error && <p className="ad-error">{error}</p>}
      {loadError && <p className="ad-error">{loadError}</p>}
      <table className="ad-table">
        <thead><tr><th>#</th><th>Name</th><th>URL</th><th>Guides</th><th></th></tr></thead>
        <tbody>
          {rows?.map((c) => (
            <tr key={c.id}>
              <td className="ad-cell-hide">{c.sortOrder}</td>
              <td className="ad-cell-main"><strong>{c.name}</strong><div className="ad-hint">{c.intro}</div></td>
              <td className="ad-cell-hide">/category/{c.slug}</td>
              <td>{c._count.guides}<span className="ad-sm-only"> guides</span></td>
              <td className="ad-cell-end" style={{ whiteSpace: "nowrap" }}>
                <button className="ad-btn ad-btn--sm" onClick={() => { setEdit({ id: c.id, name: c.name, slug: c.slug, intro: c.intro, sortOrder: c.sortOrder }); setError(""); }}>Edit</button>{" "}
                <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(c)}>Delete</button>
              </td>
            </tr>
          ))}
          {rows?.length === 0 && <tr><td colSpan={5}>No categories yet.</td></tr>}
        </tbody>
      </table>
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
