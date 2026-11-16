/** Instant placeholder while a site page renders, so clicking a link responds immediately. */
export default function Loading() {
  return (
    <div className="wrap page-loading" role="status" aria-label="Loading">
      <div style={{ width: 160, height: 14 }} />
      <div style={{ width: "min(560px, 90%)", height: 56 }} />
      <div style={{ width: "min(680px, 100%)", height: 18 }} />
      <div style={{ width: "min(520px, 80%)", height: 18 }} />
      <div style={{ width: "100%", height: 220, marginTop: 20 }} />
      <div style={{ width: "100%", height: 220 }} />
    </div>
  );
}
