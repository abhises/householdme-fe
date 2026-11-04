"use client";

import Link from "next/link";
import { PageHeader, ResourceTable } from "@/components/admin/ui";
import type { InfoPage } from "@/lib/types";

export default function InfoPagesPage() {
  return (
    <>
      <PageHeader title="Info pages" subtitle="Transparency pages such as editorial guidelines, privacy and contact." actions={<Link href="/admin/info-pages/new" className="a-btn primary">+ New page</Link>} />
      <ResourceTable<InfoPage>
        resource="info-pages"
        editHref={(p) => `/admin/info-pages/${p.id}`}
        columns={[
          { label: "Title", render: (p) => <Link href={`/admin/info-pages/${p.id}`} style={{ fontWeight: 700 }}>{p.title}</Link> },
          { label: "URL", render: (p) => <span className="mono small">/info/{p.slug}</span> },
          { label: "Sections", render: (p) => p.sections.length },
        ]}
      />
    </>
  );
}
