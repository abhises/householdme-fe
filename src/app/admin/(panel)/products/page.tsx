"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { PageHeader, ResourceTable, useList } from "@/components/admin/ui";
import { score, usd } from "@/lib/format";
import type { Guide, Product } from "@/lib/types";

export default function ProductsPage() {
  const guides = useList<Guide>("/guides");
  const [guide, setGuide] = useState("");
  return (
    <>
      <PageHeader
        title="Products & reviews"
        subtitle="Every product belongs to a buying guide and has its own review page."
        actions={
          <>
            <select className="a-select" value={guide} onChange={(e) => setGuide(e.target.value)} aria-label="Filter by guide">
              <option value="">All guides</option>
              {guides.items.map((g) => (
                <option key={g.id} value={g.id}>{g.short}</option>
              ))}
            </select>
            <Link href={`/admin/products/new${guide ? `?guideId=${guide}` : ""}`} className="a-btn primary">+ New product</Link>
          </>
        }
      />
      <ResourceTable<Product>
        resource="products"
        query={guide ? `guideId=${guide}` : ""}
        editHref={(p) => `/admin/products/${p.id}`}
        columns={[
          { label: "", width: 64, render: (p) => (p.images[0] ? <img src={p.images[0]} alt="" className="a-thumb" /> : <span className="a-thumb" />) },
          {
            label: "Product",
            render: (p) => (
              <div className="stack" style={{ gap: 2 }}>
                <Link href={`/admin/products/${p.id}`} style={{ fontWeight: 700 }}>{p.name}</Link>
                <span className="mono small">/review/{p.slug}</span>
              </div>
            ),
          },
          { label: "Guide", render: (p) => p.guide?.short },
          { label: "Label", render: (p) => <span className="a-badge">{p.label}</span> },
          { label: "Score", render: (p) => score(p.score) },
          { label: "Price", render: (p) => usd(p.price) },
          { label: "Helpful", render: (p) => <span className="small">👍 {p.helpfulYes} · 👎 {p.helpfulNo}</span> },
        ]}
      />
    </>
  );
}
