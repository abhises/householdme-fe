"use client";

import Link from "next/link";
import { PageHeader, ResourceTable } from "@/components/admin/ui";
import { usd } from "@/lib/format";
import type { Deal } from "@/lib/types";

export default function DealsAdmin() {
  return (
    <>
      <PageHeader title="Deals" subtitle="Price drops shown on /deals. The current price comes from the product." actions={<Link href="/admin/deals/new" className="a-btn primary">+ New deal</Link>} />
      <ResourceTable<Deal>
        resource="deals"
        searchable={false}
        editHref={(d) => `/admin/deals/${d.id}`}
        deleteLabel={(d) => `the deal on ${d.product.name}`}
        columns={[
          { label: "Order", width: 70, render: (d) => d.sortOrder },
          { label: "Product", render: (d) => <Link href={`/admin/deals/${d.id}`} style={{ fontWeight: 700 }}>{d.product.name}</Link> },
          { label: "Was", render: (d) => usd(d.wasPrice) },
          { label: "Now", render: (d) => usd(d.product.price) },
          { label: "Off", render: (d) => (d.wasPrice ? `${Math.round((1 - d.product.price / d.wasPrice) * 100)}%` : "–") },
          { label: "Status", render: (d) => (d.active ? <span className="a-badge green">Active</span> : <span className="a-badge gray">Hidden</span>) },
        ]}
      />
    </>
  );
}
