/**
 * Public origin of the site, without a trailing slash. SITE_URL is read at request
 * time (set on the server), so robots.txt and sitemap.xml are right even when the
 * image was built with a different NEXT_PUBLIC_SITE_URL.
 */
export function siteUrl(): string {
  const url = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";
  return url.replace(/\/+$/, "");
}
