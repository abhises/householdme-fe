"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NewsletterForm, SUBSCRIBED_KEY } from "./NewsletterForm";

interface Props {
  popupMode: "scroll" | "timer" | "direct" | "off";
  popupImage: string | null;
  bar: { name: string; score: string; price: string; shop: string; href: string; image: string | null } | null;
}

const SEEN_KEY = "hm-nl-popup";
const read = (store: "local" | "session", key: string) => {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
};

/** Sticky "our pick" buy bar and newsletter popup shown on full buying guides. */
export function GuideExtras({ popupMode, popupImage, bar }: Props) {
  const [barOn, setBarOn] = useState(false);
  const [barClosed, setBarClosed] = useState(false);
  const [nlOpen, setNlOpen] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    const canOpen = () => popupMode !== "off" && !shown.current && !read("session", SEEN_KEY) && !read("local", SUBSCRIBED_KEY);
    const open = () => {
      if (!canOpen()) return;
      shown.current = true;
      setNlOpen(true);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const H = document.documentElement.scrollHeight - window.innerHeight;
      setBarOn(y > 900);
      if (popupMode === "scroll" && H > 0 && y / H > 0.35) open();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const t = popupMode === "timer" ? setTimeout(open, 15000) : popupMode === "direct" ? setTimeout(open, 400) : undefined;
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (t) clearTimeout(t);
    };
  }, [popupMode]);

  const close = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setNlOpen(false);
  };

  useEffect(() => {
    if (!nlOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nlOpen]);

  return (
    <>
      {bar && barOn && !barClosed && !nlOpen && (
        <div className="buy-bar">
          <div className="wrap" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <div className="ph" style={{ width: 52, height: 52, flexShrink: 0, background: "var(--dark-2)", padding: 0 }}>
              {bar.image && <img src={bar.image} alt="" />}
            </div>
            <div className="stack" style={{ flex: "1 1 auto", minWidth: 0, gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sky)" }}>Our pick · test score {bar.score}</span>
              <strong style={{ fontSize: 16, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {bar.name} <span style={{ fontWeight: 500, color: "var(--on-dark-2)" }}>from {bar.price}</span>
              </strong>
            </div>
            <a href={bar.href} rel="sponsored nofollow" target="_blank" className="btn-shop" style={{ padding: "12px 18px", fontSize: 14, whiteSpace: "nowrap" }}>
              View at {bar.shop}
            </a>
            <button onClick={() => setBarClosed(true)} aria-label="Close bar" style={{ background: "transparent", border: 0, color: "var(--on-dark-2)", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: 6 }}>
              ×
            </button>
          </div>
        </div>
      )}

      {nlOpen && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Sign up for the newsletter" onClick={(e) => e.stopPropagation()}>
            <div className="ph" style={{ flex: "1 1 220px", minHeight: 200 }}>
              {popupImage && <img src={popupImage} alt="" />}
            </div>
            <div className="stack" style={{ flex: "2 1 320px", padding: "30px 26px 24px", gap: 14 }}>
              <button onClick={close} aria-label="Close" className="modal-close">
                ×
              </button>
              <span className="tag-sky" style={{ padding: "5px 9px" }}>Free newsletter</span>
              <h2 style={{ fontSize: 32, margin: 0, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.02 }}>Never overpay again</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--body)" }}>Every Friday, our latest tests and the best deals, compared against the price over the past 90 days.</p>
              <div className="stack" style={{ gap: 6, fontSize: 14 }}>
                {["Price alerts for products in our buying guides", "New test results in your inbox first", "One email a week, unsubscribe in one click"].map((t) => (
                  <span key={t} style={{ display: "flex", gap: 8 }}>
                    <strong style={{ color: "var(--green)" }}>✓</strong>
                    {t}
                  </span>
                ))}
              </div>
              <NewsletterForm variant="stacked" source="guide-popup" doneClassName="popup-done" />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--faint)" }}>
                  We never share your email address. <Link href="/info/privacy" style={{ color: "var(--faint)" }}>Privacy</Link>
                </span>
                <button onClick={close} style={{ background: "none", border: 0, padding: 0, fontWeight: 600, fontSize: 13, color: "var(--muted)", textDecoration: "underline", cursor: "pointer" }}>
                  No, thanks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
