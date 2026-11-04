import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { NavLinks } from "./NavLinks";

interface Props {
  site: SiteSettings;
  categories: { slug: string; name: string }[];
}

export function Header({ site, categories }: Props) {
  return (
    <>
      {site.disclosureBar && (
        <div className="disclosure">
          We test independently. When you buy through our links, we may earn a commission.{" "}
          <Link href="/info/money">How we make money</Link>
        </div>
      )}
      <header className="site-header">
        <div className="wrap top">
          <Link href="/" className="logo">
            HouseholdMe
          </Link>
          <div className="header-actions">
            <Link href="/search" className="search-link">
              Search a product or buying guide
            </Link>
            <Link href="/newsletter" className="nl-link">
              Newsletter
            </Link>
          </div>
        </div>
        <nav className="site-nav">
          <NavLinks categories={categories} />
        </nav>
      </header>
    </>
  );
}
