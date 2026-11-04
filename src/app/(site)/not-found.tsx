import Link from "next/link";

export default function NotFound() {
  return (
    <div className="stack" style={{ maxWidth: 760, margin: "0 auto", padding: "72px 20px", gap: 18 }}>
      <span className="mono" style={{ fontSize: 14 }}>404</span>
      <h1 className="h1" style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1 }}>This page doesn&apos;t exist (anymore)</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/" className="btn btn-dark">Go to the homepage</Link>
        <Link href="/search" className="btn btn-outline">Search</Link>
      </div>
    </div>
  );
}
