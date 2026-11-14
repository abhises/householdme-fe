"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText } from "@/lib/admin-api";
import type { Award, CleaningService } from "@/lib/types";

/** Award titles from the city award page design; any other title can be typed. */
const AWARD_TITLES = ["Best overall", "Best for move-out cleans", "Best eco-friendly", "Best for vacation rentals", "Best value", "Best deep cleaning", "Best for recurring cleaning"];
const THIS_YEAR = new Date().getFullYear();

type Svc = Pick<CleaningService, "id" | "name" | "city" | "state" | "email">;
type Edit = { id: string; service: Svc | null; year: string; city: string; state: string; title: string; rank: string; score: string; whyItWon: string; published: boolean };

const blank: Edit = { id: "", service: null, year: String(THIS_YEAR), city: "", state: "", title: "", rank: "1", score: "", whyItWon: "", published: true };
const forService = (s: Svc): Edit => ({ ...blank, service: s, city: s.city, state: s.state });
const toEdit = (a: Award): Edit => ({
  id: a.id, service: a.service, year: String(a.year), city: a.city, state: a.state, title: a.title, rank: String(a.rank),
  score: a.score === null ? "" : String(a.score), whyItWon: a.whyItWon, published: a.published,
});

/** Search-as-you-type picker for the business getting the award. */
function ServicePicker({ value, onPick }: { value: Svc | null; onPick: (s: Svc) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Svc[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      adminApi<{ items: Svc[] }>(`/cleaning-services?pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ""}`)
        .then((d) => setHits(d.items))
        .catch(() => setHits([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  if (value)
    return (
      <div className="ad-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
        <div style={{ flex: 1 }}><strong>{value.name}</strong><div className="ad-hint">{value.city}, {value.state} · {value.email || "no email yet"}</div></div>
      </div>
    );
  return (
    <div className="ad-form" style={{ gap: 6 }}>
      <input placeholder="Search cleaning services by name or city" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #ddd" }}>
        {hits.map((s) => (
          <button key={s.id} type="button" className="ad-btn ad-btn--sm" style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderBottom: "1px solid #eee" }} onClick={() => onPick(s)}>
            <strong>{s.name}</strong> <span className="ad-hint">{s.city}, {s.state}</span>
          </button>
        ))}
        {hits.length === 0 && (
          <p className="ad-hint" style={{ padding: 8, margin: 0 }}>
            No match. <Link href="/admin/cleaning-services">Add the business first →</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function AwardsPage() {
  const confirm = useConfirm();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [state, setState] = useState("");
  const query = [q && `q=${encodeURIComponent(q)}`, year && `year=${year}`, state.length === 2 && `state=${state}`].filter(Boolean).join("&");
  const { rows, meta, error: loadError, load, page, setPage, setPageSize } = usePagedList<Award>("awards", query);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState("");

  // "Give award" from the cleaning services list opens the form for that business
  const give = params.get("give");
  useEffect(() => {
    if (!give) return;
    adminApi<CleaningService>(`/cleaning-services/${give}`)
      .then((s) => { setEdit(forService(s)); setError(""); })
      .catch((e) => setError(errorText(e)))
      .finally(() => router.replace("/admin/awards"));
  }, [give, router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError("");
    if (!edit.service) return setError("Choose the cleaning service that wins this award");
    const body = {
      serviceId: edit.service.id, year: edit.year, city: edit.city, state: edit.state.trim().toUpperCase(), title: edit.title,
      rank: edit.rank, score: edit.score, whyItWon: edit.whyItWon, published: edit.published,
    };
    try {
      await adminApi(edit.id ? `/awards/${edit.id}` : "/awards", { method: edit.id ? "PUT" : "POST", json: body });
      setEdit(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (a: Award) => {
    if (!(await confirm({ title: `Take back "${a.title}" from ${a.service.name}?`, message: "The award is deleted. The business stays in your list.", confirmLabel: "Delete award" }))) return;
    try {
      await adminApi(`/awards/${a.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const togglePublished = async (a: Award) => {
    try {
      await adminApi(`/awards/${a.id}`, { method: "PATCH", json: { published: !a.published } });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const f = (k: "year" | "city" | "state" | "title" | "rank" | "score" | "whyItWon") => ({
    value: edit![k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEdit({ ...edit!, [k]: e.target.value }),
  });

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Awards {meta && <span className="ad-hint">({meta.total})</span>}</h1>
          <p className="ad-hint" style={{ margin: "4px 0 0" }}>HouseholdMe Local Awards given to cleaning services, by city and year.</p>
        </div>
        <button className="ad-btn ad-btn--primary" onClick={() => { setEdit(blank); setError(""); }}>🏆 Give award</button>
      </div>

      {edit && (
        <form className="ad-card ad-form" style={{ marginBottom: 16, maxWidth: 760 }} onSubmit={save}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{edit.id ? "Edit award" : "Give an award"}</h2>
          <div className="sf-field">
            <span className="sf-label">Cleaning service {edit.service && !edit.id && <button type="button" className="ad-btn ad-btn--sm" onClick={() => setEdit({ ...edit, service: null })}>Change</button>}</span>
            <ServicePicker value={edit.service} onPick={(s) => setEdit({ ...edit, service: s, city: edit.city || s.city, state: edit.state || s.state })} />
          </div>
          <label>Award<input required list="award-titles" placeholder="Best overall" {...f("title")} />
            <datalist id="award-titles">{AWARD_TITLES.map((t) => <option key={t} value={t} />)}</datalist>
            <span className="ad-hint">Pick one or type your own, e.g. “Best for pet owners”.</span>
          </label>
          <div className="ad-3">
            <label>City<input required {...f("city")} /></label>
            <label>State<input required maxLength={2} {...f("state")} style={{ textTransform: "uppercase" }} /></label>
            <label>Year<input required type="number" min="2000" max="2100" {...f("year")} /></label>
          </div>
          <div className="ad-2">
            <label>Rank on the city page<input required type="number" min="1" {...f("rank")} /><span className="ad-hint">1 = shown first.</span></label>
            <label>Our score (out of 10)<input type="number" step="0.1" min="0" max="10" placeholder="9.4" {...f("score")} /></label>
          </div>
          <label>Why it won<textarea className="sf-text" placeholder="2–3 sentences: what sets them apart, e.g. same-week availability, background-checked crews, flat-rate pricing." {...f("whyItWon")} /></label>
          <label className="ad-check"><input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} />Published (unchecked = draft, still being researched)</label>
          {error && <p className="ad-error">{error}</p>}
          <div className="ad-savebar"><button className="ad-btn ad-btn--primary">{edit.id ? "Save" : "Give award"}</button><button type="button" className="ad-btn" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}

      <div className="ad-filters">
        <input placeholder="Search award or city" value={q} onChange={(e) => { setQ(e.target.value); if (page > 1) setPage(1); }} />
        <select value={year} onChange={(e) => { setYear(e.target.value); if (page > 1) setPage(1); }}>
          <option value="">All years</option>
          {[THIS_YEAR + 1, THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <input placeholder="State (e.g. OR)" maxLength={2} value={state} style={{ width: 130, textTransform: "uppercase" }} onChange={(e) => { setState(e.target.value.toUpperCase()); if (page > 1) setPage(1); }} />
      </div>
      {!edit && error && <p className="ad-error">{error}</p>}
      {loadError && <p className="ad-error">{loadError}</p>}
      {!rows ? <p>Loading…</p> : (
        <table className="ad-table">
          <thead><tr><th>City</th><th>#</th><th>Award</th><th>Winner</th><th>Score</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="ad-cell-main"><strong>{a.city}, {a.state}</strong><div className="ad-hint">{a.year}</div></td>
                <td>{String(a.rank).padStart(2, "0")}</td>
                <td className="ad-cell-grow"><strong>{a.title}</strong></td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {a.service.logoUrl && <img src={a.service.logoUrl} alt="" className="ad-avatar" />}
                    <div>{a.service.name}<div className="ad-hint">{a.service.email || "no email yet"}</div></div>
                  </div>
                </td>
                <td>{a.score ?? "—"}</td>
                <td>
                  <span className={`ad-pill ad-pill--${a.published ? "published" : "draft"}`}>{a.published ? "published" : "draft"}</span>
                  <div className="ad-hint">{a.notifiedAt ? `emailed ${new Date(a.notifiedAt).toLocaleDateString()}` : "not emailed"}</div>
                </td>
                <td className="ad-cell-end" style={{ whiteSpace: "nowrap" }}>
                  <button className="ad-btn ad-btn--sm" onClick={() => togglePublished(a)}>{a.published ? "Unpublish" : "Publish"}</button>{" "}
                  <button className="ad-btn ad-btn--sm" onClick={() => { setEdit(toEdit(a)); setError(""); window.scrollTo({ top: 0 }); }}>Edit</button>{" "}
                  <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(a)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7}>No awards yet. Add businesses under <Link href="/admin/cleaning-services">Cleaning services</Link>, then give them an award.</td></tr>
            )}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
