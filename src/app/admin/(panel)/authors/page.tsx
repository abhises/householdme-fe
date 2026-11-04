"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { PageHeader, ResourceTable } from "@/components/admin/ui";
import type { Author } from "@/lib/types";

export default function AuthorsPage() {
  return (
    <>
      <PageHeader title="Authors" subtitle="Testers and editors shown on guides, reviews and the team page." actions={<Link href="/admin/authors/new" className="a-btn primary">+ New author</Link>} />
      <ResourceTable<Author>
        resource="authors"
        editHref={(a) => `/admin/authors/${a.id}`}
        columns={[
          { label: "", width: 60, render: (a) => (a.imageUrl ? <img src={a.imageUrl} alt="" className="a-thumb" style={{ width: 36, height: 36, borderRadius: "50%" }} /> : null) },
          { label: "Name", render: (a) => <Link href={`/admin/authors/${a.id}`} style={{ fontWeight: 700 }}>{a.name}</Link> },
          { label: "Role", render: (a) => a.role },
          { label: "Guides", render: (a) => a._count?.guides ?? 0 },
          {
            label: "Shown",
            render: (a) => (
              <span style={{ display: "inline-flex", gap: 4 }}>
                {a.onTeam && <span className="a-badge blue">Team</span>}
                {a.isTester && <span className="a-badge green">Tester</span>}
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
