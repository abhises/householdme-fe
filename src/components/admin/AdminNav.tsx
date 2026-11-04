"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/admin-api";

// Same structure as the BrasQ admin sidebar.
const LINKS: [string, string][] = [
  ["/admin", "Buying guides"],
  ["/admin/guides/new", "New guide"],
  ["/admin/front-page", "Front page"],
  ["/admin/products", "Products & reviews"],
  ["/admin/media", "Media"],
  ["/admin/categories", "Categories"],
  ["/admin/authors", "Authors"],
  ["/admin/deals", "Deals"],
  ["/admin/info-pages", "Info pages"],
  ["/admin/subscribers", "Subscribers"],
  ["/admin/settings", "Settings"],
];

export function AdminNav() {
  const path = usePathname();
  const current = (href: string) =>
    href === "/admin"
      ? path === "/admin" || (path.startsWith("/admin/guides/") && path !== "/admin/guides/new")
      : path.startsWith(href);
  const nav = useRef<HTMLElement>(null);
  const [email, setEmail] = useState<string | null>(null);

  // On phones the nav is a sideways-scrolling row: keep the current section visible.
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [path]);
  useEffect(() => {
    adminApi<{ user: { email: string } }>("/api/auth/me")
      .then((r) => setEmail(r.user.email))
      .catch(() => {});
  }, []);

  const logout = async () => {
    await adminApi("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Full reload so the proxy sees the cleared cookie
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
  };

  return (
    <aside className="ad-side">
      <Link href="/admin" className="ad-side__logo">
        Household<span>Me</span>
      </Link>
      <nav ref={nav} className="ad-side__nav">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="ad-nav" aria-current={current(href) ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="ad-side__foot">
        {email && <span className="ad-side__user ad-cell-hide">{email}</span>}
        <Link href="/admin/account">Account</Link>
        <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}
