import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Search" };

interface SearchData {
  q: string;
  results: { type: string; title: string; meta: string; href: string }[];
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const { results } = await api<SearchData>(`/search?q=${encodeURIComponent(q)}`);
  return (
    <div className="stack" style={{ maxWidth: 900, margin: "0 auto", padding: "36px 20px 64px", gap: 24 }}>
      <h1 className="h1" style={{ fontSize: "clamp(36px,5vw,56px)" }}>Search</h1>
      <form action="/search" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          autoFocus
          aria-label="Search"
          placeholder="For example: air fryer, mattress, Sarah"
          style={{ border: "3px solid var(--ink)", padding: "16px 18px", fontWeight: 500, fontSize: 18, background: "#fff", outline: "none", width: "100%" }}
        />
      </form>
      <span style={{ fontSize: 14, color: "var(--muted)" }}>
        {q ? `${results.length} results for "${q}"` : `All ${results.length} buying guides`}
      </span>
      <div className="stack">
        {results.map((r) => (
          <Link key={r.type + r.href} href={r.href} className="nolink stack row-hover" style={{ gap: 4, padding: "16px 0", borderTop: "1px solid var(--line)" }}>
            <span className="eyebrow eyebrow-blue">{r.type}</span>
            <strong style={{ fontSize: 19, fontWeight: 800 }}>{r.title}</strong>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>{r.meta}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
