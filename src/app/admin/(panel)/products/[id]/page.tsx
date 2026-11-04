"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LinesField, NumberField, ObjectList, SelectField, SlugField, TextArea, TextField } from "@/components/admin/fields";
import { ImageListField } from "@/components/admin/media";
import { Loading, PageHeader, Panel, SaveBar, Tabs, useList, useRecord } from "@/components/admin/ui";
import type { Guide, Product } from "@/lib/types";

const LABELS = ["Our pick", "Budget pick", "Upgrade"];
const TABS = ["Basics", "Review", "Scores & results", "Shops & prices", "Specs & comparison", "Q&A & FAQ"];

function blank(guideId: string): Product {
  return {
    slug: "", name: "", guideId, rank: 0, label: "Our pick", score: 0, price: 0, verdict: "", pros: [], cons: [], images: [],
    subtitle: null, verdictLong: null, inUseSince: null, purchase: null, readTime: null, designText: null, videoUrl: null,
    goodFor: [], notFor: [], sources: [], subScores: [], shops: [], priceHistory: [], results: [], longTerm: [], specs: [],
    compareRows: [], questions: [], faq: [], changes: [],
  } as unknown as Product;
}

function ProductEditInner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const r = useRecord<Product>("products", id, blank(sp.get("guideId") ?? ""), "/admin/products");
  const guides = useList<Guide>("/guides");
  const [tab, setTab] = useState(TABS[0]);
  const v = r.value;
  if (!r.loaded) return <Loading error={r.error} />;
  const guide = guides.items.find((g) => g.id === v.guideId);

  return (
    <div key={r.version} className="stack" style={{ gap: 20 }}>
      <PageHeader title={r.isNew ? "New product" : v.name} subtitle={r.isNew ? undefined : <span className="mono">/review/{v.slug}</span>} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Basics" && (
        <>
          <Panel title="Product">
            <div className="a-grid">
              <TextField label="Name" value={v.name} onChange={r.set("name")} />
              <SlugField label="Slug" value={v.slug} onChange={r.set("slug")} source={v.name} />
              <SelectField className="span-2" label="Buying guide" value={v.guideId} onChange={r.set("guideId")} options={guides.items.map((g) => ({ value: g.id, label: g.title }))} />
              <NumberField
                label="Rank in guide"
                value={v.rank}
                onChange={(n) => r.setValue((cur) => ({ ...cur, rank: n, label: LABELS[n] ?? cur.label }))}
                hint="0 = our pick, 1 = budget pick, 2 = upgrade."
              />
              <TextField label="Label" value={v.label} onChange={r.set("label")} />
              <NumberField label="Test score (0–10)" value={v.score} onChange={r.set("score")} step={0.1} />
              <NumberField label="Price from (USD)" value={v.price} onChange={r.set("price")} />
              <TextArea className="span-all" label="Short verdict" value={v.verdict} onChange={r.set("verdict")} rows={2} hint="Shown on pick cards." />
              <LinesField className="span-2" label="Pros" value={v.pros} onChange={r.set("pros")} />
              <LinesField className="span-2" label="Cons" value={v.cons} onChange={r.set("cons")} />
            </div>
          </Panel>
          <Panel title="Photos" subtitle="The first photo is the main product photo; the next ones fill the review gallery.">
            <ImageListField label="Gallery" value={v.images} onChange={r.set("images")} />
          </Panel>
        </>
      )}

      {tab === "Review" && (
        <Panel title="Review page">
          <div className="a-grid">
            <TextArea className="span-all" label="Subtitle" value={v.subtitle} onChange={r.set("subtitle")} rows={2} hint="Defaults to the short verdict." />
            <TextArea className="span-all" label="Our verdict (long)" value={v.verdictLong} onChange={r.set("verdictLong")} rows={3} />
            <TextField label="In use since" value={v.inUseSince} onChange={r.set("inUseSince")} placeholder="February 2026 (7 months)" />
            <TextField label="Purchase" value={v.purchase} onChange={r.set("purchase")} placeholder="Bought ourselves at Best Buy" />
            <TextField label="Reading time" value={v.readTime} onChange={r.set("readTime")} placeholder="9 minutes" />
            <LinesField className="span-2" label="Good for" value={v.goodFor} onChange={r.set("goodFor")} />
            <LinesField className="span-2" label="Less suited for" value={v.notFor} onChange={r.set("notFor")} />
            <TextArea className="span-all" label="Design and use" value={v.designText} onChange={r.set("designText")} rows={4} />
            <TextField className="span-all" label="Video URL" value={v.videoUrl} onChange={r.set("videoUrl")} hint="Optional MP4/WebM link (upload it in the media library)." />
          </div>
          <ObjectList label="Long-term test" itemLabel="Update" value={v.longTerm} onChange={r.set("longTerm")} fields={[{ key: "date", label: "Date", type: "text" }, { key: "text", label: "Update", type: "text" }]} />
        </Panel>
      )}

      {tab === "Scores & results" && (
        <>
          <Panel title="Score breakdown" subtitle={guide?.criteria?.length ? `This guide's criteria: ${guide.criteria.join(", ")}` : undefined}>
            <ObjectList itemLabel="Criterion" value={v.subScores} onChange={r.set("subScores")} fields={[{ key: "label", label: "Criterion", type: "text" }, { key: "value", label: "Score (0–10)", type: "number", step: 0.1 }]} />
          </Panel>
          <Panel title="Test results vs. average">
            <ObjectList
              itemLabel="Result"
              value={v.results}
              onChange={r.set("results")}
              fields={[
                { key: "label", label: "Test", type: "text" },
                { key: "value", label: "Result", type: "text" },
                { key: "average", label: "Average", type: "text" },
                { key: "pct", label: "Bar (%)", type: "number" },
                { key: "averagePct", label: "Average bar (%)", type: "number" },
              ]}
            />
          </Panel>
        </>
      )}

      {tab === "Shops & prices" && (
        <>
          <Panel title="Shops" subtitle="Affiliate links for the red “Check price” buttons. The first shop is the main one.">
            <ObjectList
              itemLabel="Shop"
              value={v.shops}
              onChange={r.set("shops")}
              fields={[
                { key: "shop", label: "Shop name", type: "text" },
                { key: "price", label: "Price (USD)", type: "number" },
                { key: "url", label: "Link", type: "text", wide: true },
                { key: "note", label: "Note", type: "text", wide: true },
              ]}
            />
          </Panel>
          <Panel title="Price history">
            <ObjectList itemLabel="Month" value={v.priceHistory} onChange={r.set("priceHistory")} fields={[{ key: "month", label: "Month", type: "text" }, { key: "price", label: "Price (USD)", type: "number" }]} />
          </Panel>
        </>
      )}

      {tab === "Specs & comparison" && (
        <>
          <Panel title="Specifications" subtitle="Leave empty to show price, score, rank and test facts.">
            <ObjectList itemLabel="Spec" value={v.specs} onChange={r.set("specs")} fields={[{ key: "k", label: "Label", type: "text" }, { key: "v", label: "Value", type: "text" }]} />
          </Panel>
          <Panel title="Extra comparison rows" subtitle="Added below score/price/rank in “How it compares”. One value per pick, in rank order.">
            <ObjectList itemLabel="Row" value={v.compareRows} onChange={r.set("compareRows")} fields={[{ key: "name", label: "Row name", type: "text" }, { key: "cells", label: "Values", type: "cells" }]} />
          </Panel>
        </>
      )}

      {tab === "Q&A & FAQ" && (
        <>
          <Panel title="Reader questions">
            <ObjectList itemLabel="Question" value={v.questions} onChange={r.set("questions")} fields={[{ key: "who", label: "From", type: "text", wide: true }, { key: "q", label: "Question", type: "text", wide: true }, { key: "a", label: "Answer", type: "textarea" }]} />
          </Panel>
          <Panel title="FAQ" subtitle="Leave empty to reuse the guide's FAQ.">
            <ObjectList itemLabel="Question" value={v.faq} onChange={r.set("faq")} fields={[{ key: "q", label: "Question", type: "text", wide: true }, { key: "a", label: "Answer", type: "textarea" }]} />
          </Panel>
          <Panel title="Sources and changelog">
            <LinesField label="Sources" value={v.sources} onChange={r.set("sources")} />
            <ObjectList label="Changelog" itemLabel="Change" value={v.changes} onChange={r.set("changes")} fields={[{ key: "date", label: "Date", type: "text" }, { key: "text", label: "What changed", type: "text" }]} />
          </Panel>
        </>
      )}

      <SaveBar
        saving={r.saving}
        error={r.error}
        notice={r.notice}
        onSave={() => r.save()}
        onDelete={r.isNew ? undefined : () => r.remove(v.name)}
        viewHref={r.isNew ? null : `/review/${v.slug}`}
      />
    </div>
  );
}

export default function ProductEdit() {
  return (
    <Suspense>
      <ProductEditInner />
    </Suspense>
  );
}
