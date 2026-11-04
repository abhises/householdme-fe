"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";

export function Gallery({ images, name, score }: { images: string[]; name: string; score: string }) {
  const caps = [`${name} front view`, `${name} in use in the test house`, `${name} control details`, `${name} next to the competition`];
  const slots = [0, 1, 2, 3].map((i) => images[i] ?? images[0] ?? null);
  const [gi, setGi] = useState(0);
  return (
    <div className="stack" style={{ gap: 8, marginTop: -1 }}>
      <div className="ph" style={{ aspectRatio: "16/10", padding: 16 }}>
        {slots[gi] ? <img src={slots[gi]!} alt={caps[gi]} /> : <>own test photo: {caps[gi]}</>}
        <div style={{ position: "absolute", left: 0, top: 0, fontFamily: "var(--font)", background: "var(--blue)", color: "#fff", width: 104, height: 104, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 1 }}>
          <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>{score}</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>out of 10</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
        {slots.map((src, i) => (
          <button
            key={i}
            onClick={() => setGi(i)}
            aria-label={caps[i]}
            className="ph"
            style={{ aspectRatio: "16/10", border: i === gi ? "3px solid var(--ink)" : "1px solid var(--line)", cursor: "pointer", padding: 0 }}
          >
            {src && <img src={src} alt="" style={{ pointerEvents: "none" }} />}
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
          Thanks for your feedback. Missing something? <Link href="/info/contact">Let us know</Link>.
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
