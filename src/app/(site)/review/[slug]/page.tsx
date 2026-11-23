/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { ActiveCategory } from "@/components/site/NavLinks";
import { Faq, SourcesAndChanges } from "@/components/site/bits";
import { Photo } from "@/components/site/Photo";
import { Gallery, HelpfulVote, MobileBuyBar } from "@/components/site/ReviewClient";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { api } from "@/lib/api";
import { score, usd } from "@/lib/format";
import type { Author, AuthorCard, Guide, Product, SiteSettings } from "@/lib/types";

interface ProductData {
  product: Product & { guide: Guide & { category: { slug: string; name: string }; author: Author; products: Product[] } };
  reviewer: AuthorCard | null;
  related: { slug: string; title: string }[];
  site: SiteSettings;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/review/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await api<ProductData>(`/products/${slug}`, { preview: (await searchParams).preview === "1" });
  return { title: `${product.name} review`, description: product.subtitle || product.verdict };
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="h2" style={{ fontWeight: 800, paddingTop: 16, borderTop: "3px solid var(--ink)" }}>{children}</h2>
);

export default async function ReviewPage({ params, searchParams }: PageProps<"/review/[slug]">) {
  const { slug } = await params;
  const { product: p, reviewer, related, site } = await api<ProductData>(`/products/${slug}`, { preview: (await searchParams).preview === "1" });
  const g = p.guide;
  const a = g.author;
  const others = g.products.filter((o) => o.id !== p.id);
  const shops = p.shops.slice(0, 3);
  const sc = score(p.score);

  const hasFor = p.goodFor.length > 0 || p.notFor.length > 0;
  const toc: [string, string][] = [["Our verdict", "p-verdict"], ["Pros and cons", "p-proscons"]];
  if (hasFor) toc.push(["Who it’s for", "p-for"]);
  if (p.results.length) toc.push(["Test results", "p-results"]);
  if (p.designText) toc.push(["Design and use", "p-design"]);
  if (p.longTerm.length) toc.push(["Long-term test", "p-long"]);
  toc.push(["Specifications", "p-specs"], ["Comparison", "p-compare"]);
  if (others.length) toc.push(["Alternatives", "p-alts"]);
  if (p.questions.length) toc.push(["Reader questions", "p-qa"]);
  toc.push(["FAQ", "p-faq"]);

  const specs = p.specs.length
    ? p.specs
    : [
        { k: "Price from", v: usd(p.price) },
        { k: "Test score", v: `${sc} out of 10` },
        { k: "Rank in our test", v: p.label },
        { k: "Tested in", v: g.title },
        { k: "Models compared", v: String(g.modelsTested) },
        { k: "Test period", v: `${g.testWeeks} weeks` },
      ];
  const compareRows = [
    { name: "Test score", cells: g.products.map((o) => score(o.score)) },
    { name: "Price from", cells: g.products.map((o) => usd(o.price)) },
    { name: "Rank", cells: g.products.map((o) => o.label) },
    ...p.compareRows,
  ];
  const hist = p.priceHistory;
  const lowest = hist.length ? Math.min(...hist.map((h) => h.price)) : p.price;
  const photo = p.images[0] ?? g.coverImage ?? null;

  return (
    <article style={{ paddingBottom: 64 }}>
      <ActiveCategory slug={g.category.slug} />
      <div className="wrap review-hero">
        <div className="review-hero__text">
          <nav className="crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href={`/category/${g.category.slug}`}>{g.category.name}</Link>
            <span>/</span>
            <Link href={`/${g.slug}`}>{g.short}</Link>
          </nav>
          <span className="tag-dark" style={{ alignSelf: "flex-start", padding: "7px 12px", letterSpacing: "0.1em" }}>Review · {p.label}</span>
          <h1 className="h1" style={{ fontWeight: 800, fontSize: "clamp(34px,4.4vw,54px)", letterSpacing: "-0.04em" }}>{p.name} review</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--body)", margin: 0, textWrap: "pretty" }}>{p.subtitle || p.verdict}</p>
          <div className="review-hero__score">
            <div className="score-box">
              <span style={{ fontSize: 46, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>{sc}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>out of 10</span>
            </div>
            {p.subScores.length > 0 && (
              <dl className="sub-scores">
                {p.subScores.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd className="mono">{score(s.value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            Our score is an editorial rating based on hands-on testing. We may earn a commission. <Link href="/info/money" style={{ color: "var(--muted)" }}>Learn more</Link>
          </p>
        </div>

        <div className="review-hero__media">
          <div className="ph review-hero__photo">
            {photo ? <img src={photo} alt={`${p.name} in our test house`} fetchPriority="high" decoding="async" /> : <>own test photo: {p.name}</>}
          </div>
          <div className="price-card">
            <div className="price-card__hist">
              <strong style={{ fontSize: 13 }}>{hist.length ? `Price, last ${hist.length} months` : "Price"}</strong>
              {hist.length > 1 ? <Sparkline values={hist.map((h) => h.price)} /> : <span style={{ fontSize: 26, fontWeight: 800 }}>{usd(p.price)}</span>}
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Now <b style={{ color: "var(--ink)" }}>{usd(hist.length ? hist[hist.length - 1].price : p.price)}</b>
                {hist.length > 1 && <> · Lowest <b style={{ color: "var(--green)" }}>{usd(lowest)}</b></>}
              </span>
            </div>
            <div className="price-card__buy">
              {shops[0] && (
                <a href={shops[0].url} rel="sponsored nofollow" target="_blank" className="btn-shop wide">Check price on {shops[0].shop} &rarr;</a>
              )}
              {shops.length > 1 && (
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  Also at{" "}
                  {shops.slice(1).map((s, i) => (
                    <span key={i}>{i > 0 && ", "}<a href={s.url} rel="sponsored nofollow" target="_blank" style={{ fontWeight: 700 }}>{s.shop}</a></span>
                  ))}
                </span>
              )}
              <strong style={{ fontSize: 14 }}>Or wait for a better price</strong>
              <NewsletterForm variant="alert" button="Alert me" placeholder="you@example.com" source={`price-alert:${p.slug}`} />
              <span style={{ fontSize: 11, color: "var(--faint)" }}>Prices checked {site.pricesCheckedLabel}.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="stack" style={{ maxWidth: 800, gap: 44, paddingTop: 36 }}>
            <div className="meta-grid">
              <span>Tested by <Link href={`/author/${a.slug}`} style={{ fontWeight: 700 }}>{a.name}</Link></span>
              {reviewer && <span>Reviewed by <Link href={`/author/${reviewer.slug}`} style={{ fontWeight: 700 }}>{reviewer.name}</Link></span>}
              <span>In use <b style={{ color: "var(--ink)" }}>{p.inUseSince || g.publishedLabel}</b></span>
              <span>Purchase <b style={{ color: "var(--ink)" }}>{p.purchase || "Bought ourselves"}</b></span>
              <span>Updated <b style={{ color: "var(--ink)" }}>{g.updatedLabel}</b></span>
              <span>Reading time <b style={{ color: "var(--ink)" }}>{p.readTime || "5 minutes"}</b></span>
            </div>

            <nav aria-label="In this review" className="stack" style={{ gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>In this review</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {toc.map(([label, id]) => <a key={id} href={`#${id}`} className="pill">{label}</a>)}
              </div>
            </nav>

            {p.images.length > 1 && <Gallery images={p.images} name={p.name} />}

            <section id="p-verdict" className="stack" style={{ gap: 14, borderTop: "3px solid var(--blue)", paddingTop: 20 }}>
              <strong style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--blue-dark)" }}>Our verdict</strong>
              <p style={{ margin: 0, fontSize: "clamp(21px,2.4vw,27px)", lineHeight: 1.4, fontWeight: 600, letterSpacing: "-0.015em", textWrap: "pretty" }}>{p.verdictLong || p.verdict}</p>
            </section>

            <section id="p-proscons" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 20 }}>
              <div className="stack" style={{ borderTop: "4px solid var(--ink)", paddingTop: 14, gap: 10 }}>
                <strong style={{ fontSize: 16, fontWeight: 800 }}>Pros</strong>
                {p.pros.map((x, i) => <div key={i} style={{ fontSize: 15, lineHeight: 1.5, display: "grid", gridTemplateColumns: "20px 1fr" }}><span style={{ fontWeight: 900 }}>+</span>{x}</div>)}
              </div>
              <div className="stack" style={{ borderTop: "4px solid var(--blue)", paddingTop: 14, gap: 10 }}>
                <strong style={{ fontSize: 16, fontWeight: 800 }}>Cons</strong>
                {p.cons.map((x, i) => <div key={i} style={{ fontSize: 15, lineHeight: 1.5, display: "grid", gridTemplateColumns: "20px 1fr" }}><span style={{ color: "var(--blue-dark)", fontWeight: 900 }}>–</span>{x}</div>)}
              </div>
            </section>

            {hasFor && (
              <section id="p-for" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 16 }}>
                <div className="stack" style={{ background: "var(--soft)", padding: 20, gap: 10 }}>
                  <strong style={{ fontSize: 16, fontWeight: 900 }}>Good for</strong>
                  {p.goodFor.map((x, i) => <span key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>✓ {x}</span>)}
                </div>
                <div className="stack" style={{ background: "var(--soft)", padding: 20, gap: 10 }}>
                  <strong style={{ fontSize: 16, fontWeight: 900 }}>Less suited for</strong>
                  {p.notFor.map((x, i) => <span key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>✕ {x}</span>)}
                </div>
              </section>
            )}

            {p.results.length > 0 && (
              <section id="p-results" className="stack" style={{ gap: 16 }}>
                <H2>Test results</H2>
                <p style={{ margin: 0, fontSize: 15, color: "var(--muted)" }}>Compared with the average of all {g.modelsTested} models tested.</p>
                <div className="stack" style={{ gap: 16 }}>
                  {p.results.map((r, i) => (
                    <div key={i} className="stack" style={{ gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
                        <strong>{r.label}</strong>
                        <span className="mono"><strong>{r.value}</strong> <span style={{ color: "var(--faint)" }}>· avg. {r.average}</span></span>
                      </div>
                      <span style={{ height: 10, background: "var(--line)", display: "block" }}><span style={{ display: "block", height: 10, background: "var(--blue)", width: `${r.pct}%` }} /></span>
                      <span style={{ height: 4, background: "var(--line)", display: "block" }}><span style={{ display: "block", height: 4, background: "#8a8a90", width: `${r.averagePct}%` }} /></span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 18, fontSize: 12, color: "var(--muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 8, background: "var(--blue)" }} />{p.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 4, background: "#8a8a90" }} />Average</span>
                </div>
              </section>
            )}

            {p.designText && (
              <section id="p-design" className="stack" style={{ gap: 16 }}>
                <H2>Design and use</H2>
                <p className="prose">{p.designText}</p>
                {p.videoUrl ? (
                  <video src={p.videoUrl} controls style={{ width: "100%", aspectRatio: "16/9", background: "var(--ink)" }} />
                ) : (
                  <div className="mono" style={{ aspectRatio: "16/9", background: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--on-dark-2)", fontSize: 12 }}>
                    <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--blue)" }} />
                    video: {p.name} in use
                  </div>
                )}
                <p className="small" style={{ margin: 0 }}>Video: {a.name} shows how the {p.name} performs in our test house.</p>
              </section>
            )}

            {p.longTerm.length > 0 && (
              <section id="p-long" className="stack" style={{ gap: 16 }}>
                <H2>Long-term test</H2>
                <div className="stack">
                  {p.longTerm.map((l, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 16, padding: "14px 0", borderTop: "2px solid var(--ink)" }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{l.date}</span>
                      <span style={{ fontSize: 15, lineHeight: 1.55 }}>{l.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="p-specs" className="stack" style={{ gap: 16 }}>
              <H2>Specifications</H2>
              <div className="box">
                {specs.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, padding: "11px 16px", borderTop: i ? "1px solid var(--line)" : 0, fontSize: 14 }}>
                    <span style={{ color: "var(--muted)" }}>{s.k}</span>
                    <span style={{ fontWeight: 700 }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="p-compare" className="stack" style={{ gap: 16 }}>
              <H2>How it compares</H2>
              <div className="table-wrap">
                <table style={{ minWidth: 480 }}>
                  <thead>
                    <tr><th />{g.products.map((o) => <th key={o.id}>{o.name}</th>)}</tr>
                  </thead>
                  <tbody>
                    {compareRows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--muted)" }}>{r.name}</td>
                        {r.cells.map((c, j) => <td key={j} className="mono" style={{ fontWeight: 600 }}>{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {others.length > 0 && (
              <section id="p-alts" className="stack" style={{ gap: 16 }}>
                <H2>Alternatives</H2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 16 }}>
                  {others.map((o) => (
                    <Link key={o.id} href={`/review/${o.slug}`} className="nolink stack card-hover" style={{ border: "2px solid var(--ink)", padding: 18, gap: 8 }}>
                      <span className="eyebrow eyebrow-blue" style={{ letterSpacing: "0.06em" }}>{o.label} · {score(o.score)}</span>
                      <strong style={{ fontSize: 20, fontWeight: 900 }}>{o.name}</strong>
                      <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)" }}>{o.verdict}</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>From {usd(o.price)} · Read review</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {p.questions.length > 0 && (
              <section id="p-qa" className="stack" style={{ gap: 16 }}>
                <H2>Reader questions</H2>
                {p.questions.map((q, i) => (
                  <div key={i} className="stack" style={{ background: "var(--soft)", padding: 20, gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{q.who}</span>
                    <strong style={{ fontSize: 17, fontWeight: 800 }}>{q.q}</strong>
                    <div className="stack" style={{ borderLeft: "3px solid var(--blue)", paddingLeft: 14, gap: 4 }}>
                      <span style={{ fontSize: 15, lineHeight: 1.55 }}>{q.a}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Answered by {a.name}</span>
                    </div>
                  </div>
                ))}
                <Link href="/contact" style={{ fontSize: 14, fontWeight: 700 }}>Ask a question</Link>
              </section>
            )}

            <Faq id="p-faq" items={p.faq.length ? p.faq : g.faq} heading="ruled" />

            <HelpfulVote slug={p.slug} />

            <SourcesAndChanges
              sources={p.sources.length ? p.sources : ["HouseholdMe in-house measurements (2026)", "Manufacturer specifications and manual"]}
              changes={p.changes.length ? p.changes : [{ date: g.updatedLabel, text: "Prices checked and review updated." }, { date: g.publishedLabel, text: "Review published." }]}
            />

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 16 }}>
              {[{ who: "Tested by", person: a }, ...(reviewer ? [{ who: "Reviewed by", person: reviewer }] : [])].map(({ who, person }) => (
                <Link key={who} href={`/author/${person.slug}`} className="nolink" style={{ border: "2px solid var(--ink)", padding: 20, display: "grid", gridTemplateColumns: "64px 1fr", gap: 14, alignItems: "start" }}>
                  <Photo round src={person.imageUrl} alt={person.name} style={{ width: 64, height: 64 }} />
                  <div className="stack" style={{ gap: 4 }}>
                    <span className="eyebrow" style={{ color: "var(--muted)" }}>{who}</span>
                    <strong style={{ fontSize: 18, fontWeight: 900 }}>{person.name}</strong>
                    <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)" }}>{person.short}</span>
                  </div>
                </Link>
              ))}
            </section>

            <section className="stack" style={{ gap: 14 }}>
              <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900 }}>Related buying guides</h2>
              <Link href={`/${g.slug}`} style={{ fontSize: 16, fontWeight: 700 }}>{g.title}</Link>
              {related.map((r) => <Link key={r.slug} href={`/${r.slug}`} style={{ fontSize: 16, fontWeight: 700 }}>{r.title}</Link>)}
            </section>
        </div>
      </div>

      {shops[0] && (
        <>
          <div className="mobile-only" style={{ height: 84 }} />
          <MobileBuyBar slug={p.slug} name={p.name} shop={shops[0].shop} href={shops[0].url} />
        </>
      )}
    </article>
  );
}

/** Price-history line: dashed green marks the lowest price, the red dot is today. */
function Sparkline({ values }: { values: number[] }) {
  const W = 200, H = 44, pad = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const y = (v: number) => (max === min ? H / 2 : pad + ((max - v) / (max - min)) * (H - pad * 2));
  const x = (i: number) => pad + (i / (values.length - 1)) * (W - pad * 2);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  return (
    <div style={{ position: "relative", height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label={`Price history, lowest ${usd(min)}`} style={{ display: "block", overflow: "visible" }}>
        <line x1={pad} x2={W - pad} y1={y(min)} y2={y(min)} stroke="var(--green)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <polyline points={pts} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{ position: "absolute", left: `${(x(last) / W) * 100}%`, top: y(values[last]), width: 9, height: 9, margin: "-4.5px 0 0 -4.5px", borderRadius: "50%", background: "var(--red)" }} />
    </div>
  );
}
