"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { ImageInput } from "@/components/admin/FormFields";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText, slugify } from "@/lib/admin-api";
import type { CleaningService } from "@/lib/types";

/** Service tags from the award page design; any other line typed in the box is kept too. */
const SERVICE_TAGS = ["Recurring cleaning", "Deep cleaning", "Move-in / move-out", "Vacation rental turnover", "Eco / non-toxic products"];

type Edit = {
  id: string; name: string; slug: string; city: string; state: string; address: string; phone: string; email: string;
  website: string; logoUrl: string; googleRating: string; googleReviews: string; yelpRating: string; yelpReviews: string;
  services: string; licensed: boolean; insured: boolean; backgroundChecked: boolean; notes: string;
};

const blank: Edit = {
  id: "", name: "", slug: "", city: "", state: "", address: "", phone: "", email: "", website: "", logoUrl: "",
  googleRating: "", googleReviews: "", yelpRating: "", yelpReviews: "", services: "", licensed: false, insured: false,
  backgroundChecked: false, notes: "",
};
const num = (v: number | null) => (v === null ? "" : String(v));
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

const toEdit = (s: CleaningService): Edit => ({
  id: s.id, name: s.name, slug: s.slug, city: s.city, state: s.state, address: s.address, phone: s.phone, email: s.email,
  website: s.website ?? "", logoUrl: s.logoUrl ?? "", googleRating: num(s.googleRating), googleReviews: num(s.googleReviews),
  yelpRating: num(s.yelpRating), yelpReviews: num(s.yelpReviews), services: s.services.join("\n"), licensed: s.licensed,
  insured: s.insured, backgroundChecked: s.backgroundChecked, notes: s.notes,
});

export default function CleaningServicesPage() {
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const query = [q && `q=${encodeURIComponent(q)}`, state.length === 2 && `state=${state}`].filter(Boolean).join("&");
  const { rows, meta, error: loadError, load, page, setPage, setPageSize } = usePagedList<CleaningService>("cleaning-services", query);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError("");
    const { id, services, website, logoUrl, ...rest } = edit;
    const body = {
      ...rest,
      slug: rest.slug || slugify(`${rest.name} ${rest.city} ${rest.state}`),
      state: rest.state.trim().toUpperCase(),
      website: website.trim() || null,
      logoUrl: logoUrl || null,
      services: lines(services),
    };
    try {
      await adminApi(id ? `/cleaning-services/${id}` : "/cleaning-services", { method: id ? "PUT" : "POST", json: body });
      setEdit(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (s: CleaningService) => {
    const msg = s.awards.length ? `Its ${s.awards.length} award(s) will be deleted too.` : "This cannot be undone.";
    if (!(await confirm({ title: `Delete "${s.name}"?`, message: msg }))) return;
    try {
      await adminApi(`/cleaning-services/${s.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const f = (k: keyof Edit) => ({
    value: edit![k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEdit({ ...edit!, [k]: e.target.value }),
  });
  const check = (k: "licensed" | "insured" | "backgroundChecked", label: string) => (
    <label className="ad-check"><input type="checkbox" checked={edit![k]} onChange={(e) => setEdit({ ...edit!, [k]: e.target.checked })} />{label}</label>
  );
  const toggleTag = (tag: string) => {
    const cur = lines(edit!.services);
    setEdit({ ...edit!, services: (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]).join("\n") });
  };

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Cleaning services {meta && <span className="ad-hint">({meta.total})</span>}</h1>
          <p className="ad-hint" style={{ margin: "4px 0 0" }}>Local cleaning businesses you research. Give the best ones an award.</p>
        </div>
        <button className="ad-btn ad-btn--primary" onClick={() => { setEdit(blank); setError(""); }}>+ Add cleaning service</button>
      </div>

      {edit && (
        <form className="ad-card ad-form" style={{ marginBottom: 16, maxWidth: 820 }} onSubmit={save}>
          <div className="ad-2"><label>Business name<input required {...f("name")} /></label><label>Slug<input placeholder="from name + city" {...f("slug")} /></label></div>
          <div className="ad-3">
            <label>City<input required placeholder="Bend" {...f("city")} /></label>
            <label>State<input required maxLength={2} placeholder="OR" {...f("state")} style={{ textTransform: "uppercase" }} /></label>
            <label>Phone<input placeholder="(541) 000-0000" {...f("phone")} /></label>
          </div>
          <label>Street address<input {...f("address")} /></label>
          <div className="ad-2">
            <label>Email<input type="email" placeholder="owner@business.com" {...f("email")} /><span className="ad-hint">Where the award email will go.</span></label>
            <label>Website<input type="url" placeholder="https://…" {...f("website")} /></label>
          </div>
          <div className="sf-field"><span className="sf-label">Logo</span><ImageInput value={edit.logoUrl} onChange={(v) => setEdit({ ...edit, logoUrl: v })} /></div>
          <div className="ad-2">
            <div className="ad-2">
              <label>Google rating<input type="number" step="0.1" min="0" max="5" {...f("googleRating")} /></label>
              <label>Google reviews<input type="number" min="0" {...f("googleReviews")} /></label>
            </div>
            <div className="ad-2">
              <label>Yelp rating<input type="number" step="0.1" min="0" max="5" {...f("yelpRating")} /></label>
              <label>Yelp reviews<input type="number" min="0" {...f("yelpReviews")} /></label>
            </div>
          </div>
          <label>Services<textarea {...f("services")} /><span className="ad-hint">One per line, or click to add/remove:{" "}
            {SERVICE_TAGS.map((t) => (
              <button key={t} type="button" className="ad-btn ad-btn--sm" style={{ margin: "4px 4px 0 0" }} aria-pressed={lines(edit.services).includes(t)} onClick={() => toggleTag(t)}>
                {lines(edit.services).includes(t) ? "✓ " : "+ "}{t}
              </button>
            ))}
          </span></label>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {check("licensed", "Licensed")}
            {check("insured", "Bonded & insured")}
            {check("backgroundChecked", "Background-checked staff")}
          </div>
          <label>Research notes<textarea {...f("notes")} /><span className="ad-hint">Internal only, never shown on the site.</span></label>
          {error && <p className="ad-error">{error}</p>}
          <div className="ad-savebar"><button className="ad-btn ad-btn--primary">Save</button><button type="button" className="ad-btn" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}

      <div className="ad-filters">
        <input placeholder="Search name, city or email" value={q} onChange={(e) => { setQ(e.target.value); if (page > 1) setPage(1); }} />
        <input placeholder="State (e.g. OR)" maxLength={2} value={state} style={{ width: 130, textTransform: "uppercase" }}
          onChange={(e) => { setState(e.target.value.toUpperCase()); if (page > 1) setPage(1); }} />
      </div>
      {!edit && error && <p className="ad-error">{error}</p>}
      {loadError && <p className="ad-error">{loadError}</p>}
      {!rows ? <p>Loading…</p> : (
        <table className="ad-table">
          <thead><tr><th></th><th>Business</th><th>Location</th><th>Reviews</th><th>Awards</th><th></th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td style={{ width: 52 }}>{s.logoUrl ? <img src={s.logoUrl} alt="" className="ad-avatar" /> : <span className="ad-avatar" />}</td>
                <td className="ad-cell-grow"><strong>{s.name}</strong><div className="ad-hint">{s.email || "no email yet"}</div></td>
                <td className="ad-cell-main">{s.city}, {s.state}</td>
                <td className="ad-cell-hide">
                  {s.googleRating !== null && <div>Google {s.googleRating}★ ({s.googleReviews ?? 0})</div>}
                  {s.yelpRating !== null && <div>Yelp {s.yelpRating}★ ({s.yelpReviews ?? 0})</div>}
                  {s.googleRating === null && s.yelpRating === null && "—"}
                </td>
                <td>
                  {s.awards.length ? s.awards.map((a) => <div key={a.id}><span className="ad-pill ad-pill--published">{a.year}</span> {a.title}</div>) : "—"}
                </td>
                <td className="ad-cell-end" style={{ whiteSpace: "nowrap" }}>
                  <Link className="ad-btn ad-btn--sm ad-btn--primary" href={`/admin/awards?give=${s.id}`}>🏆 Give award</Link>{" "}
                  <button className="ad-btn ad-btn--sm" onClick={() => { setEdit(toEdit(s)); setError(""); window.scrollTo({ top: 0 }); }}>Edit</button>{" "}
                  <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(s)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}>No cleaning services yet. Add the businesses you&apos;ve researched.</td></tr>}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
