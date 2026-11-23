"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { NewsletterForm, SUBSCRIBED_KEY } from "./NewsletterForm";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const caps = [`${name} front view`, `${name} in use in the test house`, `${name} control details`, `${name} next to the competition`];
  const slots = images.slice(0, 4);
  const [gi, setGi] = useState(0);
  return (
    <div className="stack" style={{ gap: 8, marginTop: -1 }}>
      <div className="ph" style={{ aspectRatio: "16/10", padding: 16 }}>
        <img src={slots[gi]} alt={caps[gi]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${slots.length},minmax(0,1fr))`, gap: 8 }}>
        {slots.map((src, i) => (
          <button
            key={i}
            onClick={() => setGi(i)}
            aria-label={caps[i]}
            className="ph"
            style={{ aspectRatio: "16/10", border: i === gi ? "3px solid var(--ink)" : "1px solid var(--line)", cursor: "pointer", padding: 0 }}
          >
            <img src={src} alt="" style={{ pointerEvents: "none" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function HelpfulVote({ slug }: { slug: string }) {
  const [voted, setVoted] = useState(false);
  const vote = (helpful: boolean) => {
    setVoted(true);
    fetch(`/api/public/products/${slug}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ helpful }),
    }).catch(() => {});
  };
  return (
    <section className="box" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      {voted ? (
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          Thanks for your feedback. Missing something? <Link href="/contact">Let us know</Link>.
        </span>
      ) : (
        <>
          <strong style={{ fontSize: 16 }}>Was this review helpful?</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => vote(true)} className="btn btn-outline" style={{ padding: "10px 18px", fontSize: 14 }}>Yes</button>
            <button onClick={() => vote(false)} className="btn btn-outline" style={{ padding: "10px 18px", fontSize: 14 }}>No</button>
          </div>
        </>
      )}
    </section>
  );
}

const ALERT_CLOSED_KEY = "hm-price-alert-closed";

/** Mobile only: sticky "Check price" bar, with a dismissible price-alert panel above it once the reader scrolls past the hero. */
export function MobileBuyBar({ slug, name, shop, href }: { slug: string; name: string; shop: string; href: string }) {
  const [showAlert, setShowAlert] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const hidden = () => {
      try {
        return !!localStorage.getItem(SUBSCRIBED_KEY) || !!sessionStorage.getItem(ALERT_CLOSED_KEY);
      } catch {
        return false;
      }
    };
    const onScroll = () => setShowAlert(window.scrollY > 700 && !hidden());
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => {
    try {
      sessionStorage.setItem(ALERT_CLOSED_KEY, "1");
    } catch {}
    setClosed(true);
  };

  return (
    <div className="mobile-buy-wrap mobile-only">
      {showAlert && !closed && (
        <div className="mobile-alert">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <strong style={{ fontSize: 15 }}>Alert me when the price drops</strong>
            <button onClick={close} aria-label="Close price alert" className="mobile-alert__close">×</button>
          </div>
          <NewsletterForm variant="alert" button="Alert me" placeholder="you@example.com" source={`price-alert:${slug}`} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>One email per price drop. Unsubscribe in one click.</span>
        </div>
      )}
      <div className="mobile-buy">
        <span className="mobile-buy__icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        </span>
        <span className="stack" style={{ minWidth: 0, flex: "1 1 auto" }}>
          <strong style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</strong>
          <span style={{ fontSize: 13, color: "var(--on-dark-2)" }}>See today&rsquo;s price</span>
        </span>
        <a href={href} rel="sponsored nofollow" target="_blank" className="mobile-buy__cta">Check price on {shop}</a>
      </div>
    </div>
  );
}
