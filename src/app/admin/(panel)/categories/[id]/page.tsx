"use client";

import { useParams } from "next/navigation";
import { NumberField, SlugField, TextArea, TextField } from "@/components/admin/fields";
import { Loading, PageHeader, Panel, SaveBar, useRecord } from "@/components/admin/ui";
import type { Category } from "@/lib/types";

const blank = { slug: "", name: "", intro: "", sortOrder: 0 } as unknown as Category;

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>();
  const r = useRecord<Category>("categories", id, blank, "/admin/categories");
  const v = r.value;
  if (!r.loaded) return <Loading error={r.error} />;
  return (
    <>
      <PageHeader title={r.isNew ? "New category" : v.name} subtitle="Categories group buying guides." />
      <Panel title="Category">
        <div className="a-grid">
          <TextField label="Name" value={v.name} onChange={r.set("name")} />
          <SlugField label="Slug" value={v.slug} onChange={r.set("slug")} source={v.name} />
          <NumberField label="Sort order" value={v.sortOrder} onChange={r.set("sortOrder")} hint="Lower numbers come first." />
          <TextArea className="span-all" label="Intro" value={v.intro} onChange={r.set("intro")} rows={3} hint="Shown at the top of the category page." />
        </div>
      </Panel>
      <SaveBar
        saving={r.saving}
        error={r.error}
        notice={r.notice}
        onSave={() => r.save(({ slug, name, intro, sortOrder }) => ({ slug, name, intro, sortOrder }))}
        onDelete={r.isNew ? undefined : () => r.remove(v.name)}
        viewHref={r.isNew ? null : `/category/${v.slug}`}
      />
    </>
  );
}
