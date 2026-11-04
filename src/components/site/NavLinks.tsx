"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

// Guide and review pages mark their category with <ActiveCategory slug="..." />.
let activeSlug: string | null = null;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const setActive = (slug: string | null) => {
  activeSlug = slug;
  listeners.forEach((l) => l());
};

export function ActiveCategory({ slug }: { slug: string }) {
  useEffect(() => {
    setActive(slug);
    return () => setActive(null);
  }, [slug]);
  return null;
}

export function NavLinks({ categories }: { categories: { slug: string; name: string }[] }) {
  const pathname = usePathname();
  const marked = useSyncExternalStore(subscribe, () => activeSlug, () => null);
  const current = pathname.startsWith("/category/") ? pathname.split("/")[2] : marked;
  return (
    <div className="wrap inner">
      {categories.map((c) => (
        <Link key={c.slug} href={`/category/${c.slug}`} className={current === c.slug ? "active" : undefined}>
          {c.name}
        </Link>
      ))}
      <Link href="/deals" className="deals">
        Deals
      </Link>
      <Link href="/how-we-test" className="method">
        How we test
      </Link>
    </div>
  );
}
