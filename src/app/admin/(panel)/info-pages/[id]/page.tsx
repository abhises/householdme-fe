"use client";

import { useParams } from "next/navigation";
import { NumberField, ObjectList, SlugField, TextArea, TextField } from "@/components/admin/fields";
import { Loading, PageHeader, Panel, SaveBar, useRecord } from "@/components/admin/ui";
import type { InfoPage } from "@/lib/types";

const blank = { slug: "", title: "", lead: "", sections: [], sortOrder: 0 } as unknown as InfoPage;

export default function InfoPageEdit() {
  const { id } = useParams<{ id: string }>();
  const r = useRecord<InfoPage>("info-pages", id, blank, "/admin/info-pages");
  const v = r.value;
  if (!r.loaded) return <Loading error={r.error} />;
  return (
    <div key={r.version} className="stack" style={{ gap: 24 }}>
      <PageHeader title={r.isNew ? "New info page" : v.title} />
      <Panel title="Page">
        <div className="a-grid">
          <TextField label="Title" value={v.title} onChange={r.set("title")} />
          <SlugField label="Slug" value={v.slug} onChange={r.set("slug")} source={v.title} />
          <NumberField label="Sort order" value={v.sortOrder} onChange={r.set("sortOrder")} />
          <TextArea className="span-all" label="Lead" value={v.lead} onChange={r.set("lead")} rows={2} />
        </div>
        <ObjectList label="Sections" itemLabel="Section" value={v.sections} onChange={r.set("sections")} fields={[{ key: "heading", label: "Heading", type: "text", wide: true }, { key: "body", label: "Text", type: "textarea" }]} />
      </Panel>
      <SaveBar
        saving={r.saving}
        error={r.error}
        notice={r.notice}
        onSave={() => r.save(({ slug, title, lead, sections, sortOrder }) => ({ slug, title, lead, sections, sortOrder }))}
        onDelete={r.isNew ? undefined : () => r.remove(v.title)}
        viewHref={r.isNew ? null : `/info/${v.slug}`}
      />
    </div>
  );
}
