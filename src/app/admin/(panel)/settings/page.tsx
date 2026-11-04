"use client";

import { useEffect, useState } from "react";
import { SaveStatus } from "@/components/admin/Editor";
import { FormFields, ImageInput, type FieldDef } from "@/components/admin/FormFields";
import { useSetting } from "@/components/admin/useSetting";
import { adminApi } from "@/lib/admin-api";
import type { Author, MethodSettings, SiteSettings } from "@/lib/types";

type Tab = "site" | "method";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("site");
  return (
    <>
      <div className="ad-head"><h1>Settings</h1></div>
      <div className="ad-tabs" role="tablist" style={{ marginBottom: 16 }}>
        <button role="tab" aria-selected={tab === "site"} onClick={() => setTab("site")}>Site</button>
        <button role="tab" aria-selected={tab === "method"} onClick={() => setTab("method")}>How we test</button>
      </div>
      {tab === "site" ? <SiteTab /> : <MethodTab />}
    </>
  );
}

function SiteTab() {
  const s = useSetting("site");
  const [authors, setAuthors] = useState<Author[]>([]);
  useEffect(() => {
    adminApi<{ items: Author[] }>("/authors").then((d) => setAuthors(d.items)).catch(() => {});
  }, []);
  if (!s.value) return <p>{s.msg?.text ?? "Loading…"}</p>;
  const v = s.value;
  const set = <K extends keyof SiteSettings>(k: K, x: SiteSettings[K]) => s.update({ [k]: x } as Partial<SiteSettings>);

  return (
    <div className="ad-form" style={{ maxWidth: 760 }}>
      <fieldset>
        <legend>Conversion</legend>
        <label className="ad-check"><input type="checkbox" checked={v.disclosureBar} onChange={(e) => set("disclosureBar", e.target.checked)} />Affiliate disclosure bar above the header</label>
        <label className="ad-check"><input type="checkbox" checked={v.stickyBuyBar} onChange={(e) => set("stickyBuyBar", e.target.checked)} />Sticky “our pick” bar on long-form guides</label>
        <label>Newsletter popup on long-form guides
          <select value={v.newsletterPopup} onChange={(e) => set("newsletterPopup", e.target.value as SiteSettings["newsletterPopup"])}>
            <option value="scroll">After scrolling 35% of the page</option>
            <option value="timer">After 15 seconds</option>
            <option value="direct">Right away</option>
            <option value="off">Off</option>
          </select>
        </label>
        <div className="sf-field"><span className="sf-label">Newsletter popup image</span><ImageInput value={v.newsletterImage ?? ""} onChange={(x) => set("newsletterImage", x || null)} /></div>
        <label>Prices checked on<input value={v.pricesCheckedLabel} onChange={(e) => set("pricesCheckedLabel", e.target.value)} placeholder="September 30, 2026" /><span className="ad-hint">Shown next to prices on guides, reviews and deals.</span></label>
      </fieldset>
      <fieldset>
        <legend>Editorial</legend>
        <label>Reviewer (editor-in-chief)
          <select value={v.reviewerSlug} onChange={(e) => set("reviewerSlug", e.target.value)}>
            {authors.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
          </select>
          <span className="ad-hint">Shown as “Reviewed by” on every guide and review.</span>
        </label>
        <label>Footer text<textarea className="sf-text" value={v.footerAbout} onChange={(e) => set("footerAbout", e.target.value)} /></label>
        <label>Copyright line<input value={v.copyright} onChange={(e) => set("copyright", e.target.value)} /></label>
      </fieldset>
      <div className="ad-savebar">
        <button className="ad-btn ad-btn--primary" disabled={s.busy} onClick={s.save}>Save</button>
        <SaveStatus msg={s.msg} dirty={s.dirty} />
      </div>
    </div>
  );
}

const METHOD: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "lead", label: "Lead", type: "textarea" },
  { key: "steps", label: "Test steps", type: "list", itemLabel: "{{n}} · {{title}}", help: "Also shown on the home page.", fields: [{ key: "n", label: "Number", type: "text", half: true }, { key: "title", label: "Title", type: "text", half: true }, { key: "text", label: "Text", type: "textarea" }] },
  { key: "weightsIntro", label: "Score weighting: intro", type: "textarea" },
  { key: "weights", label: "Score weighting", type: "list", itemLabel: "{{label}} · {{pct}}%", fields: [{ key: "label", label: "Criterion", type: "text", half: true }, { key: "pct", label: "Weight (%)", type: "number", half: true }] },
  { key: "principles", label: "Principles", type: "list", itemLabel: "{{title}}", fields: [{ key: "title", label: "Title", type: "text", half: true }, { key: "href", label: "Link", type: "text", half: true }, { key: "text", label: "Text", type: "textarea" }] },
];

function MethodTab() {
  const s = useSetting("method");
  if (!s.value) return <p>{s.msg?.text ?? "Loading…"}</p>;
  return (
    <div className="ad-form" style={{ maxWidth: 760, gap: 16 }}>
      <div className="sf-field"><span className="sf-label">Photo</span><ImageInput value={s.value.image ?? ""} onChange={(x) => s.update({ image: x || null })} /></div>
      <FormFields fields={METHOD} value={s.value} onChange={(v) => s.update(v as Partial<MethodSettings>)} />
      <div className="ad-savebar">
        <button className="ad-btn ad-btn--primary" disabled={s.busy} onClick={s.save}>Save</button>
        <a className="ad-btn" href="/how-we-test" target="_blank" rel="noreferrer">Open on site ↗</a>
        <SaveStatus msg={s.msg} dirty={s.dirty} />
      </div>
    </div>
  );
}
