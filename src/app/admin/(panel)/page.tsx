"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loading, PageHeader, Panel } from "@/components/admin/ui";
import { adminApi, errorText } from "@/lib/admin-api";

interface Stats {
  counts: Record<"guides" | "products" | "categories" | "authors" | "deals" | "subscribers" | "media" | "infoPages", number>;
  recentGuides: { id: string; title: string; slug: string; updatedAt: string }[];
  recentSubscribers: { id: string; email: string; createdAt: string }[];
  storage: string;
}

const TILES: [keyof Stats["counts"], string, string][] = [
  ["guides", "Buying guides", "/admin/guides"],
  ["products", "Products & reviews", "/admin/products"],
  ["categories", "Categories", "/admin/categories"],
  ["authors", "Authors", "/admin/authors"],
  ["deals", "Active deals", "/admin/deals"],
  ["infoPages", "Info pages", "/admin/info-pages"],
  ["media", "Media files", "/admin/media"],
  ["subscribers", "Subscribers", "/admin/subscribers"],
];

const when = (d: string) => new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    adminApi<Stats>("/stats").then(setStats).catch((e) => setError(errorText(e)));
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={stats ? `File storage: ${stats.storage === "s3" ? "Amazon S3" : "local disk"}` : undefined}
        actions={
          <>
            <Link href="/admin/guides/new" className="a-btn primary">+ New buying guide</Link>
            <Link href="/admin/products/new" className="a-btn">+ New product</Link>
          </>
        }
      />
      {!stats ? (
        <Loading error={error} />
      ) : (
        <>
          <div className="stat-grid">
            {TILES.map(([k, label, href]) => (
              <Link key={k} href={href} className="stat">
                <b>{stats.counts[k]}</b>
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))" }}>
            <Panel title="Recently updated guides">
              {stats.recentGuides.map((g) => (
                <div key={g.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
                  <Link href={`/admin/guides/${g.id}`} style={{ fontWeight: 700 }}>{g.title}</Link>
                  <span className="small" style={{ whiteSpace: "nowrap" }}>{when(g.updatedAt)}</span>
                </div>
              ))}
            </Panel>
            <Panel title="Newest subscribers" actions={<Link href="/admin/subscribers" className="a-btn sm">All</Link>}>
              {stats.recentSubscribers.length === 0 && <span className="small">No subscribers yet.</span>}
              {stats.recentSubscribers.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
                  <span>{s.email}</span>
                  <span className="small" style={{ whiteSpace: "nowrap" }}>{when(s.createdAt)}</span>
                </div>
              ))}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
