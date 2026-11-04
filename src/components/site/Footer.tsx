import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function Footer({ site, categories }: { site: SiteSettings; categories: { slug: string; name: string }[] }) {
  return (
    <footer className="site-footer">
      <div className="wrap inner">
        <div className="cols">
          <div className="col" style={{ maxWidth: 380 }}>
            <span className="logo" style={{ fontSize: 22 }}>
              HouseholdMe
            </span>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{site.footerAbout}</p>
          </div>
          <div className="col">
            <strong>Categories</strong>
            {categories.slice(0, 4).map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </div>
          <div className="col">
            <strong>About us</strong>
            <Link href="/team">Editorial team</Link>
            <Link href="/how-we-test">How we test</Link>
            <Link href="/info/guidelines">Editorial guidelines</Link>
            <Link href="/info/contact">Contact</Link>
          </div>
          <div className="col">
            <strong>Transparency</strong>
            <Link href="/info/money">How we make money</Link>
            <Link href="/info/corrections">Corrections policy</Link>
            <Link href="/info/privacy">Privacy &amp; cookies</Link>
            <Link href="/info/terms">Terms of use</Link>
          </div>
        </div>
        <div className="bottom">
          <span>{site.copyright}</span>
          <span>Prices and availability are subject to change.</span>
        </div>
      </div>
    </footer>
  );
}
