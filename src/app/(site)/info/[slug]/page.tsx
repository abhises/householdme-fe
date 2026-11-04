import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { InfoPage } from "@/lib/types";

interface InfoData {
  page: InfoPage;
  links: { slug: string; title: string }[];
}

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await api<InfoData>(`/info/${slug}`);
  return { title: page.title, description: page.lead };
}

export default async function InfoPageView({ params }: PageProps<"/info/[slug]">) {
  const { slug } = await params;
  const { page, links } = await api<InfoData>(`/info/${slug}`);
  const updated = new Date(page.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 64, display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
      <div className="stack" style={{ flex: "2 1 480px", minWidth: 0, maxWidth: 760, gap: 28 }}>
        <nav className="crumbs">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{page.title}</span>
        </nav>
        <h1 className="h1" style={{ fontSize: "clamp(36px,5.6vw,60px)" }}>{page.title}</h1>
        <p className="lead" style={{ fontSize: 19 }}>{page.lead}</p>
        {page.sections.map((s, i) => (
          <section key={i} className="stack" style={{ gap: 10, borderTop: "2px solid var(--ink)", paddingTop: 18 }}>
            <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900 }}>{s.heading}</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "var(--ink-2)", whiteSpace: "pre-line" }}>{s.body}</p>
          </section>
        ))}
        <p className="note" style={{ fontSize: 13 }}>Last updated: {updated}</p>
      </div>
      <aside className="stack" style={{ flex: "1 1 240px", maxWidth: 320, gap: 10, border: "2px solid var(--ink)", padding: 20 }}>
        <strong className="eyebrow" style={{ letterSpacing: "0.1em" }}>Transparency</strong>
        {links.map((l) => (
          <Link key={l.slug} href={`/info/${l.slug}`} style={{ fontSize: 15, fontWeight: 600 }}>{l.title}</Link>
        ))}
        <Link href="/how-we-test" style={{ fontSize: 15, fontWeight: 600 }}>How we test</Link>
        <Link href="/team" style={{ fontSize: 15, fontWeight: 600 }}>The editorial team</Link>
      </aside>
    </div>
  );
}
