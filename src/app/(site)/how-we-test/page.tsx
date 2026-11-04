import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/site/Photo";
import { api } from "@/lib/api";
import type { AuthorCard, MethodSettings } from "@/lib/types";

export const metadata: Metadata = { title: "How we test" };

export default async function MethodPage() {
  const { method: m, team } = await api<{ method: MethodSettings; team: AuthorCard[] }>("/method");
  return (
    <div>
      <section className="wrap" style={{ paddingTop: 44, paddingBottom: 52, display: "flex", flexWrap: "wrap", gap: "32px 48px", alignItems: "center" }}>
        <div className="stack" style={{ flex: "2 1 520px", minWidth: 0, gap: 18 }}>
          <span className="tag-blue">About us</span>
          <h1 className="h1" style={{ fontSize: "clamp(38px,6vw,76px)", lineHeight: 0.96, letterSpacing: "-0.04em", maxWidth: 960 }}>{m.title}</h1>
          <p className="lead" style={{ fontSize: 19, maxWidth: 720 }}>{m.lead}</p>
        </div>
        <Photo src={m.image} alt="Our test house" label="photo: our test house" style={{ flex: "1 1 300px", maxWidth: 440, width: "100%", aspectRatio: "4/3" }} />
      </section>

      <section className="dark-band">
        <div className="wrap stack" style={{ paddingTop: 52, paddingBottom: 52, gap: 28 }}>
          <h2 className="h2" style={{ fontSize: "clamp(28px,4vw,36px)" }}>Our test method in {m.steps.length} steps</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 24 }}>
            {m.steps.map((s) => (
              <div key={s.n} className="stack" style={{ borderTop: "4px solid var(--blue)", paddingTop: 16, gap: 8 }}>
                <span className="mono" style={{ fontSize: 14, color: "var(--sky)" }}>{s.n}</span>
                <strong style={{ fontSize: 20, fontWeight: 800 }}>{s.title}</strong>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--on-dark)" }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 52, paddingBottom: 52, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 40 }}>
        <div className="stack" style={{ gap: 14 }}>
          <h2 className="h2">How a test score is built</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "var(--body)" }}>{m.weightsIntro}</p>
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {m.weights.map((w) => (
            <div key={w.label} style={{ display: "grid", gridTemplateColumns: "minmax(0,150px) 1fr 44px", gap: 12, alignItems: "center", fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>{w.label}</span>
              <span style={{ height: 12, background: "var(--line)", display: "block" }}><span style={{ display: "block", height: 12, background: "var(--blue)", width: `${w.pct}%` }} /></span>
              <span className="mono" style={{ fontWeight: 600, textAlign: "right" }}>{w.pct}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sky-band">
        <div className="wrap" style={{ paddingTop: 52, paddingBottom: 52, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 32 }}>
          {m.principles.map((p) => (
            <div key={p.title} className="stack" style={{ gap: 10, borderTop: "3px solid var(--ink)", paddingTop: 16 }}>
              <h3 style={{ fontSize: 22, margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>{p.title}</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{p.text}</p>
              <Link href={p.href} style={{ fontSize: 14, fontWeight: 700, textDecorationColor: "var(--ink)" }}>Read more</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap stack" style={{ paddingTop: 52, paddingBottom: 64, gap: 24 }}>
        <div className="section-head">
          <h2 className="h2">The editorial team</h2>
          <Link href="/team">All profiles →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 24 }}>
          {team.map((t) => (
            <Link key={t.slug} href={`/author/${t.slug}`} className="nolink stack" style={{ gap: 8 }}>
              <Photo src={t.imageUrl} alt={t.name} style={{ aspectRatio: "1", padding: 0 }} />
              <strong style={{ fontSize: 17, fontWeight: 800 }}>{t.name}</strong>
              <span style={{ fontSize: 14, color: "var(--blue-dark)", fontWeight: 700, marginTop: -4 }}>{t.role}</span>
            </Link>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
          Spotted something wrong? Read our <Link href="/info/corrections">corrections policy</Link>.
        </p>
      </section>
    </div>
  );
}
