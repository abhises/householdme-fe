import type { Metadata } from "next";
import Link from "next/link";
import { PostEnhancer } from "@/components/site/PostEnhancer";
import { api } from "@/lib/api";
import { CONTACT_PAGE_SLUG, type InfoPage } from "@/lib/types";

interface InfoData {
  page: InfoPage;
  links: { slug: string; title: string }[];
}

const load = async (props: PageProps<"/info/[slug]">) => {
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams]);
  return api<InfoData>(`/info/${slug}`, { preview: sp.preview === "1" });
};

export async function generateMetadata(props: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { page } = await load(props);
  return {
    title: page.seoTitle ? { absolute: page.seoTitle } : page.title,
    description: page.seoDescription || page.lead,
    alternates: { canonical: `/info/${page.slug}` },
    ...(page.coverImage ? { openGraph: { images: [page.coverImage] } } : {}),
    ...(page.published ? {} : { robots: { index: false } }),
  };
}

const linkHref = (slug: string) => (slug === CONTACT_PAGE_SLUG ? "/contact" : `/info/${slug}`);

export default async function InfoPageView(props: PageProps<"/info/[slug]">) {
  const { page, links } = await load(props);
  const extras = (
    <>
      {!page.published && (
        <div style={{ background: "var(--red)", color: "#fff", textAlign: "center", padding: 8, fontSize: 13, fontWeight: 700 }}>Draft preview, not visible to readers</div>
      )}
      {page.css && <style dangerouslySetInnerHTML={{ __html: page.css }} />}
      {page.jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.jsonLd.replace(/</g, "\\u003c") }} />}
    </>
  );

  // Section / HTML pages: rendered exactly as built in the admin, like posts.
  if (page.doc || page.html.trim()) {
    const rootId = `page-${page.id}`;
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-css-tags -- only section/HTML pages need this stylesheet; React hoists it into <head> */}
        <link rel="stylesheet" href="/sections.css" precedence="default" />
        {extras}
        <div id={rootId} className="bq-post" dangerouslySetInnerHTML={{ __html: page.html }} />
        <PostEnhancer rootId={rootId} />
      </>
    );
  }

  // Classic pages: heading + text sections with the transparency links beside them.
  const updated = new Date(page.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return (
    <>
      {extras}
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
            <Link key={l.slug} href={linkHref(l.slug)} style={{ fontSize: 15, fontWeight: 600 }}>{l.title}</Link>
          ))}
          <Link href="/how-we-test" style={{ fontSize: 15, fontWeight: 600 }}>How we test</Link>
          <Link href="/team" style={{ fontSize: 15, fontWeight: 600 }}>The editorial team</Link>
        </aside>
      </div>
    </>
  );
}
