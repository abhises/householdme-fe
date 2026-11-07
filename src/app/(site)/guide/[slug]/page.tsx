import type { Metadata } from "next";
import Link from "next/link";
import { ActiveCategory } from "@/components/site/NavLinks";
import { Faq, PickCard, RichText, SocialIcons, SourcesAndChanges } from "@/components/site/bits";
import { GuideExtras } from "@/components/site/GuideExtras";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { PostView } from "@/components/site/PostView";
import { Photo } from "@/components/site/Photo";
import { api } from "@/lib/api";
import { score, stars, usd } from "@/lib/format";
import type { Author, AuthorCard, Guide, GuideCard, GuideFull, Product, SiteSettings } from "@/lib/types";

interface GuideData {
  guide: Guide & { category: { slug: string; name: string }; author: Author; products: Product[] };
  reviewer: AuthorCard | null;
  related: GuideCard[];
  site: SiteSettings;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { guide } = await api<GuideData>(`/guides/${slug}`, { preview: (await searchParams).preview === "1" });
  const description = guide.seoDescription || guide.intro;
  return {
    title: { absolute: guide.seoTitle || `${guide.title} – HouseholdMe` },
    description,
    robots: guide.published ? undefined : { index: false },
    openGraph: { title: guide.title, description, type: "article", images: guide.coverImage ? [guide.coverImage] : undefined },
  };
}

const num = (v: string) => {
  const m = String(v).match(/[0-9]+(\.[0-9]+)?/g);
  return m ? parseFloat(m[m.length - 1]) : NaN;
};

export default async function GuidePage({ params, searchParams }: PageProps<"/guide/[slug]">) {
  const { slug } = await params;
  const { guide: g, reviewer, related, site } = await api<GuideData>(`/guides/${slug}`, { preview: (await searchParams).preview === "1" });
  // Posts built in the admin with sections or hand-written HTML render as authored
  if (g.sections || g.html.trim()) {
    return (
      <>
        <ActiveCategory slug={g.category.slug} />
        <PostView guide={g} site={site} />
      </>
    );
  }
  const F: GuideFull | null = g.full;
  const a = g.author;
  const picks = g.products;
  const bySlug = new Map(picks.map((p) => [p.slug, p]));
  const links = picks.map((p) => ({ name: p.name, href: p.shops[0]?.url ?? `/review/${p.slug}` }));
  const T = F?.titles ?? {};
  const short = g.short.toLowerCase();
  const top = picks[0];

  const toc: [string, string][] = [
    ...(F ? ([["The short answer", "g-summary"]] as [string, string][]) : []),
    ["Our picks at a glance", "g-picks"],
    ...(F?.compare ? ([["Compare side by side", "g-compare"]] as [string, string][]) : []),
    ["Why you can trust us", "g-trust"],
    ["Who is this for?", "g-who"],
    ["How we tested", "g-how"],
    ["Test results compared", "g-table"],
    ...((F
      ? [
          ["Our picks in depth", "g-deep"],
          ["Results by test", "g-results"],
          ["What to look for", "g-buy"],
          ["How much to spend", "g-tiers"],
          [T.vsToc ?? "Compare types", "g-vs"],
          ["Maintenance", "g-care"],
          ["Not recommended", "g-skip"],
          ["What we’re testing now", "g-next"],
          ["Durability and repair", "g-durable"],
          ["Glossary", "g-gloss"],
        ]
      : []) as [string, string][]),
    ...(g.faq.length ? ([["FAQ", "g-faq"]] as [string, string][]) : []),
    ["Sources and changelog", "g-sources"],
  ];

  const tableHead = g.tableHead ?? ["Model", "Rank", "Test score", "Price from"];
  const tableRows = g.tableRows ?? picks.map((p) => [p.name, p.label, score(p.score), usd(p.price)]);
  const trust = `${a.trust} For this guide we tested ${g.modelsTested} models over ${g.testWeeks} weeks in our test house. ${
    g.bought || "We bought most models ourselves; loaned units were returned after testing."
  } Manufacturers don’t see our conclusions before publication.`;

  // Long-form comparison table
  const cmpCols = (F?.compare?.cols ?? [])
    .map((c) => ({ c, p: bySlug.get(c.product) }))
    .filter((x): x is { c: (typeof x)["c"]; p: Product } => !!x.p);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";
  const jsonLd = F
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              ["Home", `${siteUrl}/`],
              [g.category.name, `${siteUrl}/category/${g.category.slug}`],
              [g.short, `${siteUrl}/guide/${g.slug}`],
            ].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x[0], item: x[1] })),
          },
          { "@type": "Article", headline: g.title, description: g.intro, author: { "@type": "Person", name: a.name, url: `${siteUrl}/author/${a.slug}` }, publisher: { "@type": "Organization", name: "HouseholdMe" } },
          {
            "@type": "ItemList",
            name: g.title,
            itemListElement: picks.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Product",
                name: p.name,
                offers: { "@type": "Offer", price: p.price, priceCurrency: "USD", availability: "https://schema.org/InStock" },
                review: { "@type": "Review", author: { "@type": "Person", name: a.name }, reviewRating: { "@type": "Rating", ratingValue: p.score, bestRating: 10 } },
              },
            })),
          },
          { "@type": "FAQPage", mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ],
      }
    : null;

  return (
    <article className="wrap" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <ActiveCategory slug={g.category.slug} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <nav className="crumbs" style={{ marginBottom: 22 }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/category/${g.category.slug}`}>{g.category.name}</Link>
        <span>/</span>
        <span>{g.short}</span>
      </nav>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px 48px", alignItems: "stretch", marginBottom: 44 }}>
        <header className="stack" style={{ flex: "2 1 520px", minWidth: 0, maxWidth: 860, gap: 18 }}>
          <span className="tag-blue">Buying guide</span>
          <h1 className="h1" style={{ fontSize: "clamp(36px,5.6vw,64px)" }}>{g.title}</h1>
          <p className="lead" style={{ fontSize: 19 }}>{g.intro}</p>
          <div className="meta-grid">
            <div className="span-all" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Photo round src={a.imageUrl} alt={a.name} style={{ width: 40, height: 40 }} />
              <div style={{ lineHeight: 1.4 }}>
                Tested and written by
                <br />
                <Link href={`/author/${a.slug}`} style={{ fontWeight: 700 }}>{a.name}</Link>
              </div>
            </div>
            {reviewer && (
              <div style={{ lineHeight: 1.4 }}>
                Reviewed by
                <br />
                <Link href={`/author/${reviewer.slug}`} style={{ fontWeight: 700 }}>{reviewer.name}</Link>, {reviewer.role.toLowerCase()}
              </div>
            )}
            <div style={{ lineHeight: 1.4 }}>
              Updated
              <br />
              <strong style={{ color: "var(--ink)" }}>{g.updatedLabel}</strong>
            </div>
            <div style={{ lineHeight: 1.4 }}>
              Test period
              <br />
              <strong style={{ color: "var(--ink)" }}>
                {g.testWeeks} weeks · {g.modelsTested} models
              </strong>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            We choose products independently. We may earn a commission through links on this page; your price stays the same.{" "}
            <Link href="/info/money" style={{ color: "var(--muted)" }}>Affiliate policy</Link>
          </p>
        </header>
        <Photo src={g.heroImage} alt={g.title} label={<>own test photo: all tested {g.photoNote}</>} className="guide-hero" style={{ flex: "1 1 300px", maxWidth: 440, width: "100%", minHeight: 240 }} />
      </div>

      <div className="with-aside">
        <aside className="guide-aside desktop-only">
          <div className="eyebrow" style={{ letterSpacing: "0.1em" }}>In this guide</div>
          {toc.map(([label, id]) => (
            <a key={id} href={`#${id}`} className="toc-link">{label}</a>
          ))}
        </aside>

        <div className="stack" style={{ flex: "1 1 480px", minWidth: 0, maxWidth: 780, gap: 44 }}>
          <details className="mobile-only" style={{ border: "2px solid var(--ink)", padding: "14px 16px" }}>
            <summary style={{ fontWeight: 800, display: "flex", justifyContent: "space-between" }}>
              In this guide<span>+</span>
            </summary>
            <div className="stack" style={{ gap: 12, marginTop: 14 }}>
              {toc.map(([label, id]) => (
                <a key={id} href={`#${id}`} style={{ fontSize: 15 }}>{label}</a>
              ))}
            </div>
          </details>

          {F && F.summary.length > 0 && (
            <section id="g-summary" className="stack" style={{ border: "3px solid var(--ink)", background: "var(--sky-bg)", padding: "22px 24px", gap: 14 }}>
              <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>The short answer</h2>
              {F.summary.map((t, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)" }}>
                  <span className="mono" style={{ fontWeight: 600, color: "var(--blue-dark)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{t}</span>
                </div>
              ))}
            </section>
          )}

          <Picks id="g-picks" picks={picks} site={site} />

          {F?.compare && cmpCols.length > 0 && (
            <section id="g-compare" className="stack" style={{ gap: 16 }}>
              <div className="stack" style={{ gap: 10 }}>
                <h2 className="h2">Compare our picks side by side</h2>
                <p className="prose">All measurements from our test house in one place. Customer ratings are the average across major US retailers as of {site.pricesCheckedLabel}.</p>
              </div>
              <div className="table-wrap">
                <table className="cmp" style={{ minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#fff", color: "var(--ink)" }}>
                      <th className="sticky eyebrow" style={{ width: "22%", padding: 14, verticalAlign: "bottom", color: "var(--muted)" }}>{g.modelsTested} models tested</th>
                      {cmpCols.map(({ c, p }) => {
                        const bg = c.highlight ? "var(--sky-bg)" : "#fff";
                        return (
                          <th key={p.slug} style={{ padding: 0, borderLeft: "1px solid var(--line)", background: bg, fontWeight: 400 }}>
                            <div className="eyebrow" style={{ background: c.highlight ? "var(--sky)" : "var(--ink)", color: c.highlight ? "var(--ink)" : "#fff", padding: "8px 14px" }}>
                              {c.highlight ? "Our pick" : p.label}
                            </div>
                            <div className="stack" style={{ padding: 14, gap: 8 }}>
                              <Link href={`/review/${p.slug}`} style={{ display: "block" }}>
                                <Photo src={p.images[0]} alt={p.name} style={{ aspectRatio: "4/3", padding: 0 }} />
                              </Link>
                              <Link href={`/review/${p.slug}`} className="nolink" style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em" }}>{p.name}</Link>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
                                <span style={{ color: "var(--blue-link)", letterSpacing: 1 }}>{stars(c.stars)}</span>
                                <strong style={{ color: "var(--ink)" }}>{c.stars}</strong>
                                <span>({c.reviews})</span>
                              </div>
                              <span className="score-pill" style={{ alignSelf: "flex-start", padding: "3px 8px", fontSize: 12 }}>
                                Test score <strong style={{ fontSize: 17 }}>{score(p.score)}</strong>
                              </span>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                <strong style={{ fontSize: 22, fontWeight: 900 }}>{usd(p.price)}</strong>
                                {c.was ? (
                                  <>
                                    <s style={{ color: "var(--faint)", fontSize: 14 }}>{usd(c.was)}</s>
                                    <span style={{ background: "var(--green)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "2px 6px" }}>-{Math.round((1 - p.price / c.was) * 100)}%</span>
                                  </>
                                ) : null}
                              </div>
                              {p.shops[0] && (
                                <a href={p.shops[0].url} rel="sponsored nofollow" target="_blank" className="btn-shop" style={{ padding: "11px 14px", fontSize: 14 }}>
                                  View at {p.shops[0].shop}
                                </a>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {F.compare.groups.map((grp) => (
                      <CompareGroup key={grp.heading} grp={grp} cols={cmpCols.map((x) => x.c.highlight)} />
                    ))}
                    <tr style={{ borderTop: "2px solid var(--ink)" }}>
                      <td className="sticky" style={{ padding: 14, fontWeight: 700 }}>Best for</td>
                      {cmpCols.map(({ c, p }) => {
                        const d = F.deep.find((x) => x.product === p.slug);
                        return (
                          <td key={p.slug} style={{ padding: 14, borderLeft: "1px solid var(--line)", background: c.highlight ? "var(--sky-bg)" : "#fff" }}>
                            <div className="stack" style={{ gap: 12 }}>
                              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{d ? `Choose this if ${d.bestFor}` : p.verdict}</span>
                              {p.shops[0] && (
                                <a href={p.shops[0].url} rel="sponsored nofollow" target="_blank" className="btn-shop" style={{ padding: "11px 14px", fontSize: 14 }}>
                                  {usd(p.price)} at {p.shops[0].shop}
                                </a>
                              )}
                              <Link href={`/review/${p.slug}`} style={{ fontSize: 13, fontWeight: 700 }}>Read the review</Link>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="note">&quot;Best&quot; marks the top measurement in each row. Prices checked {site.pricesCheckedLabel}.</p>
            </section>
          )}

          <section id="g-trust" className="dark-band stack" style={{ padding: 26, gap: 14 }}>
            <h2 style={{ fontSize: 24, margin: 0, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--sky)" }}>Why you can trust us</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "#e6e6df" }}>{trust}</p>
            <div style={{ display: "flex", gap: "10px 24px", flexWrap: "wrap", fontSize: 14, fontWeight: 700 }}>
              <Link href="/info/guidelines" style={{ color: "#fff" }}>Editorial guidelines</Link>
              <Link href="/info/money" style={{ color: "#fff" }}>How we make money</Link>
              <Link href="/info/corrections" style={{ color: "#fff" }}>Report a correction</Link>
            </div>
          </section>

          <section id="g-who" className="stack" style={{ gap: 16 }}>
            <h2 className="h2">Who is this for?</h2>
            <p className="prose">{g.forWho}</p>
          </section>

          <section id="g-how" className="stack" style={{ gap: 16 }}>
            <h2 className="h2">How we tested</h2>
            <p className="prose">{g.howTested}</p>
            <Photo src={g.testImage} alt="Test setup" label={<>own photo: test setup {g.photoNote}</>} style={{ aspectRatio: "16/9" }} />
            <p className="small" style={{ margin: 0 }}>{g.howCaption || "Test setup in our test house in Columbus. Photo: HouseholdMe"}</p>
            <Link href="/how-we-test" style={{ fontSize: 14, fontWeight: 700 }}>Our full test method</Link>
          </section>

          <section id="g-table" className="stack" style={{ gap: 16 }}>
            <h2 className="h2">Test results compared</h2>
            <div className="table-wrap">
              <table style={{ minWidth: 520 }}>
                <thead>
                  <tr>{tableHead.map((h, i) => <th key={i}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {tableRows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{r[0]}</td>
                      {r.slice(1).map((c, j) => <td key={j} className="mono">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">{g.tableNote || `Test score based on our fixed weighting scheme. Price from: lowest price on ${site.pricesCheckedLabel}.`}</p>
          </section>

          {F && (
            <>
              {F.deep.length > 0 && (
                <section id="g-deep" className="stack" style={{ gap: 28 }}>
                  <h2 className="h2">Our picks in depth</h2>
                  {F.deep.map((d) => {
                    const p = bySlug.get(d.product);
                    if (!p) return null;
                    return (
                      <div key={d.product} className="stack" style={{ gap: 16, borderTop: "3px solid var(--ink)", paddingTop: 22 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <span className="tag-dark">{p.label}</span>
                          <span className="score-pill">Test score <strong style={{ fontSize: 20 }}>{score(p.score)}</strong></span>
                          <span style={{ fontSize: 14, color: "var(--muted)" }}>from <strong style={{ color: "var(--ink)" }}>{usd(p.price)}</strong></span>
                        </div>
                        <h3 style={{ fontSize: 28, margin: 0, fontWeight: 900, letterSpacing: "-0.025em" }}>{p.name}</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px", alignItems: "flex-start" }}>
                          <div className="stack" style={{ flex: "2 1 340px", minWidth: 0, gap: 14 }}>
                            {d.body.map((t, i) => <p key={i} className="prose"><RichText text={t} links={links} /></p>)}
                          </div>
                          <div className="stack" style={{ flex: "1 1 200px", maxWidth: 260, width: "100%", gap: 12 }}>
                            <Photo src={p.images[1] ?? p.images[0]} alt={`${p.name} in use`} style={{ aspectRatio: "1" }} />
                            {d.specs.length > 0 && (
                              <div className="box">
                                <div className="eyebrow" style={{ background: "var(--ink)", color: "#fff", padding: "8px 12px" }}>Measured</div>
                                {d.specs.map((s, i) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 12px", borderTop: "1px solid var(--line-2)", fontSize: 13 }}>
                                    <span style={{ color: "var(--muted)" }}>{s.k}</span>
                                    <strong className="mono" style={{ fontWeight: 600, textAlign: "right" }}>{s.v}</strong>
                                  </div>
                                ))}
                              </div>
                            )}
                            {d.scores.length > 0 && (
                              <div className="box stack" style={{ padding: 12, gap: 10 }}>
                                <strong className="eyebrow">Score breakdown</strong>
                                {d.scores.map((s, i) => (
                                  <div key={i} className="stack" style={{ gap: 4, fontSize: 13 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                      <span>{s.k}</span>
                                      <strong className="mono" style={{ fontWeight: 600 }}>{score(Number(s.v))}</strong>
                                    </div>
                                    <div style={{ height: 6, background: "var(--line-2)" }}><div style={{ height: "100%", width: `${Number(s.v) * 10}%`, background: "var(--blue)" }} /></div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 16 }}>
                          <div className="stack" style={{ border: "2px solid var(--ink)", padding: "14px 16px", gap: 8 }}>
                            <strong className="eyebrow" style={{ color: "var(--green)" }}>Pros</strong>
                            {p.pros.map((x, i) => <span key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>+ {x}</span>)}
                          </div>
                          <div className="stack" style={{ border: "2px solid var(--ink)", padding: "14px 16px", gap: 8 }}>
                            <strong className="eyebrow" style={{ color: "var(--bad)" }}>Cons</strong>
                            {p.cons.map((x, i) => <span key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>− {x}</span>)}
                          </div>
                        </div>
                        <p style={{ margin: 0, background: "var(--soft-2)", padding: "14px 16px", fontSize: 16, lineHeight: 1.55 }}>
                          <strong>Choose this if</strong> {d.bestFor}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px 20px", flexWrap: "wrap" }}>
                          {p.shops[0] && (
                            <a href={p.shops[0].url} rel="sponsored nofollow" target="_blank" className="btn-shop">Check price at {p.shops[0].shop}</a>
                          )}
                          <Link href={`/review/${p.slug}`} style={{ fontSize: 14, fontWeight: 700 }}>Read the full review</Link>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {F.bars.length > 0 && (
                <section id="g-results" className="stack" style={{ gap: 28 }}>
                  <div className="stack" style={{ gap: 12 }}>
                    <h2 className="h2">Results by test</h2>
                    <p className="prose">The comparison table above shows averages. Below you can see how the top-scoring models did in each test. Our top pick is highlighted in blue.</p>
                  </div>
                  {F.bars.map((b, i) => (
                    <div key={i} className="stack" style={{ gap: 10 }}>
                      <h3 className="h3">{b.heading}</h3>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--muted)" }}>{b.note}</p>
                      {b.rows.map((x, j) => (
                        <div key={j} style={{ display: "grid", gridTemplateColumns: "minmax(0,120px) minmax(0,1fr) 64px", gap: 12, alignItems: "center", fontSize: 14 }}>
                          <span style={{ fontWeight: 700 }}>{x.name}</span>
                          <div style={{ height: 14, background: "var(--line-2)" }}>
                            <div style={{ height: "100%", width: `${x.pct}%`, background: x.name === top?.name ? "var(--blue)" : "var(--ink)" }} />
                          </div>
                          <span className="mono" style={{ fontSize: 13, textAlign: "right" }}>{x.value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </section>
              )}

              {F.buying.length > 0 && (
                <section id="g-buy" className="stack" style={{ gap: 28 }}>
                  <div className="stack" style={{ gap: 12 }}>
                    <h2 className="h2">{T.buying ?? `What to look for when buying ${short}`}</h2>
                    {F.buyIntro && <p className="prose">{F.buyIntro}</p>}
                  </div>
                  {F.buying.map((b, i) => (
                    <div key={i} className="stack" style={{ gap: 12 }}>
                      <h3 className="h3">{b.heading}</h3>
                      {b.paragraphs.map((t, j) => <p key={j} className="prose"><RichText text={t} links={links} /></p>)}
                      {b.tip && (
                        <p style={{ margin: 0, border: "2px solid var(--ink)", padding: "12px 16px", fontSize: 15, lineHeight: 1.55 }}>
                          <strong>Our tip:</strong> {b.tip}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {F.tiers.length > 0 && (
                <section id="g-tiers" className="stack" style={{ gap: 16 }}>
                  <h2 className="h2">How much should you spend?</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 12 }}>
                    {F.tiers.map((t, i) => (
                      <div key={i} className="box stack" style={{ padding: 18, gap: 10 }}>
                        <strong style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>{t.heading}</strong>
                        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--body)", flex: 1 }}>{t.text}</p>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--blue-dark)" }}>{t.pick}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="dark-band" style={{ padding: 28, display: "flex", flexWrap: "wrap", gap: "20px 28px", alignItems: "center" }}>
                <div className="stack" style={{ flex: "1 1 280px", gap: 8 }}>
                  <span className="eyebrow" style={{ letterSpacing: "0.1em", color: "var(--sky)" }}>Price alert</span>
                  <h2 style={{ fontSize: 26, margin: 0, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Get a heads-up when our picks drop in price</h2>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--on-dark)" }}>Plus our latest test results every Friday. One email a week, unsubscribe in one click.</p>
                </div>
                <div style={{ flex: "1 1 280px", maxWidth: 440 }}>
                  <NewsletterForm button="Turn on price alert" source={`price-alert:${g.slug}`} doneClassName="on-dark-done" />
                </div>
              </section>

              {F.vsRows.length > 0 && (
                <section id="g-vs" className="stack" style={{ gap: 16 }}>
                  <h2 className="h2">{T.vs ?? "How it compares to the alternatives"}</h2>
                  <div className="table-wrap">
                    <table style={{ minWidth: 560 }}>
                      <thead>
                        <tr>{F.vsHead.map((x, i) => <th key={i}>{x}</th>)}</tr>
                      </thead>
                      <tbody>
                        {F.vsRows.map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 700 }}>{r[0]}</td>
                            {r.slice(1).map((c, j) => <td key={j}>{c}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {F.vsNote && <p className="prose">{F.vsNote}</p>}
                </section>
              )}

              {F.care.length > 0 && (
                <section id="g-care" className="stack" style={{ gap: 16 }}>
                  <h2 className="h2">{T.care ?? "How to make it last longer"}</h2>
                  {F.care.map((c, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                      <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--blue-dark)" }}>{i + 1}</span>
                      <div className="stack" style={{ gap: 4 }}>
                        <strong style={{ fontSize: 17, fontWeight: 800 }}>{c.heading}</strong>
                        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--body)" }}>{c.text}</p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {F.skip.length > 0 && (
                <section id="g-skip" className="stack" style={{ gap: 16 }}>
                  <h2 className="h2">Tested but not recommended</h2>
                  {F.skip.map((s, i) => (
                    <div key={i} className="stack" style={{ gap: 6, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 18, fontWeight: 800 }}>{s.name}</strong>
                        <span className="mono small">Test score {s.score}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--body)" }}>{s.why}</p>
                    </div>
                  ))}
                  {F.skipNote && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>{F.skipNote}</p>}
                </section>
              )}

              {F.next.length > 0 && (
                <section id="g-next" className="stack" style={{ gap: 16 }}>
                  <h2 className="h2">What we&apos;re testing now</h2>
                  <p className="prose">These models are in our test house or launching soon. As soon as we&apos;re done, we&apos;ll update this guide.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 12 }}>
                    {F.next.map((n, i) => (
                      <div key={i} className="stack" style={{ border: "2px dashed var(--ink)", padding: 16, gap: 8 }}>
                        <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", background: "var(--soft-2)", padding: "4px 8px" }}>{n.status}</span>
                        <strong style={{ fontSize: 18, fontWeight: 900 }}>{n.name}</strong>
                        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--body)" }}>{n.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {F.durable.length > 0 && (
                <section id="g-durable" className="stack" style={{ gap: 14 }}>
                  <h2 className="h2">Durability, warranty and repair</h2>
                  {F.durable.map((t, i) => <p key={i} className="prose"><RichText text={t} links={links} /></p>)}
                </section>
              )}

              {F.situations.length > 0 && (
                <section id="g-situations" className="stack" style={{ gap: 16 }}>
                  <h2 className="h2">{T.situations ?? "Which one fits your situation?"}</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "24px 32px" }}>
                    {F.situations.map((s, i) => (
                      <div key={i} className="stack" style={{ gap: 8, borderTop: "3px solid var(--ink)", paddingTop: 14 }}>
                        <strong style={{ fontSize: 19, fontWeight: 900 }}>{s.heading}</strong>
                        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "var(--body)" }}><RichText text={s.text} links={links} /></p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {F.specsExplained.length > 0 && (
                <section id="g-specs" className="stack" style={{ gap: 14 }}>
                  <h2 className="h2">What the numbers on the box mean</h2>
                  {F.specsIntro && <p className="prose">{F.specsIntro}</p>}
                  <div className="stack">
                    {F.specsExplained.map((x, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: "4px 20px", borderTop: "1px solid var(--line)", padding: "14px 0" }}>
                        <strong className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{x.term}</strong>
                        <span style={{ fontSize: 16, lineHeight: 1.6, color: "var(--body)", gridColumn: "span 2" }}>{x.text}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {F.mistakes.length > 0 && (
                <section id="g-mistakes" className="stack" style={{ gap: 16 }}>
                  <h2 className="h2">{T.mistakes ?? "Common mistakes to avoid"}</h2>
                  {F.mistakes.map((m, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
                      <span className="mono" style={{ fontSize: 15, fontWeight: 700, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--ink)" }}>{i + 1}</span>
                      <div className="stack" style={{ gap: 4 }}>
                        <strong style={{ fontSize: 18, fontWeight: 800 }}>{m.heading}</strong>
                        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--body)" }}><RichText text={m.text} links={links} /></p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {F.verdict.length > 0 && (
                <section id="g-verdict" className="stack" style={{ gap: 14, background: "var(--soft-2)", padding: 28 }}>
                  <h2 className="h2">Our final verdict</h2>
                  {F.verdict.map((t, i) => <p key={i} className="prose"><RichText text={t} links={links} /></p>)}
                </section>
              )}

              <Picks id="g-picks-end" picks={picks} site={site} />

              {F.glossary.length > 0 && (
                <section id="g-gloss" className="stack" style={{ gap: 12 }}>
                  <h2 className="h2">Glossary</h2>
                  <div className="stack">
                    {F.glossary.map((x, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: "4px 20px", borderTop: "1px solid var(--line)", padding: "12px 0" }}>
                        <strong style={{ fontSize: 16, fontWeight: 800 }}>{x.term}</strong>
                        <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--body)", gridColumn: "span 2" }}>{x.definition}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <Faq id="g-faq" items={g.faq} />

          {F && related.length > 0 && (
            <section className="stack" style={{ gap: 16 }}>
              <h2 style={{ fontSize: 24, margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>Read next</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 16 }}>
                {related.map((x) => (
                  <Link key={x.slug} href={`/guide/${x.slug}`} className="nolink stack" style={{ gap: 8 }}>
                    <Photo src={x.coverImage} alt={x.title} style={{ aspectRatio: "3/2" }} />
                    <span className="eyebrow eyebrow-blue">{x.category.name}</span>
                    <strong style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{x.title}</strong>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <SourcesAndChanges
            id="g-sources"
            sources={g.sources.length ? g.sources : [`Test protocol for ${short}, HouseholdMe`, "Manufacturer specifications and manuals"]}
            changes={g.changes.length ? g.changes : [{ date: g.updatedLabel, text: "Prices and availability checked." }, { date: g.publishedLabel, text: `First version published after testing ${g.modelsTested} models.` }]}
          />

          <section className="box" style={{ padding: 22, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
            <Photo round src={a.imageUrl} alt={a.name} style={{ width: 88, height: 88 }} />
            <div className="stack" style={{ flex: "1 1 260px", gap: 8 }}>
              <div className="eyebrow" style={{ letterSpacing: "0.1em", color: "var(--muted)" }}>About the author</div>
              <strong style={{ fontSize: 22, fontWeight: 900 }}>{a.name}</strong>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--body)" }}>{a.bio}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <Link href={`/author/${a.slug}`} style={{ fontSize: 14, fontWeight: 700 }}>Profile and all articles</Link>
                <SocialIcons linkedin={a.linkedinUrl} youtube={a.youtubeUrl} />
              </div>
            </div>
          </section>
        </div>
      </div>

      {F && (
        <GuideExtras
          popupMode={site.newsletterPopup}
          popupImage={site.newsletterImage}
          bar={
            site.stickyBuyBar && top && top.shops[0]
              ? { name: top.name, score: score(top.score), price: usd(top.price), shop: top.shops[0].shop, href: top.shops[0].url, image: top.images[0] ?? null }
              : null
          }
        />
      )}
    </article>
  );
}

function Picks({ id, picks, site }: { id: string; picks: Product[]; site: SiteSettings }) {
  return (
    <section id={id} className="stack" style={{ gap: 20 }}>
      <h2 className="h2">Our picks at a glance</h2>
      {picks.map((p) => (
        <PickCard key={p.slug} p={p} />
      ))}
      <p className="note">Prices checked {site.pricesCheckedLabel}. Prices may change.</p>
    </section>
  );
}

function CompareGroup({ grp, cols }: { grp: NonNullable<GuideFull["compare"]>["groups"][number]; cols: boolean[] }) {
  return (
    <>
      <tr>
        <th className="eyebrow" style={{ position: "sticky", left: 0, zIndex: 1, background: "var(--ink)", color: "#fff", padding: "9px 14px", textAlign: "left" }}>{grp.heading}</th>
        {cols.map((_, i) => <td key={i} style={{ background: "var(--ink)" }} />)}
      </tr>
      {grp.rows.map((row) => {
        const vals = row.cells.map((v) => (v[0] === "b" ? v.slice(1).split(":")[0] : v));
        let win = -1;
        if (row.better) {
          const ns = vals.map(num);
          const best = row.better === "low" ? Math.min(...ns) : Math.max(...ns);
          if (!Number.isNaN(best)) win = ns.indexOf(best);
        }
        return (
          <tr key={row.name}>
            <td className="sticky" style={{ padding: "11px 14px", fontWeight: 700 }}>{row.name}</td>
            {row.cells.map((v, i) => {
              const isBar = v[0] === "b";
              const [label, p] = isBar ? v.slice(1).split(":") : [v, ""];
              return (
                <td key={i} style={{ padding: "11px 14px", borderLeft: "1px solid var(--line)", background: cols[i] ? "var(--sky-bg)" : "#fff" }}>
                  {v === "y" ? (
                    <span className="yes" aria-label="Yes">✓</span>
                  ) : v === "n" ? (
                    <span className="no" aria-label="No">✕</span>
                  ) : isBar ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: "var(--line-2)" }}><div style={{ height: "100%", width: `${p}%`, background: "var(--ink)" }} /></div>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                    </div>
                  ) : (
                    <span className="mono" style={{ fontSize: 13 }}>{v}</span>
                  )}
                  {i === win && <span style={{ display: "block", marginTop: 4, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--blue-dark)" }}>Best</span>}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
