import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/site/Photo";
import { api } from "@/lib/api";
import { usd } from "@/lib/format";
import type { Deal, SiteSettings } from "@/lib/types";

export const metadata: Metadata = { title: "Deals" };

export default async function DealsPage() {
  const { deals, site } = await api<{ deals: Deal[]; site: SiteSettings }>("/deals");
  return (
    <div className="wrap stack" style={{ paddingTop: 36, paddingBottom: 64, gap: 32 }}>
      <div className="stack" style={{ gap: 14, maxWidth: 760 }}>
        <span className="tag-sky">Checked {site.pricesCheckedLabel}</span>
        <h1 className="h1" style={{ fontSize: "clamp(40px,6vw,72px)", lineHeight: 0.96, letterSpacing: "-0.04em" }}>Deals</h1>
        <p className="lead">We only show deals on products we&apos;ve tested and recommend ourselves. We compare against the price over the past 90 days, not the list price.</p>
      </div>
      {deals.length === 0 && <p className="lead">No deals right now. Check back soon.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: 20 }}>
        {deals.map((d) => {
          const p = d.product;
          const shop = p.shops[0];
          const off = d.wasPrice > 0 ? Math.round((1 - p.price / d.wasPrice) * 100) : 0;
          return (
            <div key={d.id} className="box stack">
              <Link href={`/review/${p.slug}`} className="nolink">
                <Photo src={p.images[0]} alt={p.name} label={<>product photo {p.name}</>} style={{ aspectRatio: "4/3", background: "repeating-linear-gradient(135deg,#f4f4f6 0 10px,#ececef 10px 20px)" }}>
                  {off > 0 && <span style={{ position: "absolute", top: 0, left: 0, background: "var(--blue)", color: "#fff", fontFamily: "var(--font)", fontWeight: 900, fontSize: 18, padding: "8px 12px", zIndex: 1 }}>-{off}%</span>}
                </Photo>
              </Link>
              <div className="stack" style={{ padding: 18, gap: 8, flex: 1 }}>
                <span className="eyebrow eyebrow-blue" style={{ letterSpacing: "0.06em" }}>{p.label} · {p.guide.short}</span>
                <Link href={`/review/${p.slug}`} className="nolink" style={{ fontSize: 20, fontWeight: 900 }}>{p.name}</Link>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <strong style={{ fontSize: 26, fontWeight: 900 }}>{usd(p.price)}</strong>
                  <span style={{ fontSize: 14, color: "var(--faint)", textDecoration: "line-through" }}>{usd(d.wasPrice)}</span>
                </div>
                {shop && <span style={{ fontSize: 13, color: "var(--body)" }}>Lowest price in 90 days at {shop.shop}</span>}
                <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 8, flexWrap: "wrap" }}>
                  {shop && <a href={shop.url} rel="sponsored nofollow" target="_blank" className="btn-shop" style={{ padding: "11px 16px", fontSize: 14 }}>Go to {shop.shop}</a>}
                  <Link href={`/review/${p.slug}`} className="btn btn-outline" style={{ padding: "9px 14px", fontSize: 14 }}>Review</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
