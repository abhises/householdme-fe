import type { MetadataRoute } from "next";
import { apiOr } from "@/lib/api";
import { siteUrl } from "@/lib/site-url";

// Content is edited live in the admin panel, so build the sitemap per request
export const dynamic = "force-dynamic";

type Entry = { slug: string; updatedAt: string };
type SitemapData = {
  categories: Entry[];
  guides: Entry[];
  products: Entry[];
  authors: Entry[];
  infoPages: Entry[];
};

const empty: SitemapData = { categories: [], guides: [], products: [], authors: [], infoPages: [] };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const data = await apiOr<SitemapData>("/sitemap", empty);

  const page = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
    lastModified?: string,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency,
    priority,
  });

  const latest = [...data.guides, ...data.products].map((e) => e.updatedAt).sort().at(-1);

  return [
    page("/", "daily", 1, latest),
    page("/deals", "daily", 0.7),
    page("/how-we-test", "monthly", 0.5),
    page("/team", "monthly", 0.4),
    page("/newsletter", "yearly", 0.3),
    ...data.categories.map((c) => page(`/category/${c.slug}`, "weekly", 0.8, c.updatedAt)),
    ...data.guides.map((g) => page(`/guide/${g.slug}`, "weekly", 0.9, g.updatedAt)),
    ...data.products.map((p) => page(`/review/${p.slug}`, "monthly", 0.7, p.updatedAt)),
    ...data.authors.map((a) => page(`/author/${a.slug}`, "monthly", 0.4, a.updatedAt)),
    ...data.infoPages.map((i) => page(`/info/${i.slug}`, "yearly", 0.2, i.updatedAt)),
  ];
}
