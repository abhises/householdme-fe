"use client";

import { useParams } from "next/navigation";
import { Checkbox, LinesField, NumberField, ObjectList, SlugField, TextArea, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/media";
import { Loading, PageHeader, Panel, SaveBar, useRecord } from "@/components/admin/ui";
import type { Author } from "@/lib/types";

const blank = {
  slug: "",
  name: "",
  role: "",
  short: "",
  bio: "",
  trust: "",
  imageUrl: null,
  facts: [],
  expertise: [],
  career: [],
  onTeam: true,
  isTester: true,
  sortOrder: 0,
} as unknown as Author;

export default function AuthorEdit() {
  const { id } = useParams<{ id: string }>();
  const r = useRecord<Author>("authors", id, blank, "/admin/authors");
  const v = r.value;
  if (!r.loaded) return <Loading error={r.error} />;
  return (
    <div key={r.version} className="stack" style={{ gap: 24 }}>
      <PageHeader title={r.isNew ? "New author" : v.name} />
      <Panel title="Profile">
        <div className="a-grid">
          <TextField label="Name" value={v.name} onChange={r.set("name")} />
          <SlugField label="Slug" value={v.slug} onChange={r.set("slug")} source={v.name} />
          <TextField label="Role" value={v.role} onChange={r.set("role")} placeholder="Senior home appliance tester" />
          <NumberField label="Sort order" value={v.sortOrder} onChange={r.set("sortOrder")} />
          <ImageField className="span-all" label="Portrait" value={v.imageUrl} onChange={r.set("imageUrl")} />
          <TextArea className="span-all" label="Short bio" value={v.short} onChange={r.set("short")} rows={2} hint="One sentence for cards." />
          <TextArea className="span-all" label="Full bio" value={v.bio} onChange={r.set("bio")} rows={5} />
          <TextArea className="span-all" label="Trust statement" value={v.trust} onChange={r.set("trust")} rows={2} hint='Opens the "Why you can trust us" box on this author&apos;s guides.' />
          <Checkbox label="Show on the editorial team pages" value={v.onTeam} onChange={r.set("onTeam")} />
          <Checkbox label='Show under "Our testers" on the home page' value={v.isTester} onChange={r.set("isTester")} />
        </div>
      </Panel>
      <Panel title="Facts, expertise and background">
        <ObjectList label="Key facts" itemLabel="Fact" value={v.facts} onChange={r.set("facts")} fields={[{ key: "value", label: "Value", type: "text" }, { key: "label", label: "Label", type: "text" }]} />
        <LinesField label="Expertise" value={v.expertise} onChange={r.set("expertise")} />
        <ObjectList label="Career" itemLabel="Entry" value={v.career} onChange={r.set("career")} fields={[{ key: "year", label: "Years", type: "text" }, { key: "text", label: "Description", type: "text" }]} />
      </Panel>
      <SaveBar
        saving={r.saving}
        error={r.error}
        notice={r.notice}
        onSave={() =>
          r.save(({ slug, name, role, short, bio, trust, imageUrl, facts, expertise, career, onTeam, isTester, sortOrder }) => ({
            slug, name, role, short, bio, trust, imageUrl, facts, expertise, career, onTeam, isTester, sortOrder,
          }))
        }
        onDelete={r.isNew ? undefined : () => r.remove(v.name)}
        viewHref={r.isNew ? null : `/author/${v.slug}`}
      />
    </div>
  );
}
