import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/site/NewsletterForm";

export const metadata: Metadata = { title: "Newsletter" };

export default function NewsletterPage() {
  return (
    <div className="stack" style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 72px", gap: 22 }}>
      <span className="tag-blue">Newsletter</span>
      <h1 className="h1" style={{ fontSize: "clamp(36px,5.6vw,60px)" }}>One email a week with what we really liked</h1>
      <p className="lead">Every Friday: new test results, updated buying guides and deals we&apos;ve compared against the price over the past 90 days.</p>
      <NewsletterForm variant="boxed" source="newsletter-page" doneClassName="nl-done-box" />
      <p className="small" style={{ margin: 0 }}>
        Unsubscribe with one click at the bottom of every email. We never share your email address.{" "}
        <Link href="/info/privacy" style={{ color: "var(--muted)" }}>Privacy policy</Link>
      </p>
    </div>
  );
}
