"use client";

import Link from "next/link";
import { PageHeader, ResourceTable } from "@/components/admin/ui";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories" subtitle="Shown in the main navigation, in this order." actions={<Link href="/admin/categories/new" className="a-btn primary">+ New category</Link>} />
      <ResourceTable<Category>
        resource="categories"
        editHref={(c) => `/admin/categories/${c.id}`}
        columns={[
          { label: "Order", render: (c) => c.sortOrder, width: 70 },
          { label: "Name", render: (c) => <Link href={`/admin/categories/${c.id}`} style={{ fontWeight: 700 }}>{c.name}</Link> },
          { label: "Slug", render: (c) => <span className="mono small">{c.slug}</span> },
          { label: "Guides", render: (c) => c._count?.guides ?? 0 },
        ]}
      />
    </>
  );
}
