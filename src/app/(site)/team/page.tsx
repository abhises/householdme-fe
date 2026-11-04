import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/site/Photo";
import { api } from "@/lib/api";
import type { AuthorCard } from "@/lib/types";

export const metadata: Metadata = { title: "The editorial team" };

export default async function TeamPage() {
  const { team } = await api<{ team: AuthorCard[] }>("/team");
  return (
    <div className="wrap stack" style={{ paddingTop: 36, paddingBottom: 64, gap: 36 }}>
      <div className="stack" style={{ gap: 14, maxWidth: 760 }}>
        <h1 className="h1" style={{ fontSize: "clamp(40px,6vw,72px)", lineHeight: 0.96, letterSpacing: "-0.04em" }}>The editorial team</h1>
        <p className="lead">
          {team.length} people test, write and fact-check everything you read on HouseholdMe. Each of them has hands-on experience in the field they write about.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,260px),1fr))", gap: "32px 24px" }}>
        {team.map((t) => (
          <Link key={t.slug} href={`/author/${t.slug}`} className="nolink stack" style={{ gap: 10 }}>
            <Photo src={t.imageUrl} alt={t.name} label="portrait photo" style={{ aspectRatio: "1", background: "repeating-linear-gradient(135deg,#e8e8eb 0 8px,#dcdce0 8px 16px)" }} />
            <strong style={{ fontSize: 20, fontWeight: 900 }}>{t.name}</strong>
            <span style={{ fontSize: 14, color: "var(--blue-dark)", fontWeight: 700, marginTop: -6 }}>{t.role}</span>
            <span style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{t.short}</span>
          </Link>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px 24px", flexWrap: "wrap", fontSize: 15, fontWeight: 700, borderTop: "3px solid var(--ink)", paddingTop: 20 }}>
        <Link href="/how-we-test">How we test</Link>
        <Link href="/info/guidelines">Editorial guidelines</Link>
        <Link href="/info/contact">Contact</Link>
      </div>
    </div>
  );
}
