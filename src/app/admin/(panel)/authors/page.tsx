"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { ImageInput } from "@/components/admin/FormFields";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText, slugify } from "@/lib/admin-api";
import type { Author } from "@/lib/types";

type Row = Author & { _count: { guides: number } };
type Edit = {
  id: string; name: string; slug: string; role: string; short: string; bio: string; trust: string; imageUrl: string;
  linkedinUrl: string; youtubeUrl: string;
  facts: string; expertise: string; career: string; sortOrder: number; onTeam: boolean; isTester: boolean;
};

const blank: Edit = { id: "", name: "", slug: "", role: "", short: "", bio: "", trust: "", imageUrl: "", linkedinUrl: "", youtubeUrl: "", facts: "", expertise: "", career: "", sortOrder: 0, onTeam: true, isTester: true };
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const pairs = (s: string) =>
  lines(s).map((l) => {
    const i = l.indexOf("|");
    return i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  });

const toEdit = (a: Author): Edit => ({
  id: a.id, name: a.name, slug: a.slug, role: a.role, short: a.short, bio: a.bio, trust: a.trust, imageUrl: a.imageUrl ?? "",
  linkedinUrl: a.linkedinUrl ?? "", youtubeUrl: a.youtubeUrl ?? "",
  facts: a.facts.map((f) => `${f.value} | ${f.label}`).join("\n"), expertise: a.expertise.join("\n"),
  career: a.career.map((c) => `${c.year} | ${c.text}`).join("\n"), sortOrder: a.sortOrder, onTeam: a.onTeam, isTester: a.isTester,
});

export default function AuthorsPage() {
  const confirm = useConfirm();
  const { rows, meta, error: loadError, load, setPage, setPageSize } = usePagedList<Row>("authors");
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError("");
    const { id, facts, expertise, career, imageUrl, linkedinUrl, youtubeUrl, ...rest } = edit;
    const body = {
      ...rest, slug: rest.slug || slugify(rest.name), imageUrl: imageUrl || null,
      linkedinUrl: linkedinUrl.trim() || null, youtubeUrl: youtubeUrl.trim() || null, sortOrder: Number(rest.sortOrder),
      facts: pairs(facts).map(([value, label]) => ({ value, label })), expertise: lines(expertise),
      career: pairs(career).map(([year, text]) => ({ year, text })),
    };
    try {
      await adminApi(id ? `/authors/${id}` : "/authors", { method: id ? "PUT" : "POST", json: body });
      setEdit(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (a: Row) => {
    if (!(await confirm({ title: `Delete author "${a.name}"?`, message: a._count.guides ? `They still author ${a._count.guides} guides. Assign those to someone else first.` : "This cannot be undone." }))) return;
    try {
      await adminApi(`/authors/${a.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const f = (k: keyof Edit) => ({ value: edit![k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEdit({ ...edit!, [k]: e.target.value }) });

  return (
    <>
      <div className="ad-head">
        <h1>Authors</h1>
        <button className="ad-btn ad-btn--primary" onClick={() => { setEdit({ ...blank, sortOrder: meta?.total ?? 0 }); setError(""); }}>+ New author</button>
      </div>
      {edit && (
        <form className="ad-card ad-form" style={{ marginBottom: 16, maxWidth: 760 }} onSubmit={save}>
          <div className="ad-2"><label>Name<input required {...f("name")} /></label><label>Slug<input placeholder="from name" {...f("slug")} /></label></div>
          <label>Role<input placeholder="Senior home appliance tester" {...f("role")} /></label>
          <div className="sf-field"><span className="sf-label">Portrait</span><ImageInput value={edit.imageUrl} onChange={(v) => setEdit({ ...edit, imageUrl: v })} /></div>
          <div className="ad-2">
            <label>LinkedIn URL<input type="url" placeholder="https://www.linkedin.com/in/…" {...f("linkedinUrl")} /></label>
            <label>YouTube channel<input type="url" placeholder="https://www.youtube.com/@…" {...f("youtubeUrl")} /></label>
          </div>
          <label>Short bio (cards)<input {...f("short")} /></label>
          <label>Bio<textarea className="sf-text" {...f("bio")} /></label>
          <label>Trust statement<textarea className="sf-text" {...f("trust")} /><span className="ad-hint">Opens the “Why you can trust us” box on their guides.</span></label>
          <label>Facts<textarea placeholder={"9 years | experience as a product tester"} {...f("facts")} /><span className="ad-hint">One per line: value | label</span></label>
          <label>Expertise<textarea placeholder={"Vacuums\nRobot vacuums"} {...f("expertise")} /><span className="ad-hint">One per line</span></label>
          <label>Background<textarea placeholder={"2021 – now | Senior tester, HouseholdMe"} {...f("career")} /><span className="ad-hint">One per line: years | text</span></label>
          <div className="ad-2">
            <label>Sort order<input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></label>
            <div className="ad-form" style={{ alignSelf: "end", gap: 6 }}>
              <label className="ad-check"><input type="checkbox" checked={edit.isTester} onChange={(e) => setEdit({ ...edit, isTester: e.target.checked })} />Show under “Our testers” on the home page</label>
              <label className="ad-check"><input type="checkbox" checked={edit.onTeam} onChange={(e) => setEdit({ ...edit, onTeam: e.target.checked })} />Show on the editorial team pages</label>
            </div>
          </div>
          {error && <p className="ad-error">{error}</p>}
          <div className="ad-savebar"><button className="ad-btn ad-btn--primary">Save</button><button type="button" className="ad-btn" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      {!edit && error && <p className="ad-error">{error}</p>}
      {loadError && <p className="ad-error">{loadError}</p>}
      <table className="ad-table">
        <thead><tr><th></th><th>Name</th><th>Role</th><th>Guides</th><th></th></tr></thead>
        <tbody>
          {rows?.map((a) => (
            <tr key={a.id}>
              <td style={{ width: 52 }}>{a.imageUrl ? <img src={a.imageUrl} alt="" className="ad-avatar" /> : <span className="ad-avatar" />}</td>
              <td className="ad-cell-grow"><strong>{a.name}</strong><div className="ad-hint">/author/{a.slug}</div></td>
              <td className="ad-cell-main">{a.role}</td>
              <td>{a._count.guides}<span className="ad-sm-only"> guides</span></td>
              <td className="ad-cell-end" style={{ whiteSpace: "nowrap" }}>
                <button className="ad-btn ad-btn--sm" onClick={() => { setEdit(toEdit(a)); setError(""); window.scrollTo({ top: 0 }); }}>Edit</button>{" "}
                <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(a)}>Delete</button>
              </td>
            </tr>
          ))}
          {rows?.length === 0 && <tr><td colSpan={5}>No authors yet.</td></tr>}
        </tbody>
      </table>
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
