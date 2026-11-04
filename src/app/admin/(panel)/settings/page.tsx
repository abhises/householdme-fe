"use client";

import { useEffect, useState } from "react";
import { Checkbox, Field, LinesField, ObjectList, SelectField, TextArea, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/media";
import { Loading, PageHeader, Panel, SaveBar, Tabs, useList } from "@/components/admin/ui";
import { adminApi, errorText } from "@/lib/admin-api";
import type { AllSettings, Author, Guide, Product } from "@/lib/types";

const TABS = ["Site", "Home page", "How we test"] as const;
type Tab = (typeof TABS)[number];
const KEY: Record<Tab, keyof AllSettings> = { Site: "site", "Home page": "home", "How we test": "method" };

export default function SettingsPage() {
  const [values, setValues] = useState<AllSettings | null>(null);
  const [tab, setTab] = useState<Tab>("Site");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const guides = useList<Guide>("/guides");
  const products = useList<Product>("/products");
  const authors = useList<Author>("/authors");

  useEffect(() => {
    adminApi<{ values: AllSettings }>("/settings")
      .then((r) => setValues(r.values))
      .catch((e) => setError(errorText(e)));
  }, []);

  if (!values) return <Loading error={error} />;

  const setIn = <K extends keyof AllSettings>(k: K) => <F extends keyof AllSettings[K]>(f: F) => (v: AllSettings[K][F]) =>
    setValues((cur) => (cur ? { ...cur, [k]: { ...cur[k], [f]: v } } : cur));
  const site = setIn("site");
  const home = setIn("home");
  const method = setIn("method");
  const s = values.site;
  const h = values.home;
  const m = values.method;

  const save = async () => {
    const key = KEY[tab];
    setSaving(true);
    setError(null);
    try {
      const saved = await adminApi<AllSettings[typeof key]>(`/settings/${key}`, { method: "PUT", json: values[key] });
      setValues((cur) => (cur ? { ...cur, [key]: saved } : cur));
      setNotice("Saved");
      setTimeout(() => setNotice(null), 2500);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      <PageHeader title="Settings" subtitle="Each tab is saved separately." />
      <Tabs tabs={[...TABS]} active={tab} onChange={(t) => setTab(t as Tab)} />

      {tab === "Site" && (
        <>
          <Panel title="Conversion">
            <div className="a-grid">
              <Checkbox label="Show affiliate disclosure bar above the header" value={s.disclosureBar} onChange={site("disclosureBar")} />
              <Checkbox label="Show sticky “our pick” buy bar on long-form guides" value={s.stickyBuyBar} onChange={site("stickyBuyBar")} />
              <SelectField
                label="Newsletter popup on long-form guides"
                value={s.newsletterPopup}
                onChange={(v) => site("newsletterPopup")((v || "off") as typeof s.newsletterPopup)}
                options={[
                  { value: "scroll", label: "After scrolling 35% of the page" },
                  { value: "timer", label: "After 15 seconds" },
                  { value: "direct", label: "Right away" },
                  { value: "off", label: "Off" },
                ]}
              />
              <TextField label="Prices checked on (label)" value={s.pricesCheckedLabel} onChange={site("pricesCheckedLabel")} />
              <ImageField className="span-all" label="Newsletter popup image" value={s.newsletterImage} onChange={site("newsletterImage")} />
            </div>
          </Panel>
          <Panel title="Editorial">
            <div className="a-grid">
              <SelectField
                label="Reviewer (editor-in-chief)"
                value={s.reviewerSlug}
                onChange={site("reviewerSlug")}
                options={authors.items.map((a) => ({ value: a.slug, label: a.name }))}
              />
              <TextArea className="span-all" label="Footer text" value={s.footerAbout} onChange={site("footerAbout")} rows={2} />
              <TextField className="span-2" label="Copyright line" value={s.copyright} onChange={site("copyright")} />
            </div>
          </Panel>
        </>
      )}

      {tab === "Home page" && (
        <>
          <Panel title="Hero">
            <div className="a-grid">
              <SelectField label="Featured guide" value={h.heroGuideSlug} onChange={home("heroGuideSlug")} options={guides.items.map((g) => ({ value: g.slug, label: g.title }))} />
              <SelectField label="Second button (review)" value={h.heroSecondaryProductSlug} onChange={home("heroSecondaryProductSlug")} options={products.items.map((p) => ({ value: p.slug, label: p.name }))} />
              <TextArea className="span-all" label="Hero intro" value={h.heroIntro} onChange={home("heroIntro")} rows={2} hint="Leave empty to use the guide's intro." />
            </div>
          </Panel>
          <Panel title="Latest buying guides">
            <Field label="Guides on the home page" hint="Tick the guides to show; they appear in the order listed in the box below.">
              <div className="a-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8 }}>
                {guides.items.map((g) => (
                  <Checkbox
                    key={g.id}
                    label={g.title}
                    value={h.guideSlugs.includes(g.slug)}
                    onChange={(on) => home("guideSlugs")(on ? [...h.guideSlugs, g.slug] : h.guideSlugs.filter((x) => x !== g.slug))}
                  />
                ))}
              </div>
            </Field>
            <LinesField key={h.guideSlugs.join(",")} label="Order (guide slugs)" value={h.guideSlugs} onChange={home("guideSlugs")} rows={6} hint="One slug per line; reorder lines to change the order." />
          </Panel>
          <Panel title="Trust facts band">
            <ObjectList itemLabel="Fact" value={h.trustFacts} onChange={home("trustFacts")} fields={[{ key: "value", label: "Value", type: "text" }, { key: "label", label: "Label", type: "text" }]} />
          </Panel>
          <Panel title="How we test block">
            <TextField label="Title" value={h.testTitle} onChange={home("testTitle")} />
            <TextArea label="Text" value={h.testText} onChange={home("testText")} rows={3} />
            <span className="small">The steps come from the “How we test” tab.</span>
          </Panel>
        </>
      )}

      {tab === "How we test" && (
        <>
          <Panel title="Page intro">
            <TextField label="Title" value={m.title} onChange={method("title")} />
            <TextArea label="Lead" value={m.lead} onChange={method("lead")} rows={3} />
            <ImageField label="Photo" value={m.image} onChange={method("image")} />
          </Panel>
          <Panel title="Test steps">
            <ObjectList itemLabel="Step" value={m.steps} onChange={method("steps")} fields={[{ key: "n", label: "Number", type: "text" }, { key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }]} />
          </Panel>
          <Panel title="Score weighting">
            <TextArea label="Intro" value={m.weightsIntro} onChange={method("weightsIntro")} rows={2} />
            <ObjectList itemLabel="Weight" value={m.weights} onChange={method("weights")} fields={[{ key: "label", label: "Criterion", type: "text" }, { key: "pct", label: "Weight (%)", type: "number" }]} />
          </Panel>
          <Panel title="Principles">
            <ObjectList itemLabel="Principle" value={m.principles} onChange={method("principles")} fields={[{ key: "title", label: "Title", type: "text" }, { key: "href", label: "Link", type: "text" }, { key: "text", label: "Text", type: "textarea" }]} />
          </Panel>
        </>
      )}

      <SaveBar saving={saving} error={error} notice={notice} onSave={save} viewHref={tab === "Home page" ? "/" : tab === "How we test" ? "/how-we-test" : "/"} />
    </div>
  );
}
