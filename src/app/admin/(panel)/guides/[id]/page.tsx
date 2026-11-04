"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Checkbox,
  JsonField,
  LinesField,
  NumberField,
  ObjectList,
  ParagraphsField,
  SelectField,
  SlugField,
  TableField,
  TextArea,
  TextField,
} from "@/components/admin/fields";
import { ImageField } from "@/components/admin/media";
import { Loading, PageHeader, Panel, SaveBar, Tabs, useList, useRecord } from "@/components/admin/ui";
import { score } from "@/lib/format";
import type { Author, Category, Guide, GuideFull } from "@/lib/types";

const blank = {
  slug: "",
  title: "",
  seoTitle: null,
  short: "",
  intro: "",
  published: false,
  categoryId: "",
  authorId: "",
  modelsTested: 0,
  testWeeks: 0,
  updatedLabel: "",
  publishedLabel: "",
  photoNote: "",
  coverImage: null,
  heroImage: null,
  testImage: null,
  forWho: "",
  howTested: "",
  howCaption: null,
  bought: null,
  criteria: [],
  tableHead: null,
  tableRows: null,
  tableNote: null,
  faq: [],
  sources: [],
  changes: [],
  full: null,
  sortOrder: 0,
} as unknown as Guide;

const emptyFull: GuideFull = {
  titles: {},
  summary: [],
  compare: null,
  deep: [],
  bars: [],
  buyIntro: "",
  buying: [],
  tiers: [],
  vsHead: [],
  vsRows: [],
  vsNote: "",
  care: [],
  skip: [],
  skipNote: "",
  next: [],
  durable: [],
  situations: [],
  specsIntro: "",
  specsExplained: [],
  mistakes: [],
  verdict: [],
  glossary: [],
};

const TABS = ["Basics", "Content", "Results table", "FAQ & sources", "Picks", "Long-form sections"];

export default function GuideEdit() {
  const { id } = useParams<{ id: string }>();
  const r = useRecord<Guide>("guides", id, blank, "/admin/guides");
  const cats = useList<Category>("/categories");
  const authors = useList<Author>("/authors");
  const [tab, setTab] = useState(TABS[0]);
  const [jsonOk, setJsonOk] = useState(true);
  const v = r.value;
  if (!r.loaded) return <Loading error={r.error} />;

  const full = v.full;
  const setFull = <K extends keyof GuideFull>(k: K) => (val: GuideFull[K]) => r.setValue((cur) => ({ ...cur, full: { ...(cur.full ?? emptyFull), [k]: val } }));
  const productOptions = (v.products ?? []).map((p) => ({ value: p.slug, label: p.name }));

  return (
    <div key={r.version} className="stack" style={{ gap: 20 }}>
      <PageHeader title={r.isNew ? "New buying guide" : v.title} subtitle={r.isNew ? "Save the basics first, then add picks." : <span className="mono">/guide/{v.slug}</span>} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Basics" && (
        <>
          <Panel title="Basics">
            <div className="a-grid">
              <TextField className="span-all" label="Title" value={v.title} onChange={r.set("title")} placeholder="The best stick vacuum of 2026" />
              <TextField label="Short name" value={v.short} onChange={r.set("short")} placeholder="Stick vacuums" hint="Used in breadcrumbs and labels." />
              <SlugField label="Slug" value={v.slug} onChange={r.set("slug")} source={v.short || v.title} />
              <SelectField label="Category" value={v.categoryId} onChange={r.set("categoryId")} options={cats.items.map((c) => ({ value: c.id, label: c.name }))} />
              <SelectField label="Author" value={v.authorId} onChange={r.set("authorId")} options={authors.items.map((a) => ({ value: a.id, label: a.name }))} />
              <TextField className="span-all" label="SEO title" value={v.seoTitle} onChange={r.set("seoTitle")} hint="Optional. Defaults to the title." />
              <TextArea className="span-all" label="Intro" value={v.intro} onChange={r.set("intro")} rows={3} />
              <Checkbox label="Published (visible on the site)" value={v.published} onChange={r.set("published")} />
              <NumberField label="Sort order" value={v.sortOrder} onChange={r.set("sortOrder")} />
            </div>
          </Panel>
          <Panel title="Test facts">
            <div className="a-grid">
              <NumberField label="Models tested" value={v.modelsTested} onChange={r.set("modelsTested")} />
              <NumberField label="Test period (weeks)" value={v.testWeeks} onChange={r.set("testWeeks")} />
              <TextField label="Updated (label)" value={v.updatedLabel} onChange={r.set("updatedLabel")} placeholder="October 3, 2026" />
              <TextField label="First published (label)" value={v.publishedLabel} onChange={r.set("publishedLabel")} placeholder="February 14, 2026" />
              <LinesField className="span-2" label="Score criteria" value={v.criteria} onChange={r.set("criteria")} hint="One per line, e.g. Suction, Battery, Ease of use, Noise." />
            </div>
          </Panel>
          <Panel title="Images">
            <div className="a-grid">
              <ImageField className="span-all" label="Card image" value={v.coverImage} onChange={r.set("coverImage")} hint="Shown on cards in lists." />
              <ImageField className="span-all" label="Lead photo" value={v.heroImage} onChange={r.set("heroImage")} hint="Top of the guide and the home page hero." />
              <ImageField className="span-all" label="Test setup photo" value={v.testImage} onChange={r.set("testImage")} />
              <TextField className="span-all" label="Placeholder note" value={v.photoNote} onChange={r.set("photoNote")} hint="Shown when an image is missing, e.g. “stick vacuums in the test house”." />
            </div>
          </Panel>
        </>
      )}

      {tab === "Content" && (
        <Panel title="Main sections">
          <TextArea label="Who is this for?" value={v.forWho} onChange={r.set("forWho")} rows={4} />
          <TextArea label="How we tested" value={v.howTested} onChange={r.set("howTested")} rows={4} />
          <TextField label="Test photo caption" value={v.howCaption} onChange={r.set("howCaption")} />
          <TextArea label="How the products were obtained" value={v.bought} onChange={r.set("bought")} rows={2} hint='Added to "Why you can trust us". E.g. “We bought 18 of the 22 machines ourselves…”' />
        </Panel>
      )}

      {tab === "Results table" && (
        <Panel title="Test results compared" subtitle="Leave empty to show the picks with rank, score and price.">
          <LinesField label="Header row" value={v.tableHead ?? []} onChange={(x) => r.set("tableHead")(x.length ? x : null)} hint="One column title per line, e.g. Model, Pickup, Runtime…" />
          <TableField label="Rows" value={v.tableRows ?? []} onChange={(x) => r.set("tableRows")(x.length ? x : null)} />
          <TextField label="Note below the table" value={v.tableNote} onChange={r.set("tableNote")} />
        </Panel>
      )}

      {tab === "FAQ & sources" && (
        <>
          <Panel title="Frequently asked questions">
            <ObjectList itemLabel="Question" value={v.faq} onChange={r.set("faq")} fields={[{ key: "q", label: "Question", type: "text", wide: true }, { key: "a", label: "Answer", type: "textarea" }]} />
          </Panel>
          <Panel title="Sources and changelog">
            <LinesField label="Sources" value={v.sources} onChange={r.set("sources")} />
            <ObjectList label="Changelog" itemLabel="Change" value={v.changes} onChange={r.set("changes")} fields={[{ key: "date", label: "Date", type: "text" }, { key: "text", label: "What changed", type: "text" }]} />
          </Panel>
        </>
      )}

      {tab === "Picks" && (
        <Panel
          title="Picks in this guide"
          subtitle="Products are ordered by rank: 0 = our pick, 1 = budget pick, 2 = upgrade."
          actions={!r.isNew && <Link href={`/admin/products/new?guideId=${v.id}`} className="a-btn primary sm">+ Add product</Link>}
        >
          {r.isNew ? (
            <p className="small">Save the guide first.</p>
          ) : (v.products ?? []).length === 0 ? (
            <p className="small">No products yet.</p>
          ) : (
            <table className="a-table">
              <thead>
                <tr><th>Rank</th><th>Product</th><th>Label</th><th>Score</th><th /></tr>
              </thead>
              <tbody>
                {(v.products ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.rank}</td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>{p.label}</td>
                    <td>{score(p.score)}</td>
                    <td className="actions"><Link href={`/admin/products/${p.id}`} className="a-btn sm">Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {tab === "Long-form sections" && (
        <>
          <Panel title="Long-form guide">
            <Checkbox
              label="Enable long-form sections (summary, comparison, in-depth picks, buying advice, glossary…)"
              value={!!full}
              onChange={(on) => r.setValue((cur) => ({ ...cur, full: on ? (cur.full ?? emptyFull) : null }))}
            />
          </Panel>
          {full && (
            <>
              <Panel title="Section titles" subtitle="Optional overrides for headings that mention the product type.">
                <div className="a-grid">
                  {(
                    [
                      ["buying", "What to look for (heading)"],
                      ["vs", "Product types table (heading)"],
                      ["vsToc", "Product types (table of contents)"],
                      ["care", "Maintenance (heading)"],
                      ["situations", "Situations (heading)"],
                      ["mistakes", "Mistakes (heading)"],
                    ] as const
                  ).map(([k, label]) => (
                    <TextField key={k} label={label} value={full.titles?.[k] ?? ""} onChange={(x) => setFull("titles")({ ...(full.titles ?? {}), [k]: x || undefined })} />
                  ))}
                </div>
              </Panel>
              <Panel title="The short answer">
                <LinesField label="Summary points" value={full.summary} onChange={setFull("summary")} rows={6} />
              </Panel>
              <Panel
                title="Compare side by side"
                subtitle={
                  <>
                    JSON. <code>cols</code>: products by slug with <code>stars</code>, <code>reviews</code>, <code>was</code> (old price) and <code>highlight</code>. In <code>groups[].rows[].cells</code> use
                    {" "}<code>&quot;y&quot;</code>/<code>&quot;n&quot;</code> for yes/no and <code>&quot;b9.1:91&quot;</code> for a bar (label:percent). <code>better</code>: &quot;high&quot;, &quot;low&quot; or null.
                  </>
                }
              >
                <JsonField
                  label="Comparison table"
                  value={full.compare}
                  rows={18}
                  onChange={(x, ok) => {
                    setJsonOk(ok);
                    if (ok) setFull("compare")(x as GuideFull["compare"]);
                  }}
                />
              </Panel>
              <Panel title="Our picks in depth">
                <ObjectList
                  itemLabel="Pick"
                  value={full.deep}
                  onChange={setFull("deep")}
                  fields={[
                    { key: "product", label: "Product", type: "select", options: productOptions },
                    { key: "bestFor", label: "Choose this if…", type: "text", wide: true },
                    { key: "body", label: "Text", type: "paragraphs" },
                    { key: "specs", label: "Measured", type: "list", itemLabel: "Spec", fields: [{ key: "k", label: "Label", type: "text" }, { key: "v", label: "Value", type: "text" }] },
                    { key: "scores", label: "Score breakdown", type: "list", itemLabel: "Score", fields: [{ key: "k", label: "Criterion", type: "text" }, { key: "v", label: "Score (0–10)", type: "number", step: 0.1 }] },
                  ]}
                />
              </Panel>
              <Panel title="Results by test">
                <ObjectList
                  itemLabel="Test"
                  value={full.bars}
                  onChange={setFull("bars")}
                  fields={[
                    { key: "heading", label: "Heading", type: "text" },
                    { key: "note", label: "Note", type: "textarea" },
                    { key: "rows", label: "Results", type: "list", itemLabel: "Model", fields: [{ key: "name", label: "Model", type: "text" }, { key: "value", label: "Value shown", type: "text" }, { key: "pct", label: "Bar length (%)", type: "number" }] },
                  ]}
                />
              </Panel>
              <Panel title="What to look for">
                <TextArea label="Intro" value={full.buyIntro} onChange={setFull("buyIntro")} rows={3} />
                <ObjectList itemLabel="Topic" value={full.buying} onChange={setFull("buying")} fields={[{ key: "heading", label: "Heading", type: "text", wide: true }, { key: "paragraphs", label: "Text", type: "paragraphs" }, { key: "tip", label: "Our tip", type: "textarea" }]} />
              </Panel>
              <Panel title="How much should you spend?">
                <ObjectList itemLabel="Price tier" value={full.tiers} onChange={setFull("tiers")} fields={[{ key: "heading", label: "Tier", type: "text" }, { key: "pick", label: "Pick line", type: "text" }, { key: "text", label: "Text", type: "textarea" }]} />
              </Panel>
              <Panel title="Product types table">
                <TableField label="Header row" rows={1} value={full.vsHead.length ? [full.vsHead] : []} onChange={(t) => setFull("vsHead")(t[0] ?? [])} hint='One line, cells separated by " | ". Start with " | " to leave the first column empty.' />
                <TableField label="Rows" value={full.vsRows} onChange={setFull("vsRows")} />
                <TextArea label="Note" value={full.vsNote} onChange={setFull("vsNote")} rows={3} />
              </Panel>
              <Panel title="Maintenance">
                <ObjectList itemLabel="Tip" value={full.care} onChange={setFull("care")} fields={[{ key: "heading", label: "Heading", type: "text", wide: true }, { key: "text", label: "Text", type: "textarea" }]} />
              </Panel>
              <Panel title="Tested but not recommended">
                <ObjectList itemLabel="Model" value={full.skip} onChange={setFull("skip")} fields={[{ key: "name", label: "Model", type: "text" }, { key: "score", label: "Score", type: "text" }, { key: "why", label: "Why not", type: "textarea" }]} />
                <TextArea label="Note" value={full.skipNote} onChange={setFull("skipNote")} rows={2} />
              </Panel>
              <Panel title="What we're testing now">
                <ObjectList itemLabel="Model" value={full.next} onChange={setFull("next")} fields={[{ key: "name", label: "Model", type: "text" }, { key: "status", label: "Status", type: "text" }, { key: "text", label: "Text", type: "textarea" }]} />
              </Panel>
              <Panel title="Durability, warranty and repair">
                <ParagraphsField label="Text" value={full.durable} onChange={setFull("durable")} />
              </Panel>
              <Panel title="Situations">
                <ObjectList itemLabel="Situation" value={full.situations} onChange={setFull("situations")} fields={[{ key: "heading", label: "Heading", type: "text", wide: true }, { key: "text", label: "Text", type: "textarea" }]} />
              </Panel>
              <Panel title="What the numbers on the box mean">
                <TextArea label="Intro" value={full.specsIntro} onChange={setFull("specsIntro")} rows={2} />
                <ObjectList itemLabel="Spec" value={full.specsExplained} onChange={setFull("specsExplained")} fields={[{ key: "term", label: "Term", type: "text", wide: true }, { key: "text", label: "Explanation", type: "textarea" }]} />
              </Panel>
              <Panel title="Mistakes">
                <ObjectList itemLabel="Mistake" value={full.mistakes} onChange={setFull("mistakes")} fields={[{ key: "heading", label: "Heading", type: "text", wide: true }, { key: "text", label: "Text", type: "textarea" }]} />
              </Panel>
              <Panel title="Our final verdict">
                <ParagraphsField label="Text" value={full.verdict} onChange={setFull("verdict")} />
              </Panel>
              <Panel title="Glossary">
                <ObjectList itemLabel="Term" value={full.glossary} onChange={setFull("glossary")} fields={[{ key: "term", label: "Term", type: "text", wide: true }, { key: "definition", label: "Definition", type: "textarea" }]} />
              </Panel>
            </>
          )}
        </>
      )}

      <SaveBar
        saving={r.saving}
        error={r.error ?? (jsonOk ? null : "Fix the invalid JSON in the comparison table before saving.")}
        notice={r.notice}
        disabled={!jsonOk}
        onSave={() => r.save()}
        onDelete={r.isNew ? undefined : () => r.remove(`"${v.title}" and all its products`)}
        viewHref={r.isNew ? null : `/guide/${v.slug}`}
      />
    </div>
  );
}
