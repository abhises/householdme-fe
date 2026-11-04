"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { FormFields, type FieldDef } from "@/components/admin/FormFields";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText, slugify } from "@/lib/admin-api";
import type { InfoPage } from "@/lib/types";

type Edit = { id: string; title: string; slug: string; lead: string; sections: { heading: string; body: string }[]; sortOrder: number };
const blank: Edit = { id: "", title: "", slug: "", lead: "", sections: [], sortOrder: 0 };
const SECTIONS: FieldDef[] = [
  { key: "sections", label: "Sections", type: "list", itemLabel: "{{heading}}", fields: [{ key: "heading", label: "Heading", type: "text" }, { key: "body", label: "Text", type: "textarea", rows: 5 }] },
];

export default function InfoPagesPage() {
  const confirm = useConfirm();
  const { rows, meta, error: loadError, load, setPage, setPageSize } = usePagedList<InfoPage>("info-pages");
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError("");
    const { id, ...body } = edit;
    try {
      await adminApi(id ? `/info-pages/${id}` : "/info-pages", { method: id ? "PUT" : "POST", json: { ...body, slug: body.slug || slugify(body.title) } });
      setEdit(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
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
          <h1>Info pages</h1>
          <p className="ad-hint" style={{ margin: "4px 0 0" }}>Transparency pages such as editorial guidelines, privacy and contact.</p>
        </div>
        <button className="ad-btn ad-btn--primary" onClick={() => { setEdit({ ...blank, sortOrder: meta?.total ?? 0 }); setError(""); }}>+ New page</button>
      </div>
      {edit && (
        <form className="ad-card ad-form" style={{ marginBottom: 16, maxWidth: 760 }} onSubmit={save} key={edit.id || "new"}>
          <div className="ad-2">
            <label>Title<input required value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
            <label>Slug<input value={edit.slug} placeholder="from title" onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /><span className="ad-hint">/info/{edit.slug || slugify(edit.title) || "…"}</span></label>
          </div>
          <label>Lead<textarea className="sf-text" value={edit.lead} onChange={(e) => setEdit({ ...edit, lead: e.target.value })} /></label>
          <FormFields fields={SECTIONS} value={edit} onChange={(v) => setEdit({ ...edit, sections: v.sections })} />
          <label>Sort order<input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></label>
          {error && <p className="ad-error">{error}</p>}
          <div className="ad-savebar">
            <button className="ad-btn ad-btn--primary">Save</button>
            <button type="button" className="ad-btn" onClick={() => setEdit(null)}>Cancel</button>
            {edit.slug && <a className="ad-btn" href={`/info/${edit.slug}`} target="_blank" rel="noreferrer">View ↗</a>}
          </div>
        </form>
      )}
      {!edit && error && <p className="ad-error">{error}</p>}
      {loadError && <p className="ad-error">{loadError}</p>}
      <table className="ad-table">
        <thead><tr><th>#</th><th>Title</th><th>URL</th><th>Sections</th><th></th></tr></thead>
        <tbody>
          {rows?.map((p) => (
            <tr key={p.id}>
              <td className="ad-cell-hide">{p.sortOrder}</td>
              <td className="ad-cell-main"><strong>{p.title}</strong><div className="ad-hint">{p.lead}</div></td>
              <td className="ad-cell-hide">/info/{p.slug}</td>
              <td>{p.sections.length}<span className="ad-sm-only"> sections</span></td>
              <td className="ad-cell-end" style={{ whiteSpace: "nowrap" }}>
                <button className="ad-btn ad-btn--sm" onClick={() => { setEdit({ id: p.id, title: p.title, slug: p.slug, lead: p.lead, sections: p.sections, sortOrder: p.sortOrder }); setError(""); window.scrollTo({ top: 0 }); }}>Edit</button>{" "}
                <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(p)}>Delete</button>
              </td>
            </tr>
          ))}
          {rows?.length === 0 && <tr><td colSpan={5}>No pages yet.</td></tr>}
        </tbody>
      </table>
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
