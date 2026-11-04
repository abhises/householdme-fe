"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EditorPreview, EditorTabs, Fieldset, SaveStatus, useDocEditor } from "@/components/admin/Editor";
import { FormFields, ImageInput, type FieldDef } from "@/components/admin/FormFields";
import { adminApi, slugify } from "@/lib/admin-api";
import { score } from "@/lib/format";
import type { Author, Category, Guide, GuideFull } from "@/lib/types";

const blank = {
  slug: "", title: "", seoTitle: null, short: "", intro: "", published: false, categoryId: "", authorId: "",
  modelsTested: 0, testWeeks: 0, updatedLabel: "", publishedLabel: "", photoNote: "", coverImage: null, heroImage: null,
  testImage: null, forWho: "", howTested: "", howCaption: null, bought: null, criteria: [], tableHead: null, tableRows: null,
  tableNote: null, faq: [], sources: [], changes: [], full: null, sortOrder: 0,
} as unknown as Guide;

const emptyFull: GuideFull = {
  titles: {}, summary: [], compare: null, deep: [], bars: [], buyIntro: "", buying: [], tiers: [], vsHead: [], vsRows: [],
  vsNote: "", care: [], skip: [], skipNote: "", next: [], durable: [], situations: [], specsIntro: "", specsExplained: [],
  mistakes: [], verdict: [], glossary: [],
};

type Tab = "content" | "table" | "faq" | "picks" | "longform";
const TABS: [Tab, string][] = [["content", "Content"], ["table", "Results table"], ["faq", "FAQ & sources"], ["picks", "Picks"], ["longform", "Long-form sections"]];

const CONTENT: FieldDef[] = [
  { key: "forWho", label: "Who is this for?", type: "textarea", rows: 5 },
  { key: "howTested", label: "How we tested", type: "textarea", rows: 5 },
  { key: "howCaption", label: "Test photo caption", type: "text" },
  { key: "bought", label: "How the products were obtained", type: "textarea", help: "Added to “Why you can trust us”, e.g. “We bought 18 of the 22 machines ourselves…”" },
  { key: "criteria", label: "Score criteria", type: "lines", help: "One per line, e.g. Suction, Battery, Ease of use, Noise. Used for the review score breakdown." },
];
const TABLE: FieldDef[] = [
  { key: "tableHead", label: "Header row", type: "cells", help: "Leave the table empty to show the picks with rank, score and price." },
  { key: "tableRows", label: "Rows", type: "table", rows: 8 },
  { key: "tableNote", label: "Note below the table", type: "text" },
];
const FAQ: FieldDef[] = [
  { key: "faq", label: "Questions", type: "list", itemLabel: "{{q}}", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
  { key: "sources", label: "Sources", type: "lines" },
  { key: "changes", label: "Changelog", type: "list", itemLabel: "{{date}} · {{text}}", fields: [{ key: "date", label: "Date", type: "text" }, { key: "text", label: "What changed", type: "text" }] },
];
const TITLES: FieldDef[] = [
  { key: "buying", label: "What to look for (heading)", type: "text", half: true },
  { key: "vs", label: "Product types table (heading)", type: "text", half: true },
  { key: "vsToc", label: "Product types (in the table of contents)", type: "text", half: true },
  { key: "care", label: "Maintenance (heading)", type: "text", half: true },
  { key: "situations", label: "Situations (heading)", type: "text", half: true },
  { key: "mistakes", label: "Mistakes (heading)", type: "text", half: true },
];
const pair = (a: string, al: string, b: string, bl: string, area = false): FieldDef[] => [
  { key: a, label: al, type: "text" },
  { key: b, label: bl, type: area ? "textarea" : "text" },
];
const longform = (products: { value: string; label: string }[]): FieldDef[] => [
  { key: "summary", label: "The short answer", type: "lines", rows: 6, help: "One point per line." },
  {
    key: "compare", label: "Compare side by side (JSON)", type: "json", rows: 18,
    help: "cols: products by slug with stars, reviews, was (old price) and highlight. In groups[].rows[].cells use \"y\"/\"n\" for yes/no and \"b9.1:91\" for a bar (label:percent). better: \"high\", \"low\" or null.",
  },
  {
    key: "deep", label: "Picks in depth", type: "list", itemLabel: "{{product}}",
    fields: [
      { key: "product", label: "Product", type: "select", options: products },
      { key: "bestFor", label: "Choose this if…", type: "text" },
      { key: "body", label: "Text", type: "paragraphs", rows: 8 },
      { key: "specs", label: "Measured", type: "list", itemLabel: "{{k}}: {{v}}", fields: pair("k", "Label", "v", "Value") },
      { key: "scores", label: "Score breakdown", type: "list", itemLabel: "{{k}}: {{v}}", fields: [{ key: "k", label: "Criterion", type: "text" }, { key: "v", label: "Score (0–10)", type: "number", step: 0.1 }] },
    ],
  },
  {
    key: "bars", label: "Results by test", type: "list", itemLabel: "{{heading}}",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "note", label: "Note", type: "textarea" },
      { key: "rows", label: "Results", type: "list", itemLabel: "{{name}} · {{value}}", fields: [{ key: "name", label: "Model", type: "text", half: true }, { key: "value", label: "Value shown", type: "text", half: true }, { key: "pct", label: "Bar length (%)", type: "number" }] },
    ],
  },
  { key: "buyIntro", label: "What to look for: intro", type: "textarea" },
  { key: "buying", label: "What to look for: topics", type: "list", itemLabel: "{{heading}}", fields: [{ key: "heading", label: "Heading", type: "text" }, { key: "paragraphs", label: "Text", type: "paragraphs", rows: 6 }, { key: "tip", label: "Our tip", type: "textarea" }] },
  { key: "tiers", label: "How much to spend", type: "list", itemLabel: "{{heading}}", fields: [{ key: "heading", label: "Tier", type: "text", half: true }, { key: "pick", label: "Pick line", type: "text", half: true }, { key: "text", label: "Text", type: "textarea" }] },
  { key: "vsHead", label: "Product types table: header", type: "cells", help: 'Start with " | " to leave the first column empty.' },
  { key: "vsRows", label: "Product types table: rows", type: "table" },
  { key: "vsNote", label: "Product types table: note", type: "textarea" },
  { key: "care", label: "Maintenance", type: "list", itemLabel: "{{heading}}", fields: pair("heading", "Heading", "text", "Text", true) },
  { key: "skip", label: "Tested but not recommended", type: "list", itemLabel: "{{name}} ({{score}})", fields: [{ key: "name", label: "Model", type: "text", half: true }, { key: "score", label: "Score", type: "text", half: true }, { key: "why", label: "Why not", type: "textarea" }] },
  { key: "skipNote", label: "Not recommended: note", type: "textarea" },
  { key: "next", label: "What we're testing now", type: "list", itemLabel: "{{name}}", fields: [{ key: "name", label: "Model", type: "text", half: true }, { key: "status", label: "Status", type: "text", half: true }, { key: "text", label: "Text", type: "textarea" }] },
  { key: "durable", label: "Durability, warranty and repair", type: "paragraphs", rows: 6 },
  { key: "situations", label: "Situations", type: "list", itemLabel: "{{heading}}", fields: pair("heading", "Heading", "text", "Text", true) },
  { key: "specsIntro", label: "Numbers on the box: intro", type: "textarea" },
  { key: "specsExplained", label: "Numbers on the box", type: "list", itemLabel: "{{term}}", fields: pair("term", "Term", "text", "Explanation", true) },
  { key: "mistakes", label: "Mistakes", type: "list", itemLabel: "{{heading}}", fields: pair("heading", "Heading", "text", "Text", true) },
  { key: "verdict", label: "Our final verdict", type: "paragraphs", rows: 6 },
  { key: "glossary", label: "Glossary", type: "list", itemLabel: "{{term}}", fields: pair("term", "Term", "definition", "Definition", true) },
];

export default function GuideEditor() {
  const { id } = useParams<{ id: string }>();
  const ed = useDocEditor<Guide>({
    resource: "guides",
    id,
    blank,
    editHref: (x) => `/admin/guides/${x}`,
    listHref: "/admin",
    prepare: (f) => ({ slug: f.slug || slugify(f.short || f.title) }),
    validate: (f) => (!f.title.trim() ? "Title is required" : !f.categoryId ? "Choose a category" : !f.authorId ? "Choose an author" : null),
  });
  const { form: f, set, patch } = ed;
  const [cats, setCats] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [tab, setTab] = useState<Tab | "preview">("content");
  const [split, setSplit] = useState(true);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    adminApi<{ items: Category[] }>("/categories").then((d) => setCats(d.items)).catch(() => {});
    adminApi<{ items: Author[] }>("/authors").then((d) => setAuthors(d.items)).catch(() => {});
  }, []);

  if (!ed.loaded) return <p>{ed.msg?.text ?? "Loading…"}</p>;

  const slug = f.slug || slugify(f.short || f.title);
  const saveWith = (o: Partial<Guide> = {}) => ed.save(o);
  const products = (f.products ?? []).map((p) => ({ value: p.slug, label: p.name }));
  const nullIfEmpty = <T,>(v: T[] | null) => (v && v.length ? v : null);
  const preview = <EditorPreview url={ed.isNew ? null : `/guide/${f.slug}`} reloadKey={ed.savedAt} mobile={mobile} />;

  const work = (
    <div className="ad-tabpanel" key={`${ed.version}-${tab}`}>
      {tab === "content" && <FormFields fields={CONTENT} value={f} onChange={(v) => patch(v as Partial<Guide>)} />}
      {tab === "table" && (
        <FormFields
          fields={TABLE}
          value={f}
          onChange={(v) => patch({ ...v, tableHead: nullIfEmpty(v.tableHead), tableRows: nullIfEmpty(v.tableRows) } as Partial<Guide>)}
        />
      )}
      {tab === "faq" && <FormFields fields={FAQ} value={f} onChange={(v) => patch(v as Partial<Guide>)} />}
      {tab === "picks" && (
        <div className="ad-panel">
          <div className="ad-head" style={{ margin: 0 }}>
            <h2>Picks in this guide</h2>
            {!ed.isNew && <Link href={`/admin/products/new?guideId=${f.id}`} className="ad-btn ad-btn--sm ad-btn--primary">+ Add product</Link>}
          </div>
          <p className="ad-hint">Ordered by rank: 0 = our pick, 1 = budget pick, 2 = upgrade.</p>
          {ed.isNew ? (
            <p className="ad-hint">Save the guide first.</p>
          ) : (
            <table className="ad-table">
              <thead><tr><th>Rank</th><th>Product</th><th>Label</th><th>Score</th><th></th></tr></thead>
              <tbody>
                {(f.products ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.rank}</td>
                    <td className="ad-cell-main"><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                    <td><span className="ad-pill">{p.label}</span></td>
                    <td>{score(p.score)}</td>
                    <td className="ad-cell-end"><Link href={`/admin/products/${p.id}`} className="ad-btn ad-btn--sm">Edit</Link></td>
                  </tr>
                ))}
                {(f.products ?? []).length === 0 && <tr><td colSpan={5}>No products yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === "longform" && (
        <>
          <div className="ad-panel ad-form">
            <label className="ad-check">
              <input type="checkbox" checked={!!f.full} onChange={(e) => set("full", e.target.checked ? (f.full ?? emptyFull) : null)} />
              Long-form guide (short answer, comparison table, picks in depth, buying advice, glossary…)
            </label>
            <span className="ad-hint">Long-form guides also show the sticky “our pick” bar and the newsletter popup (see Settings).</span>
          </div>
          {f.full && (
            <>
              <div className="ad-panel">
                <h2>Section titles</h2>
                <p className="ad-hint">Optional headings that mention the product type.</p>
                <FormFields fields={TITLES} value={f.full.titles ?? {}} onChange={(t) => set("full", { ...f.full!, titles: t })} />
              </div>
              <FormFields fields={longform(products)} value={f.full} onChange={(v) => set("full", v as GuideFull)} />
            </>
          )}
        </>
      )}
      {tab === "preview" && preview}
    </div>
  );

  return (
    <>
      <div className="ad-head">
        <h1>{ed.isNew ? "New guide" : f.title || "Untitled"}</h1>
        <div className="ad-savebar">
          <SaveStatus msg={ed.msg} dirty={ed.dirty} />
          {!ed.isNew && <a className="ad-btn" href={`/guide/${f.slug}${f.published ? "" : "?preview=1"}`} target="_blank" rel="noreferrer">Open on site ↗</a>}
          {!ed.isNew && <button className="ad-btn ad-btn--danger" onClick={() => ed.remove(`Delete "${f.title}"?`, "The guide and all its products (reviews) are deleted. This cannot be undone.")}>Delete</button>}
          {f.published ? (
            <>
              <button className="ad-btn" disabled={ed.saving} onClick={() => saveWith({ published: false })}>Unpublish</button>
              <button className="ad-btn ad-btn--primary" disabled={ed.saving} onClick={() => saveWith()}>Update</button>
            </>
          ) : (
            <>
              <button className="ad-btn" disabled={ed.saving} onClick={() => saveWith()}>Save draft</button>
              <button className="ad-btn ad-btn--primary" disabled={ed.saving} onClick={() => saveWith({ published: true })}>Publish</button>
            </>
          )}
        </div>
      </div>

      <div className="ad-editor">
        <div className="ad-editor__meta ad-form" key={ed.version}>
          <label>Title<input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="The best stick vacuum of 2026" /></label>
          <div className="ad-2">
            <label>Short name<input value={f.short} onChange={(e) => set("short", e.target.value)} placeholder="Stick vacuums" /></label>
            <label>Status
              <select value={f.published ? "published" : "draft"} onChange={(e) => set("published", e.target.value === "published")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <label>Slug<input value={f.slug} placeholder="from short name" onChange={(e) => set("slug", e.target.value)} />
            <span className="ad-hint">/guide/{slug || "…"}</span>
          </label>
          <label>Intro<textarea className="sf-text" value={f.intro} onChange={(e) => set("intro", e.target.value)} />
            <span className="ad-hint">Shown under the title, on cards and as the meta description.</span>
          </label>
          <div className="ad-2">
            <label>Category
              <select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">—</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Author
              <select value={f.authorId} onChange={(e) => set("authorId", e.target.value)}>
                <option value="">—</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          </div>

          <Fieldset legend="Images">
            <div className="sf-field"><span className="sf-label">Card image</span><ImageInput value={f.coverImage ?? ""} onChange={(v) => set("coverImage", v || null)} /></div>
            <div className="sf-field"><span className="sf-label">Lead photo</span><ImageInput value={f.heroImage ?? ""} onChange={(v) => set("heroImage", v || null)} /><span className="ad-hint">Top of the guide and the home page hero.</span></div>
            <div className="sf-field"><span className="sf-label">Test setup photo</span><ImageInput value={f.testImage ?? ""} onChange={(v) => set("testImage", v || null)} /></div>
            <label>Placeholder note<input value={f.photoNote} onChange={(e) => set("photoNote", e.target.value)} placeholder="stick vacuums in the test house" /></label>
          </Fieldset>

          <Fieldset legend="Card details">
            <div className="ad-2">
              <label>Models tested<input type="number" value={f.modelsTested} onChange={(e) => set("modelsTested", Number(e.target.value))} /></label>
              <label>Test weeks<input type="number" value={f.testWeeks} onChange={(e) => set("testWeeks", Number(e.target.value))} /></label>
            </div>
            <div className="ad-2">
              <label>Updated<input value={f.updatedLabel} placeholder="October 3, 2026" onChange={(e) => set("updatedLabel", e.target.value)} /></label>
              <label>First published<input value={f.publishedLabel} placeholder="February 14, 2026" onChange={(e) => set("publishedLabel", e.target.value)} /></label>
            </div>
            <label>Sort order<input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></label>
          </Fieldset>

          <Fieldset legend="SEO">
            <label>SEO title<input value={f.seoTitle ?? ""} placeholder={`${f.title || "Title"} – HouseholdMe`} onChange={(e) => set("seoTitle", e.target.value || null)} /></label>
            <span className="ad-hint">Structured data (JSON-LD) is generated automatically for long-form guides.</span>
          </Fieldset>
        </div>

        <div className="ad-editor__work">
          <EditorTabs tabs={TABS} tab={tab} onTab={setTab} split={split} onSplit={setSplit} mobile={mobile} onMobile={setMobile} />
          <div className={`ad-split${split ? " ad-split--side" : ""}`}>
            {work}
            {split && tab !== "preview" && preview}
          </div>
          <p className="ad-hint">The preview shows the page as last saved (drafts included). Ctrl/⌘+S saves.</p>
        </div>
      </div>
    </>
  );
}
