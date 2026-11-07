"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/admin-api";

type Item = { href: string; label: string };
type Group = Item & { icon: keyof typeof ICONS; items?: Item[] };

// WordPress-style menu: top-level sections, with sub-items for the open section.
const MENU: Group[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/admin/guides",
    label: "Posts",
    icon: "posts",
    items: [
      { href: "/admin/guides", label: "All posts" },
      { href: "/admin/guides/new", label: "Add new" },
    ],
  },
  {
    href: "/admin/info-pages",
    label: "Pages",
    icon: "pages",
    items: [
      { href: "/admin/info-pages", label: "All pages" },
      { href: "/admin/front-page", label: "Front page" },
    ],
  },
  { href: "/admin/media", label: "Media", icon: "media" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/authors", label: "Authors", icon: "authors" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "subscribers" },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "settings",
    items: [
      { href: "/admin/settings", label: "General" },
      { href: "/admin/account", label: "My account" },
    ],
  },
];

const ICONS = {
  dashboard: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z",
  posts: "M4 4h16v4H4zm0 6h10v2H4zm0 4h16v2H4zm0 4h10v2H4z",
  pages: "M6 2h9l5 5v15H6zM15 2v5h5M9 12h8M9 16h8",
  media: "M3 5h18v14H3zm2 12h14l-4.5-6-3.5 4.5-2.5-3z",
  categories: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z",
  authors: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9m-8 9c0-4.4 3.6-7 8-7s8 2.6 8 7z",
  subscribers: "M3 5h18v14H3zm0 1 9 7 9-7",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19.4 13a7.4 7.4 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.4 7.4 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5z",
};

const matches = (path: string, href: string) =>
  href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/");

/** The most specific menu link for this path, so "Add new post" wins over "All posts". */
function currentHref(path: string) {
  let best = "";
  for (const g of MENU)
    for (const l of [g, ...(g.items ?? [])])
      if (matches(path, l.href) && l.href.length > best.length) best = l.href;
  return best;
}

export function AdminNav() {
  const path = usePathname();
  const current = currentHref(path);
  const isOpen = (g: Group) => current === g.href || !!g.items?.some((i) => i.href === current);
  const open = MENU.find(isOpen);
  const nav = useRef<HTMLElement>(null);
  const [email, setEmail] = useState<string | null>(null);

  // On phones the menu is a sideways-scrolling row: keep the current section visible.
  useEffect(() => {
    nav.current?.querySelector(".is-open > .ad-nav")?.scrollIntoView({ inline: "nearest", block: "nearest" });
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

  const subLinks = (items: Item[]) =>
    items.map((i) => (
      <Link key={i.href} href={i.href} className="ad-sub__link" aria-current={i.href === current ? "page" : undefined}>
        {i.label}
      </Link>
    ));

  return (
    <aside className="ad-side">
      <Link href="/admin" className="ad-side__logo">
        Household<span>Me</span>
      </Link>
      <nav ref={nav} className="ad-side__nav" aria-label="Admin">
        {MENU.map((g) => (
          <div key={g.href} className={`ad-grp${isOpen(g) ? " is-open" : ""}`}>
            <Link
              href={g.href}
              className="ad-nav"
              aria-current={isOpen(g) && !g.items ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="ad-nav__icon">
                <path d={ICONS[g.icon]} />
              </svg>
              {g.label}
            </Link>
            {g.items && <div className="ad-sub">{subLinks(g.items)}</div>}
          </div>
        ))}
      </nav>
      {/* phones: sub-items of the open section get their own row */}
      {open?.items && <div className="ad-side__subnav">{subLinks(open.items)}</div>}
      <div className="ad-side__foot">
        {email && <span className="ad-side__user ad-cell-hide">{email}</span>}
        <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}
