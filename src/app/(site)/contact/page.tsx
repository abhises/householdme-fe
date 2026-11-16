import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions, tips or spotted an error? Send the HouseholdMe team a message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="stack" style={{ minWidth: 0, maxWidth: 760, gap: 22 }}>
        <nav className="crumbs">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Contact</span>
        </nav>
        <span className="tag-blue">Contact us</span>
        <h1 className="h1" style={{ fontSize: "clamp(36px,5.6vw,60px)" }}>Get in touch</h1>
        <p className="lead" style={{ fontSize: 19 }}>Questions, tips or spotted an error? We’d love to hear from you.</p>
        <ContactForm />
        <p className="small" style={{ margin: 0 }}>
          We only use your details to reply to you. <Link href="/info/privacy" style={{ color: "var(--muted)" }}>Privacy policy</Link>
        </p>
      </div>
    </div>
  );
}
