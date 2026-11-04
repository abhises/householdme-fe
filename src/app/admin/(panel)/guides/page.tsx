"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { PageHeader, ResourceTable, useList } from "@/components/admin/ui";
import type { Category, Guide } from "@/lib/types";

type Row = Guide & { category: { name: string }; author: { name: string }; products: { id: string }[] };

export default function GuidesPage() {
  const cats = useList<Category>("/categories");
  const [cat, setCat] = useState("");
  return (
    <>
      <PageHeader
        title="Buying guides"
        subtitle="Each guide has up to three picks (products) and optional long-form sections."
        actions={
          <>
            <select className="a-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {cats.items.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Link href="/admin/guides/new" className="a-btn primary">+ New guide</Link>
          </>
        }
      />
      <ResourceTable<Row>
        resource="guides"
        query={cat ? `categoryId=${cat}` : ""}
        editHref={(g) => `/admin/guides/${g.id}`}
        columns={[
          { label: "", width: 64, render: (g) => (g.coverImage ? <img src={g.coverImage} alt="" className="a-thumb" /> : <span className="a-thumb" />) },
          {
            label: "Title",
            render: (g) => (
              <div className="stack" style={{ gap: 2 }}>
                <Link href={`/admin/guides/${g.id}`} style={{ fontWeight: 700 }}>{g.title}</Link>
                <span className="mono small">/guide/{g.slug}</span>
              </div>
            ),
          },
          { label: "Category", render: (g) => g.category?.name },
          { label: "Author", render: (g) => g.author?.name },
          { label: "Picks", render: (g) => g.products?.length ?? 0 },
          {
            label: "Status",
            render: (g) => (
              <span style={{ display: "inline-flex", gap: 4 }}>
                {g.published ? <span className="a-badge green">Published</span> : <span className="a-badge gray">Draft</span>}
                {g.full && <span className="a-badge blue">Long-form</span>}
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
