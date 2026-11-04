"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EditorPreview, EditorTabs, Fieldset, SaveStatus, useDocEditor } from "@/components/admin/Editor";
import { FormFields, GalleryInput, type FieldDef } from "@/components/admin/FormFields";
import { adminApi, slugify } from "@/lib/admin-api";
import type { Guide, Product } from "@/lib/types";

const LABELS = ["Our pick", "Budget pick", "Upgrade"];

const blank = (guideId: string) =>
  ({
    slug: "", name: "", guideId, rank: 0, label: "Our pick", score: 0, price: 0, verdict: "", pros: [], cons: [], images: [],
    subtitle: null, verdictLong: null, inUseSince: null, purchase: null, readTime: null, designText: null, videoUrl: null,
    goodFor: [], notFor: [], sources: [], subScores: [], shops: [{ shop: "Amazon", price: 0, url: "", note: "" }], priceHistory: [],
    results: [], longTerm: [], specs: [], compareRows: [], questions: [], faq: [], changes: [],
  }) as unknown as Product;

type Tab = "review" | "scores" | "shops" | "specs" | "qa";
const TABS: [Tab, string][] = [["review", "Review"], ["scores", "Scores & results"], ["shops", "Shops & prices"], ["specs", "Specs & comparison"], ["qa", "Q&A & FAQ"]];

const REVIEW: FieldDef[] = [
  { key: "verdictLong", label: "Our verdict", type: "textarea", rows: 4, help: "Large text at the top of the review. Defaults to the short verdict." },
  { key: "pros", label: "Pros", type: "lines", half: true },
  { key: "cons", label: "Cons", type: "lines", half: true },
  { key: "goodFor", label: "Good for", type: "lines", half: true },
  { key: "notFor", label: "Less suited for", type: "lines", half: true },
  { key: "designText", label: "Design and use", type: "textarea", rows: 5 },
  { key: "videoUrl", label: "Video URL", type: "link", help: "Optional MP4/WebM link (upload it under Media)." },
  { key: "longTerm", label: "Long-term test", type: "list", itemLabel: "{{date}}", fields: [{ key: "date", label: "Date", type: "text" }, { key: "text", label: "Update", type: "textarea" }] },
];
const SCORES: FieldDef[] = [
  { key: "subScores", label: "Score breakdown", type: "list", itemLabel: "{{label}}: {{value}}", fields: [{ key: "label", label: "Criterion", type: "text", half: true }, { key: "value", label: "Score (0–10)", type: "number", step: 0.1, half: true }] },
  {
    key: "results", label: "Test results vs. average", type: "list", itemLabel: "{{label}}: {{value}}",
    fields: [
      { key: "label", label: "Test", type: "text" },
      { key: "value", label: "Result", type: "text", half: true },
      { key: "average", label: "Average", type: "text", half: true },
      { key: "pct", label: "Bar (%)", type: "number", half: true },
      { key: "averagePct", label: "Average bar (%)", type: "number", half: true },
    ],
  },
];
const SHOPS: FieldDef[] = [
  {
    key: "shops", label: "Shops", type: "list", itemLabel: "{{shop}} · ${{price}}",
    help: "Affiliate links for the red “Check price” buttons. The first shop is the main one.",
    fields: [
      { key: "shop", label: "Shop", type: "text", placeholder: "Amazon", half: true },
      { key: "price", label: "Price (USD)", type: "number", half: true },
      { key: "url", label: "Affiliate link", type: "link" },
      { key: "note", label: "Note", type: "text", placeholder: "Free 2-day shipping with Prime" },
    ],
  },
  { key: "priceHistory", label: "Price history", type: "list", itemLabel: "{{month}} · ${{price}}", fields: [{ key: "month", label: "Month", type: "text", half: true }, { key: "price", label: "Price (USD)", type: "number", half: true }] },
];
const SPECS: FieldDef[] = [
  { key: "specs", label: "Specifications", type: "list", itemLabel: "{{k}}: {{v}}", help: "Leave empty to show price, score, rank and test facts.", fields: [{ key: "k", label: "Label", type: "text", half: true }, { key: "v", label: "Value", type: "text", half: true }] },
  { key: "compareRows", label: "Extra comparison rows", type: "list", itemLabel: "{{name}}", help: "Added below score, price and rank in “How it compares”. One value per pick, in rank order.", fields: [{ key: "name", label: "Row", type: "text" }, { key: "cells", label: "Values", type: "cells" }] },
];
const QA: FieldDef[] = [
  { key: "questions", label: "Reader questions", type: "list", itemLabel: "{{q}}", fields: [{ key: "who", label: "From", type: "text", placeholder: "Question from Megan in Denver" }, { key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
  { key: "faq", label: "FAQ", type: "list", itemLabel: "{{q}}", help: "Leave empty to reuse the guide's FAQ.", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
  { key: "sources", label: "Sources", type: "lines" },
  { key: "changes", label: "Changelog", type: "list", itemLabel: "{{date}} · {{text}}", fields: [{ key: "date", label: "Date", type: "text" }, { key: "text", label: "What changed", type: "text" }] },
];
const FIELDS: Record<Tab, FieldDef[]> = { review: REVIEW, scores: SCORES, shops: SHOPS, specs: SPECS, qa: QA };

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const ed = useDocEditor<Product>({
    resource: "products",
    id,
    blank: blank(sp.get("guideId") ?? ""),
    editHref: (x) => `/admin/products/${x}`,
    listHref: "/admin/products",
    prepare: (f) => ({ slug: f.slug || slugify(f.name) }),
    validate: (f) => (!f.name.trim() ? "Name is required" : !f.guideId ? "Choose a buying guide" : null),
  });
  const { form: f, set, patch } = ed;
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tab, setTab] = useState<Tab | "preview">("review");
  const [split, setSplit] = useState(true);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    adminApi<{ items: Guide[] }>("/guides?pageSize=500").then((d) => setGuides(d.items)).catch(() => {});
  }, []);

  if (!ed.loaded) return <p>{ed.msg?.text ?? "Loading…"}</p>;

  const slug = f.slug || slugify(f.name);
  const guide = guides.find((g) => g.id === f.guideId);
  const preview = <EditorPreview url={ed.isNew ? null : `/review/${f.slug}`} reloadKey={ed.savedAt} mobile={mobile} />;
  const subScoreHint = guide?.criteria?.length ? `This guide's criteria: ${guide.criteria.join(", ")}.` : null;

  return (
    <>
      <div className="ad-head">
        <h1>{ed.isNew ? "New product" : f.name || "Untitled"}</h1>
        <div className="ad-savebar">
          <SaveStatus msg={ed.msg} dirty={ed.dirty} />
          {!ed.isNew && <a className="ad-btn" href={`/review/${f.slug}?preview=1`} target="_blank" rel="noreferrer">Open on site ↗</a>}
          {!ed.isNew && <button className="ad-btn ad-btn--danger" onClick={() => ed.remove(`Delete "${f.name}"?`, "Its review page and any deal for it are deleted. This cannot be undone.")}>Delete</button>}
          <button className="ad-btn ad-btn--primary" disabled={ed.saving} onClick={() => ed.save()}>{ed.isNew ? "Create" : "Update"}</button>
        </div>
      </div>

      <div className="ad-editor">
        <div className="ad-editor__meta ad-form" key={ed.version}>
          <label>Name<input value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label>Slug<input value={f.slug} placeholder="from name" onChange={(e) => set("slug", e.target.value)} />
            <span className="ad-hint">/review/{slug || "…"}</span>
          </label>
          <label>Buying guide
            <select value={f.guideId} onChange={(e) => set("guideId", e.target.value)}>
              <option value="">—</option>
              {guides.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
            {guide && !guide.published && <span className="ad-hint">This guide is a draft, so the review isn&apos;t public yet.</span>}
          </label>
          <div className="ad-2">
            <label>Rank
              <select value={f.rank} onChange={(e) => { const n = Number(e.target.value); patch({ rank: n, label: LABELS[n] ?? f.label }); }}>
                {LABELS.map((l, i) => <option key={i} value={i}>{i} · {l}</option>)}
              </select>
            </label>
            <label>Label<input value={f.label} onChange={(e) => set("label", e.target.value)} /></label>
          </div>
          <div className="ad-2">
            <label>Test score (0–10)<input type="number" step="0.1" min={0} max={10} value={f.score} onChange={(e) => set("score", Number(e.target.value))} /></label>
            <label>Price from (USD)<input type="number" value={f.price} onChange={(e) => set("price", Number(e.target.value))} /></label>
          </div>
          <label>Short verdict<textarea className="sf-text" value={f.verdict} onChange={(e) => set("verdict", e.target.value)} />
            <span className="ad-hint">Shown on pick cards and as the review subtitle fallback.</span>
          </label>

          <Fieldset legend="Photos">
            <GalleryInput value={f.images} onChange={(v) => set("images", v)} />
            <span className="ad-hint">The first photo is the main product photo; the next ones fill the review gallery.</span>
          </Fieldset>

          <Fieldset legend="Review header">
            <label>Subtitle<textarea className="sf-text" value={f.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value || null)} /></label>
            <label>In use since<input value={f.inUseSince ?? ""} placeholder="February 2026 (7 months)" onChange={(e) => set("inUseSince", e.target.value || null)} /></label>
            <label>Purchase<input value={f.purchase ?? ""} placeholder="Bought ourselves at Best Buy" onChange={(e) => set("purchase", e.target.value || null)} /></label>
            <label>Reading time<input value={f.readTime ?? ""} placeholder="9 minutes" onChange={(e) => set("readTime", e.target.value || null)} /></label>
          </Fieldset>
        </div>

        <div className="ad-editor__work">
          <EditorTabs tabs={TABS} tab={tab} onTab={setTab} split={split} onSplit={setSplit} mobile={mobile} onMobile={setMobile} />
          <div className={`ad-split${split ? " ad-split--side" : ""}`}>
            <div className="ad-tabpanel" key={`${ed.version}-${tab}`}>
              {tab === "preview" ? (
                preview
              ) : (
                <>
                  {tab === "scores" && subScoreHint && <p className="ad-hint">{subScoreHint}</p>}
                  <FormFields fields={FIELDS[tab]} value={f} onChange={(v) => patch(v as Partial<Product>)} />
                </>
              )}
            </div>
            {split && tab !== "preview" && preview}
          </div>
          <p className="ad-hint">The preview shows the review as last saved. Ctrl/⌘+S saves.</p>
        </div>
      </div>
    </>
  );
}
