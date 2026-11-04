import Link from "next/link";
import type { ReactNode } from "react";
import type { Change, GuideCard, Product, QA } from "@/lib/types";
import { score, usd } from "@/lib/format";
import { Photo } from "./Photo";
import { NewsletterForm } from "./NewsletterForm";

export function Faq({ items, title = "Frequently asked questions", id, heading = "h2" }: { items: QA[]; title?: string; id?: string; heading?: "h2" | "ruled" }) {
  if (!items.length) return null;
  return (
    <section id={id} className="stack faq">
      <h2
        className="h2"
        style={heading === "ruled" ? { margin: "0 0 12px", fontWeight: 800, paddingTop: 16, borderTop: "3px solid var(--ink)" } : { margin: "0 0 12px" }}
      >
        {title}
      </h2>
      {items.map((q, i) => (
        <details key={i}>
          <summary>
            {q.q}
            <span>+</span>
          </summary>
          <p>{q.a}</p>
        </details>
      ))}
    </section>
  );
}

export function SourcesAndChanges({ sources, changes, id }: { sources: string[]; changes: Change[]; id?: string }) {
  return (
    <section id={id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 32, borderTop: "3px solid var(--ink)", paddingTop: 24 }}>
      <div className="stack" style={{ gap: 10 }}>
        <strong className="eyebrow" style={{ letterSpacing: "0.1em" }}>Sources</strong>
        {sources.map((s, i) => (
          <span key={i} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)" }}>{s}</span>
        ))}
      </div>
      <div className="stack" style={{ gap: 10 }}>
        <strong className="eyebrow" style={{ letterSpacing: "0.1em" }}>Changelog</strong>
        {changes.map((c, i) => (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)", display: "grid", gridTemplateColumns: "120px 1fr", gap: 8 }}>
            <span className="mono" style={{ fontSize: 12, color: "var(--faint)", paddingTop: 2 }}>{c.date}</span>
            <span>{c.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Paragraph text where mentions of product names link to the product's shop page. */
export function RichText({ text, links }: { text: string; links: { name: string; href: string }[] }) {
  const hits: { s: number; e: number; href: string }[] = [];
  for (const l of links) {
    if (!l.name || !l.href) continue;
    const i = text.indexOf(l.name);
    if (i >= 0 && !hits.some((h) => i < h.e && i + l.name.length > h.s)) hits.push({ s: i, e: i + l.name.length, href: l.href });
  }
  hits.sort((a, b) => a.s - b.s);
  const out: ReactNode[] = [];
  let c = 0;
  hits.slice(0, 2).forEach((h, k) => {
    if (h.s > c) out.push(text.slice(c, h.s));
    out.push(
      <a key={k} href={h.href} target="_blank" rel="sponsored nofollow noopener" className="rich-link">
        {text.slice(h.s, h.e)}
      </a>,
    );
    c = h.e;
  });
  if (c < text.length) out.push(text.slice(c));
  return <>{out}</>;
}

export function GuideCardItem({ g }: { g: GuideCard }) {
  return (
    <Link href={`/guide/${g.slug}`} className="nolink stack" style={{ gap: 12 }}>
      <Photo src={g.coverImage} alt={g.title} label={<>own test photo: {g.photoNote}</>} style={{ aspectRatio: "3/2" }}>
        <span className="ph-badge">{g.modelsTested} tested</span>
      </Photo>
      <div className="eyebrow eyebrow-blue">{g.category.name}</div>
      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--ink)", textWrap: "balance" }}>{g.title}</div>
      <div className="small">
        By {g.author.name} · {g.updatedLabel}
      </div>
    </Link>
  );
}

export function shopLinks(p: Pick<Product, "shops" | "price">, n = 2) {
  return (p.shops ?? []).slice(0, n);
}

export function PickCard({ p }: { p: Product }) {
  const shops = shopLinks(p);
  return (
    <div className="pick-card">
      <Link href={`/review/${p.slug}`} className="ph">
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name} loading="lazy" />
        ) : (
          <>product photo {p.name}</>
        )}
      </Link>
      <div className="body">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="tag-dark">{p.label}</span>
          <span className="score-pill">
            Test score <strong>{score(p.score)}</strong>
          </span>
        </div>
        <h3 style={{ fontSize: 26, margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>
          <Link href={`/review/${p.slug}`} className="nolink">
            {p.name}
          </Link>
        </h3>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--body)" }}>{p.verdict}</p>
        <div className="stack" style={{ gap: 8 }}>
          {shops.map((s, i) => (
            <a key={i} href={s.url} rel="sponsored nofollow" target="_blank" className="btn-shop wide" style={{ alignSelf: "flex-end", width: "min(100%,300px)" }}>
              Check price on {s.shop}
            </a>
          ))}
          {!shops.length && <span className="small">from <strong style={{ color: "var(--ink)" }}>{usd(p.price)}</strong></span>}
        </div>
        <Link href={`/review/${p.slug}`} style={{ fontSize: 14, fontWeight: 700 }}>
          Read the full review
        </Link>
      </div>
    </div>
  );
}

export function AuthorRow({ slug, name, short, imageUrl, size = 56 }: { slug: string; name: string; short: string; imageUrl: string | null; size?: number }) {
  return (
    <Link href={`/author/${slug}`} className="nolink" style={{ display: "grid", gridTemplateColumns: `${size}px 1fr`, gap: 14, alignItems: "center", maxWidth: 520 }}>
      <Photo round src={imageUrl} alt={name} style={{ width: size, height: size }} />
      <span className="stack" style={{ gap: 2 }}>
        <strong style={{ fontSize: 16 }}>{name}</strong>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>{short}</span>
      </span>
    </Link>
  );
}

export function SocialIcons() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <a href="https://www.linkedin.com/" target="_blank" rel="noopener" aria-label="LinkedIn" className="icon-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z" />
        </svg>
      </a>
      <a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="YouTube" className="icon-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.3V8.7L15.5 12z" />
        </svg>
      </a>
    </div>
  );
}

export function NewsletterBand({ title, text, button = "Subscribe", source }: { title: string; text: string; button?: string; source?: string }) {
  return (
    <div className="dark-band" style={{ padding: "32px clamp(20px,4vw,48px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div className="stack" style={{ gap: 6, maxWidth: 520 }}>
        <h2 style={{ fontSize: 26, margin: 0, fontWeight: 900, letterSpacing: "-0.03em" }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--on-dark)" }}>{text}</p>
      </div>
      <div style={{ flex: "1 1 300px", maxWidth: 460 }}>
        <NewsletterForm button={button} source={source} doneClassName="on-dark-done" />
      </div>
    </div>
  );
}

