"use client";

import { PageHeader, ResourceTable } from "@/components/admin/ui";
import type { Subscriber } from "@/lib/types";

export default function SubscribersPage() {
  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        subtitle="Collected from the newsletter forms, price alerts and the popup."
        actions={<a href="/api/admin/subscribers/export.csv" className="a-btn">Export CSV</a>}
      />
      <ResourceTable<Subscriber>
        resource="subscribers"
        emptyText="No subscribers yet."
        deleteLabel={(s) => s.email}
        columns={[
          { label: "Email", render: (s) => <strong>{s.email}</strong> },
          { label: "Source", render: (s) => (s.source ? <span className="a-badge">{s.source}</span> : <span className="small">–</span>) },
          { label: "Subscribed", render: (s) => new Date(s.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
        ]}
      />
    </>
  );
}
