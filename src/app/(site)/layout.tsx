import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { apiOr } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

interface LayoutData {
  categories: { slug: string; name: string }[];
  site: SiteSettings;
}

const FALLBACK: LayoutData = {
  categories: [],
  site: {
    disclosureBar: true,
    newsletterPopup: "off",
    stickyBuyBar: false,
    reviewerSlug: "",
    pricesCheckedLabel: "",
    footerAbout: "Independent buying guides, tested in a real home.",
    copyright: "© HouseholdMe Media LLC",
    newsletterImage: null,
  },
};

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { categories, site } = await apiOr<LayoutData>("/layout", FALLBACK);
  return (
    <div className="page">
      <Header site={site} categories={categories} />
      <main>{children}</main>
      <Footer site={site} categories={categories} />
    </div>
  );
}
