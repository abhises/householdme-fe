import { GuideExtras } from "./GuideExtras";
import { PostEnhancer } from "./PostEnhancer";
import type { Guide, SiteSettings } from "@/lib/types";

/**
 * Comparison-table group headings are one cell spanning every column, so the cell itself can't stick while the
 * table scrolls sideways. Wrapping the text gives `.bq-cmp__group-label` something to pin to the left edge.
 */
const withStickyGroupLabels = (html: string) =>
  html.replace(/(<tr class="bq-cmp__group">\s*<th[^>]*>)(?!\s*<span class="bq-cmp__group-label")([\s\S]*?)(<\/th>)/g, '$1<span class="bq-cmp__group-label">$2</span>$3');

/** Renders a section / HTML post exactly as authored in the admin: its CSS, its HTML and its JSON-LD. */
export function PostView({ guide, site }: { guide: Guide; site: SiteSettings }) {
  const rootId = `post-${guide.id}`;
  const bar = guide.stickyBar;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags -- only section/HTML posts need this stylesheet; React hoists it into <head> */}
      <link rel="stylesheet" href="/sections.css" precedence="default" />
      {!guide.published && (
        <div style={{ background: "var(--red)", color: "#fff", textAlign: "center", padding: 8, fontSize: 13, fontWeight: 700 }}>Draft preview, not visible to readers</div>
      )}
      {guide.css && <style dangerouslySetInnerHTML={{ __html: guide.css }} />}
      {guide.jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: guide.jsonLd.replace(/</g, "\\u003c") }} />}
      <div id={rootId} className="bq-post" dangerouslySetInnerHTML={{ __html: withStickyGroupLabels(guide.html) }} />
      <PostEnhancer rootId={rootId} />
      {(bar?.url || guide.newsletterPopup) && (
        <GuideExtras
          popupMode={guide.newsletterPopup ? site.newsletterPopup : "off"}
          popupImage={site.newsletterImage ?? guide.coverImage}
          bar={bar?.url && bar.name ? { name: bar.name, score: bar.score ?? "", price: bar.price ?? "", shop: bar.shop || "the shop", href: bar.url, image: bar.image || null } : null}
        />
      )}
    </>
  );
}
