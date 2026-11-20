"use client";

import { useEffect, useState } from "react";
import { EditorPreview, SaveStatus } from "@/components/admin/Editor";
import { FormFields, type FieldDef } from "@/components/admin/FormFields";
import { useSetting } from "@/components/admin/useSetting";
import { adminApi } from "@/lib/admin-api";
import type { Guide, HomeSettings, PostType, Product } from "@/lib/types";

export default function FrontPageEditor() {
  const s = useSetting("home");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    adminApi<{ items: Guide[] }>("/guides?pageSize=500").then((d) => setGuides(d.items)).catch(() => {});
    adminApi<{ items: Product[] }>("/products?pageSize=500").then((d) => setProducts(d.items)).catch(() => {});
  }, []);

  if (!s.value) return <p>{s.msg?.text ?? "Loading…"}</p>;
  const h = s.value;

  const fields: FieldDef[] = [
    { key: "heroGuideSlug", label: "Hero guide", type: "select", options: guides.map((g) => ({ value: g.slug, label: g.title })) },
    { key: "heroIntro", label: "Hero text", type: "textarea", help: "Leave empty to use the guide's intro." },
    { key: "heroSecondaryProductSlug", label: "Second hero button (review)", type: "select", options: products.map((p) => ({ value: p.slug, label: p.name })) },
    { key: "trustFacts", label: "Trust facts", type: "list", itemLabel: "{{value}} · {{label}}", fields: [{ key: "value", label: "Value", type: "text", half: true }, { key: "label", label: "Label", type: "text", half: true }] },
    { key: "testTitle", label: "“How we test” block: title", type: "text" },
    { key: "testText", label: "“How we test” block: text", type: "textarea", help: "The steps come from Settings → How we test." },
  ];
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Front page</h1>
          <p className="ad-hint" style={{ margin: "4px 0 0" }}>Changes go live when you publish. The preview on the right reloads after each save.</p>
        </div>
        <div className="ad-savebar">
          <SaveStatus msg={s.msg} dirty={s.dirty} />
          <a className="ad-btn" href="/" target="_blank" rel="noreferrer">Open on site ↗</a>
          <button className="ad-btn" onClick={() => setMobile(!mobile)}>{mobile ? "Mobile" : "Desktop"} preview</button>
          <button className="ad-btn ad-btn--primary" disabled={s.busy} onClick={s.save}>Publish</button>
        </div>
      </div>
      <div className="fp-editor">
        <div className="ad-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormFields fields={fields} value={h} onChange={(v) => s.update(v as Partial<HomeSettings>)} />
          <PostPicker label="Latest buying guides" hint="Shown in this order under “Latest buying guides”." type="BUYING_GUIDE" guides={guides} slugs={h.guideSlugs} onChange={(v) => s.update({ guideSlugs: v })} />
          <PostPicker label="Latest reviews" type="SINGLE_REVIEW" guides={guides} slugs={h.reviewSlugs ?? []} onChange={(v) => s.update({ reviewSlugs: v })} />
          <PostPicker label="Latest comparisons" type="COMPARISON" guides={guides} slugs={h.comparisonSlugs ?? []} onChange={(v) => s.update({ comparisonSlugs: v })} />
          <PostPicker label="Explained (info articles)" type="INFO_ARTICLE" guides={guides} slugs={h.infoSlugs ?? []} onChange={(v) => s.update({ infoSlugs: v })} />
        </div>
        <div className="fp-preview">
          <EditorPreview url="/" reloadKey={s.savedAt} mobile={mobile} />
        </div>
      </div>
    </>
  );
}

/** Ordered list of hand-picked posts of one type. Fewer than 3 picks → the site fills up with the newest posts of that type. */
function PostPicker({ label, hint, type, guides, slugs, onChange }: { label: string; hint?: string; type: PostType; guides: Guide[]; slugs: string[]; onChange: (slugs: string[]) => void }) {
  const ofType = guides.filter((g) => g.type === type);
  const title = (slug: string) => guides.find((g) => g.slug === slug)?.title ?? slug;
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= slugs.length) return;
    const n = [...slugs];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="sf-field">
      <span className="sf-label">{label}</span>
      <span className="ad-hint">{hint ?? "Shown in this order."} With fewer than 3 picks, the newest posts of this type fill the rest.</span>
      <div className="sf-list">
        {slugs.map((slug, i) => (
          <div key={slug} className="sf-item">
            <div className="sf-item__head">
              <span className="sf-item__toggle" style={{ cursor: "default" }}><span className="sf-item__n">{i + 1}</span>{title(slug)}</span>
              <span className="sf-item__ops">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === slugs.length - 1}>↓</button>
                <button type="button" aria-label="Remove" onClick={() => onChange(slugs.filter((x) => x !== slug))}>×</button>
              </span>
            </div>
          </div>
        ))}
        <div className="ad-form" style={{ padding: 8 }}>
          <select value="" onChange={(e) => e.target.value && onChange([...slugs, e.target.value])}>
            <option value="">+ Add a post…</option>
            {ofType.filter((g) => !slugs.includes(g.slug)).map((g) => <option key={g.id} value={g.slug}>{g.title}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
