import Link from "next/link";
import { GuideCardItem, NewsletterBand } from "@/components/site/bits";
import { Photo } from "@/components/site/Photo";
import { api } from "@/lib/api";
import type { AuthorCard, GuideCard, HomeSettings, MethodSettings } from "@/lib/types";

interface HomeData {
  home: HomeSettings;
  steps: MethodSettings["steps"];
  hero: GuideCard | null;
  heroSecondary: { slug: string; name: string } | null;
  guides: GuideCard[];
  categories: { slug: string; name: string; _count: { guides: number } }[];
  testers: AuthorCard[];
}

export default async function HomePage() {
  const { home, steps, hero, heroSecondary, guides, categories, testers } = await api<HomeData>("/home");

  return (
    <div>
      {hero && (
        <section className="wrap" style={{ paddingTop: 36, paddingBottom: 52, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))", gap: 36, alignItems: "center" }}>
          <div className="stack" style={{ gap: 20 }}>
            <Link href={`/category/${hero.category.slug}`} className="tag-blue">
              Buying guide · {hero.category.name}
            </Link>
            <h1 className="h1" style={{ fontSize: "clamp(36px,5.6vw,68px)" }}>
              <Link href={`/${hero.slug}`} className="nolink">
                {hero.title}
              </Link>
            </h1>
            <p className="lead">{home.heroIntro || hero.intro}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--muted)" }}>
              <Photo round src={hero.author.imageUrl} alt={hero.author.name} style={{ width: 44, height: 44 }} />
              <div style={{ lineHeight: 1.4 }}>
                <Link href={`/author/${hero.author.slug}`} style={{ fontWeight: 700 }}>
                  {hero.author.name}
                </Link>
                , {hero.author.role.toLowerCase()}
                <br />
                Updated {hero.updatedLabel}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href={`/${hero.slug}`} className="btn btn-dark">
                Read the buying guide
              </Link>
              {heroSecondary && (
                <Link href={`/review/${heroSecondary.slug}`} className="btn btn-outline">
                  {heroSecondary.name} review
                </Link>
              )}
            </div>
          </div>
          <Link href={`/${hero.slug}`} className="nolink" style={{ display: "block" }}>
            <Photo src={hero.heroImage ?? hero.coverImage} alt={hero.title} label="Drop a test photo here" style={{ aspectRatio: "4/3" }}>
              <div style={{ position: "absolute", right: 0, top: 0, background: "var(--sky)", padding: "12px 16px", display: "flex", flexDirection: "column", color: "var(--ink)", fontFamily: "var(--font)", zIndex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tested</span>
                <span style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{hero.modelsTested}</span>
              </div>
            </Photo>
          </Link>
        </section>
      )}

      <section className="dark-band">
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))" }}>
          {home.trustFacts.map((f, i) => (
            <div key={i} className="stack" style={{ padding: "24px 20px 24px 0", gap: 6 }}>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--sky)" }}>{f.value}</div>
              <div style={{ fontSize: 14, color: "var(--on-dark)", lineHeight: 1.45 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap stack" style={{ paddingTop: 52, paddingBottom: 52, gap: 28 }}>
        <div className="section-head">
          <h2 className="h2">Latest buying guides</h2>
          <Link href="/search">All buying guides →</Link>
        </div>
        <div className="grid-cards">
          {guides.map((g) => (
            <GuideCardItem key={g.slug} g={g} />
          ))}
        </div>
      </section>

      <section className="wrap stack" style={{ paddingBottom: 52, gap: 20 }}>
        <h2 className="h2 h2-rule">Categories</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,170px),1fr))", gap: 12 }}>
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat-tile">
              {c.name}
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {c._count.guides} {c._count.guides === 1 ? "guide" : "guides"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sky-band">
        <div className="wrap" style={{ paddingTop: 52, paddingBottom: 52, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: 36 }}>
          <div className="stack" style={{ gap: 16 }}>
            <span className="eyebrow" style={{ letterSpacing: "0.1em" }}>How we test</span>
            <h2 className="h1" style={{ fontSize: "clamp(30px,4vw,40px)", lineHeight: 1 }}>{home.testTitle}</h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, margin: 0 }}>{home.testText}</p>
            <Link href="/how-we-test" className="btn btn-dark" style={{ alignSelf: "flex-start" }}>
              Read our test method
            </Link>
          </div>
          <ol className="stack" style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {steps.map((s) => (
              <li key={s.n} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 12, padding: "16px 0", borderTop: "2px solid var(--ink)" }}>
                <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{s.n}</span>
                <span className="stack" style={{ gap: 4 }}>
                  <strong style={{ fontSize: 17, fontWeight: 800 }}>{s.title}</strong>
                  <span style={{ fontSize: 15, lineHeight: 1.5 }}>{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap stack" style={{ paddingTop: 52, paddingBottom: 52, gap: 24 }}>
        <div className="section-head">
          <h2 className="h2">Our testers</h2>
          <Link href="/team">Full editorial team →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 28 }}>
          {testers.map((a) => (
            <Link key={a.slug} href={`/author/${a.slug}`} className="nolink" style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 16, alignItems: "start" }}>
              <Photo round src={a.imageUrl} alt={a.name} style={{ width: 72, height: 72 }} />
              <div className="stack" style={{ gap: 6 }}>
                <strong style={{ fontSize: 18, fontWeight: 800 }}>{a.name}</strong>
                <span style={{ fontSize: 14, color: "var(--blue-dark)", fontWeight: 700 }}>{a.role}</span>
                <span style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{a.short}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 60 }}>
        <NewsletterBand title="One email a week with our latest test results" text="Plus deals we've checked ourselves. Unsubscribe anytime." source="home" />
      </section>
    </div>
  );
}
