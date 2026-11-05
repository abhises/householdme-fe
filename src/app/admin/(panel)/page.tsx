"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi, errorText } from "@/lib/admin-api";

type Stats = {
  counts: Record<"guides" | "products" | "categories" | "authors" | "deals" | "subscribers" | "media" | "infoPages", number>;
  recentGuides: { id: string; title: string; slug: string; updatedAt: string }[];
  recentSubscribers: { id: string; email: string; source: string | null; createdAt: string }[];
  storage: "local" | "s3";
};

const GLANCE: [keyof Stats["counts"], string, string][] = [
  ["guides", "Buying guides", "/admin/guides"],
  ["products", "Product reviews", "/admin/products"],
  ["deals", "Active deals", "/admin/deals"],
  ["infoPages", "Pages", "/admin/info-pages"],
  ["media", "Media files", "/admin/media"],
  ["categories", "Categories", "/admin/categories"],
  ["authors", "Authors", "/admin/authors"],
  ["subscribers", "Subscribers", "/admin/subscribers"],
];

const when = (d: string) =>
  new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi<Stats>("/stats").then(setStats).catch((e) => setError(errorText(e)));
  }, []);

  return (
    <>
      <div className="ad-head">
        <h1>Dashboard</h1>
      </div>
      {error && <p className="ad-error">{error}</p>}
      <div className="ad-dash">
        <section className="ad-panel">
          <h2>At a glance</h2>
          {!stats ? (
            <p className="ad-hint">Loading…</p>
          ) : (
            <ul className="ad-glance">
              {GLANCE.map(([key, label, href]) => (
                <li key={key}>
                  <Link href={href}>
                    <b>{stats.counts[key]}</b> {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {stats && (
            <p className="ad-hint">
              Uploads are stored {stats.storage === "s3" ? "in the S3 bucket" : "on the server's disk"}.
            </p>
          )}
        </section>

        <section className="ad-panel">
          <h2>Create</h2>
          <div className="ad-quick">
            <Link className="ad-btn ad-btn--primary" href="/admin/guides/new">+ Buying guide</Link>
            <Link className="ad-btn" href="/admin/products">+ Product review</Link>
            <Link className="ad-btn" href="/admin/deals">+ Deal</Link>
            <Link className="ad-btn" href="/admin/info-pages">+ Page</Link>
            <Link className="ad-btn" href="/admin/media">Upload media</Link>
          </div>
          <p className="ad-hint">
            Product reviews belong to a buying guide, so create the guide first.
          </p>
        </section>

        <section className="ad-panel">
          <h2>Recently updated posts</h2>
          {!stats ? (
            <p className="ad-hint">Loading…</p>
          ) : stats.recentGuides.length === 0 ? (
            <p className="ad-hint">Nothing yet. <Link href="/admin/guides/new">Write your first guide</Link>.</p>
          ) : (
            <ul className="ad-activity">
              {stats.recentGuides.map((g) => (
                <li key={g.id}>
                  <span className="ad-hint">{when(g.updatedAt)}</span>
                  <Link href={`/admin/guides/${g.id}`}>{g.title}</Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/guides" className="ad-more">All buying guides →</Link>
        </section>

        <section className="ad-panel">
          <h2>New subscribers</h2>
          {!stats ? (
            <p className="ad-hint">Loading…</p>
          ) : stats.recentSubscribers.length === 0 ? (
            <p className="ad-hint">No subscribers yet.</p>
          ) : (
            <ul className="ad-activity">
              {stats.recentSubscribers.map((s) => (
                <li key={s.id}>
                  <span className="ad-hint">{when(s.createdAt)}</span>
                  <span>{s.email}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/subscribers" className="ad-more">All subscribers →</Link>
        </section>
      </div>
    </>
  );
}
