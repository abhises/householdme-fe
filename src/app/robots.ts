import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Read SITE_URL per request instead of baking it in at build time
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/search"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
