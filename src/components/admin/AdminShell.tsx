"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { adminApi } from "@/lib/admin-api";

const NAV: { group: string; items: [string, string][] }[] = [
  { group: "Overview", items: [["Dashboard", "/admin"]] },
  {
    group: "Content",
    items: [
      ["Buying guides", "/admin/guides"],
      ["Products & reviews", "/admin/products"],
      ["Categories", "/admin/categories"],
      ["Authors", "/admin/authors"],
      ["Deals", "/admin/deals"],
      ["Info pages", "/admin/info-pages"],
    ],
  },
  {
    group: "Site",
    items: [
      ["Media library", "/admin/media"],
      ["Subscribers", "/admin/subscribers"],
      ["Settings", "/admin/settings"],
      ["Account", "/admin/account"],
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    adminApi<{ user: { email: string; name: string } }>("/api/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => {});
  }, []);

  const logout = async () => {
    await adminApi("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Full reload so the proxy sees the cleared cookie
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
  };

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="brand">
          <Link href="/admin" className="logo" style={{ fontSize: 20 }}>HouseholdMe</Link>
          <small>Admin panel</small>
        </div>
        <nav>
          {NAV.map((g) => (
            <div key={g.group} style={{ display: "contents" }}>
              <span className="group">{g.group}</span>
              {g.items.map(([label, href]) => (
                <Link key={href} href={href} className={isActive(href) ? "active" : undefined}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="foot">
          {user && <span style={{ color: "#fff", fontWeight: 700 }}>{user.email}</span>}
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
