import type { Metadata } from "next";
import Link from "next/link";
import { AuthorRow } from "@/components/site/bits";
import { Photo } from "@/components/site/Photo";
import { api } from "@/lib/api";
import type { AuthorCard, Category, GuideCard } from "@/lib/types";

interface CategoryData {
  category: Category & { guides: GuideCard[] };
  authors: AuthorCard[];
  others: { slug: string; name: string }[];
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await api<CategoryData>(`/categories/${slug}`);
  return { title: category.name, description: category.intro };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const { category: cat, authors, others } = await api<CategoryData>(`/categories/${slug}`);

  return (
    <div className="wrap stack" style={{ paddingTop: 28, paddingBottom: 64, gap: 40 }}>
      <div className="stack" style={{ gap: 14 }}>
        <nav className="crumbs">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{cat.name}</span>
        </nav>
        <h1 className="h1" style={{ fontSize: "clamp(40px,6vw,72px)", lineHeight: 0.96, letterSpacing: "-0.04em" }}>{cat.name}</h1>
        <p className="lead" style={{ maxWidth: 680 }}>{cat.intro}</p>
      </div>

      <div className="stack" style={{ gap: 20 }}>
        <h2 className="h2 h2-rule" style={{ fontSize: 26 }}>Buying guides</h2>
        {cat.guides.length === 0 && <p className="lead">No buying guides in this category yet.</p>}
        {cat.guides.map((g) => (
          <Link key={g.slug} href={`/guide/${g.slug}`} className="nolink" style={{ display: "flex", flexWrap: "wrap", gap: 24, borderBottom: "1px solid var(--line)", paddingBottom: 24 }}>
            <Photo src={g.coverImage} alt={g.title} label={<>own test photo: {g.photoNote}</>} style={{ flex: "1 1 260px", maxWidth: 380, aspectRatio: "3/2" }} />
            <div className="stack" style={{ flex: "2 1 320px", gap: 10 }}>
              <span className="eyebrow eyebrow-blue">
                {g.modelsTested} models tested · {g.testWeeks} weeks
              </span>
              <strong style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{g.title}</strong>
              <span style={{ fontSize: 16, lineHeight: 1.55, color: "var(--body)" }}>{g.intro}</span>
              <span className="small">
                By {g.author.name} · updated {g.updatedLabel}
              </span>
              {g.products[0] && <span style={{ fontSize: 14, fontWeight: 700 }}>Our pick: {g.products[0].name}</span>}
            </div>
          </Link>
        ))}
      </div>

      {authors.length > 0 && (
        <div className="stack" style={{ gap: 16 }}>
          <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900 }}>Tested by</h2>
          {authors.map((a) => (
            <AuthorRow key={a.slug} {...a} />
          ))}
        </div>
      )}

      <div className="stack" style={{ gap: 12 }}>
        <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900 }}>Other categories</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {others.map((o) => (
            <Link key={o.slug} href={`/category/${o.slug}`} className="chip">
              {o.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
