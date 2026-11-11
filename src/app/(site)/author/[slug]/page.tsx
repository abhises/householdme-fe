import type { Metadata } from "next";
import Link from "next/link";
import { SocialIcons } from "@/components/site/bits";
import { Photo } from "@/components/site/Photo";
import { api } from "@/lib/api";
import { firstName } from "@/lib/format";
import type { Author, Guide } from "@/lib/types";

interface AuthorData {
  author: Author;
  guides: (Guide & { products: { slug: string; name: string; images: string[] }[] })[];
  isReviewer: boolean;
}

export async function generateMetadata({ params }: PageProps<"/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { author } = await api<AuthorData>(`/authors/${slug}`);
  return { title: author.name, description: author.short };
}

export default async function AuthorPage({ params }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const { author: a, guides, isReviewer } = await api<AuthorData>(`/authors/${slug}`);
  const first = firstName(a.name);
  const email = `${a.slug}@householdme.com`;
  const articles = isReviewer
    ? guides.map((g) => ({ key: g.slug, img: g.coverImage, type: "Fact-checked", title: g.title, date: `Updated ${g.updatedLabel}`, href: `/${g.slug}` }))
    : guides.flatMap((g) => [
        { key: g.slug, img: g.coverImage, type: "Buying guide", title: g.title, date: `Updated ${g.updatedLabel}`, href: `/${g.slug}` },
        ...(g.products[0]
          ? [{ key: g.products[0].slug, img: g.products[0].images[0] ?? null, type: "Review", title: `${g.products[0].name} review`, date: g.updatedLabel, href: `/review/${g.products[0].slug}` }]
          : []),
      ]);

  return (
    <div>
      <section className="dark-band on-dark">
        <div className="wrap" style={{ paddingTop: 44, paddingBottom: 44, display: "flex", flexWrap: "wrap", gap: 36, alignItems: "center" }}>
          <Photo
            src={a.imageUrl}
            alt={a.name}
            label={<>portrait photo {a.name}</>}
            style={{ flex: "0 1 280px", aspectRatio: "1", maxWidth: 300, width: "100%", background: "repeating-linear-gradient(135deg,#2a2a2d 0 10px,#232326 10px 20px)", color: "#a3a39c" }}
          />
          <div className="stack" style={{ flex: "2 1 400px", gap: 16 }}>
            <Link href="/team" className="tag-sky">Editorial team</Link>
            <h1 className="h1" style={{ fontSize: "clamp(38px,5.6vw,64px)" }}>{a.name}</h1>
            <p style={{ margin: 0, fontSize: 18, color: "var(--blue)", fontWeight: 700 }}>{a.role}</p>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: "#e6e6df", maxWidth: 640 }}>{a.bio}</p>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14, fontWeight: 700 }}>
              <a href={`mailto:${email}`} style={{ color: "#fff" }}>{email}</a>
              <Link href="/info/contact" style={{ color: "#fff" }}>Contact the editors</Link>
            </div>
            <SocialIcons linkedin={a.linkedinUrl} youtube={a.youtubeUrl} />
          </div>
        </div>
      </section>

      {a.facts.length > 0 && (
        <section className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", borderBottom: "3px solid var(--ink)" }}>
            {a.facts.map((f, i) => (
              <div key={i} className="stack" style={{ padding: "22px 20px 22px 0", gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em" }}>{f.value}</span>
                <span style={{ fontSize: 14, color: "var(--muted)" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="wrap" style={{ paddingTop: 44, paddingBottom: 64, display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
        <div className="stack" style={{ flex: "1 1 280px", gap: 24 }}>
          {a.expertise.length > 0 && (
            <div className="stack" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900 }}>Expertise</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {a.expertise.map((e) => <span key={e} style={{ border: "2px solid var(--ink)", padding: "6px 10px", fontSize: 13, fontWeight: 700 }}>{e}</span>)}
              </div>
            </div>
          )}
          {a.career.length > 0 && (
            <div className="stack" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900 }}>Background</h2>
              {a.career.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 10, fontSize: 14, lineHeight: 1.5, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--muted)", paddingTop: 2 }}>{c.year}</span>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          )}
          <div className="sky-band stack" style={{ padding: 20, gap: 8 }}>
            <strong style={{ fontSize: 16, fontWeight: 900 }}>Independence</strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{first} has no financial ties to manufacturers or retailers, accepts no gifts and returns loaned test units.</p>
            <Link href="/info/guidelines" style={{ fontSize: 14, fontWeight: 700, textDecorationColor: "var(--ink)" }}>Editorial guidelines</Link>
          </div>
        </div>
        <div className="stack" style={{ flex: "2 1 460px", minWidth: 0, gap: 20 }}>
          <h2 className="h2 h2-rule">{isReviewer ? `Fact-checked by ${first}` : `Articles by ${first}`}</h2>
          {articles.length === 0 && <p className="lead">No articles yet.</p>}
          {articles.map((x) => (
            <Link key={x.type + x.key} href={x.href} className="nolink" style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 16, alignItems: "start", borderBottom: "1px solid var(--line)", paddingBottom: 18 }}>
              <Photo src={x.img} alt="" style={{ aspectRatio: "3/2", padding: 0 }} />
              <div className="stack" style={{ gap: 6 }}>
                <span className="eyebrow eyebrow-blue">{x.type}</span>
                <strong style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{x.title}</strong>
                <span className="small">{x.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
