// Shapes returned by the householdme-be API.

export interface QA { q: string; a: string }
export interface Change { date: string; text: string }
export interface KV { k: string; v: string }
export interface Shop { shop: string; price: number; url: string; note?: string }

export interface CategoryRef { slug: string; name: string }
export interface AuthorCard { slug: string; name: string; role: string; short: string; imageUrl: string | null }

export interface Category {
  id: string;
  slug: string;
  name: string;
  intro: string;
  sortOrder: number;
  _count?: { guides: number };
}

export interface Author extends AuthorCard {
  id: string;
  bio: string;
  trust: string;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  facts: { value: string; label: string }[];
  expertise: string[];
  career: { year: string; text: string }[];
  onTeam: boolean;
  isTester: boolean;
  sortOrder: number;
  _count?: { guides: number };
}

export interface GuideFull {
  titles?: Partial<Record<"buying" | "vs" | "vsToc" | "care" | "situations" | "mistakes", string>>;
  summary: string[];
  compare: {
    cols: { product: string; stars: number; reviews: string; was: number | null; highlight: boolean }[];
    groups: { heading: string; rows: { name: string; cells: string[]; better: "high" | "low" | null }[] }[];
  } | null;
  deep: { product: string; body: string[]; bestFor: string; specs: KV[]; scores: { k: string; v: number }[] }[];
  bars: { heading: string; note: string; rows: { name: string; value: string; pct: number }[] }[];
  buyIntro: string;
  buying: { heading: string; paragraphs: string[]; tip: string }[];
  tiers: { heading: string; text: string; pick: string }[];
  vsHead: string[];
  vsRows: string[][];
  vsNote: string;
  care: { heading: string; text: string }[];
  skip: { name: string; score: string; why: string }[];
  skipNote: string;
  next: { name: string; status: string; text: string }[];
  durable: string[];
  situations: { heading: string; text: string }[];
  specsIntro: string;
  specsExplained: { term: string; text: string }[];
  mistakes: { heading: string; text: string }[];
  verdict: string[];
  glossary: { term: string; definition: string }[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  guideId: string;
  rank: number;
  label: string;
  score: number;
  price: number;
  verdict: string;
  pros: string[];
  cons: string[];
  images: string[];
  subtitle: string | null;
  verdictLong: string | null;
  inUseSince: string | null;
  purchase: string | null;
  readTime: string | null;
  designText: string | null;
  videoUrl: string | null;
  goodFor: string[];
  notFor: string[];
  sources: string[];
  subScores: { label: string; value: number }[];
  shops: Shop[];
  priceHistory: { month: string; price: number }[];
  results: { label: string; value: string; average: string; pct: number; averagePct: number }[];
  longTerm: Change[];
  specs: KV[];
  compareRows: { name: string; cells: string[] }[];
  questions: { who: string; q: string; a: string }[];
  faq: QA[];
  changes: Change[];
  helpfulYes: number;
  helpfulNo: number;
  guide?: { id: string; title: string; slug: string; short: string };
}

export type PostType = "BUYING_GUIDE" | "SINGLE_REVIEW" | "COMPARISON" | "INFO_ARTICLE";

export const POST_TYPES: [PostType, string][] = [
  ["BUYING_GUIDE", "Buying Guide"],
  ["SINGLE_REVIEW", "Single Review"],
  ["COMPARISON", "Comparison"],
  ["INFO_ARTICLE", "Info Article"],
];

export const postTypeLabel = (t: PostType | undefined) => POST_TYPES.find(([v]) => v === t)?.[1] ?? "Buying Guide";

export interface Guide {
  id: string;
  slug: string;
  type: PostType;
  title: string;
  seoTitle: string | null;
  short: string;
  intro: string;
  published: boolean;
  categoryId: string;
  authorId: string;
  modelsTested: number;
  testWeeks: number;
  updatedLabel: string;
  publishedLabel: string;
  photoNote: string;
  coverImage: string | null;
  heroImage: string | null;
  testImage: string | null;
  forWho: string;
  howTested: string;
  howCaption: string | null;
  bought: string | null;
  criteria: string[];
  tableHead: string[] | null;
  tableRows: string[][] | null;
  tableNote: string | null;
  faq: QA[];
  sources: string[];
  changes: Change[];
  full: GuideFull | null;
  sortOrder: number;
  /* Section / HTML posts (BrasQ-style editor). Empty html + null sections = the classic guide template. */
  seoDescription: string | null;
  jsonLd: string | null;
  html: string;
  css: string;
  sections: SectionsDoc | null;
  stickyBar: StickyBar | null;
  newsletterPopup: boolean;
  category?: CategoryRef & { id?: string };
  author?: Author;
  products?: Product[];
}

/** Guide with the minimal relations used on cards */
export interface GuideCard extends Omit<Guide, "author" | "category" | "products"> {
  category: CategoryRef;
  author: { slug: string; name: string; role: string; imageUrl: string | null };
  products: { slug: string; name: string; rank: number }[];
}

export interface InfoPage {
  id: string;
  slug: string;
  title: string;
  lead: string;
  sections: { heading: string; body: string }[];
  sortOrder: number;
  updatedAt: string;
}

export interface Deal {
  id: string;
  productId: string;
  wasPrice: number;
  active: boolean;
  sortOrder: number;
  product: Product & { guide: { slug: string; short: string } };
}

export interface Subscriber { id: string; email: string; source: string | null; createdAt: string }

export interface Media {
  id: string;
  key: string;
  url: string;
  driver: string;
  filename: string;
  mimeType: string;
  size: number;
  alt: string;
  createdAt: string;
}

export interface SiteSettings {
  disclosureBar: boolean;
  newsletterPopup: "scroll" | "timer" | "direct" | "off";
  stickyBuyBar: boolean;
  reviewerSlug: string;
  pricesCheckedLabel: string;
  footerAbout: string;
  copyright: string;
  newsletterImage: string | null;
}

export interface HomeSettings {
  heroGuideSlug: string;
  heroIntro: string;
  heroSecondaryProductSlug: string;
  guideSlugs: string[];
  trustFacts: { value: string; label: string }[];
  testTitle: string;
  testText: string;
}

export interface MethodSettings {
  title: string;
  lead: string;
  image: string | null;
  steps: { n: string; title: string; text: string }[];
  weightsIntro: string;
  weights: { label: string; pct: number }[];
  principles: { title: string; text: string; href: string }[];
}

export interface AllSettings {
  site: SiteSettings;
  home: HomeSettings;
  method: MethodSettings;
}

export interface Paged<T> { items: T[]; total: number; page?: number; pageSize?: number }

/* ---------- Section-based posts (ported from the BrasQ post editor) ---------- */
export interface StickyBar { name: string; score?: string; price?: string; shop?: string; url: string; image?: string }
export type SectionFieldType = "text" | "textarea" | "richtext" | "number" | "image" | "link" | "select" | "toggle" | "list" | "post" | "product" | "cells" | "code";
export interface SectionFieldDef {
  key: string; label: string; type: SectionFieldType; required?: boolean; help?: string; placeholder?: string; default?: unknown;
  options?: string[]; fields?: SectionFieldDef[]; fill?: Record<string, string>; itemLabel?: string;
}
export interface SectionType {
  id: string; key: string; name: string; group: string; description: string; fields: SectionFieldDef[]; template: string; css: string;
  sample: Record<string, unknown>; tocLabel: string; placement: "top" | "body" | "bottom"; scope: "any" | "post" | "home";
  builtIn: boolean; version: number; updatedAt: string;
}
export interface SectionItem { id: string; type: string; data: Record<string, unknown>; hidden?: boolean; placement?: "top" | "body" | "bottom"; tocLabel?: string }
export interface SectionsDoc { layout: "toc" | "wide" | "raw"; className?: string; tocTitle?: string; backToTop?: boolean; items: SectionItem[] }

export interface CleaningService {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  logoUrl: string | null;
  googleRating: number | null;
  googleReviews: number | null;
  yelpRating: number | null;
  yelpReviews: number | null;
  services: string[];
  licensed: boolean;
  insured: boolean;
  backgroundChecked: boolean;
  notes: string;
  awards: { id: string; year: number; title: string; city: string; state: string }[];
}

export interface Award {
  id: string;
  serviceId: string;
  year: number;
  city: string;
  state: string;
  title: string;
  rank: number;
  score: number | null;
  whyItWon: string;
  published: boolean;
  notifiedAt: string | null;
  createdAt: string;
  service: Pick<CleaningService, "id" | "name" | "slug" | "city" | "state" | "email" | "logoUrl">;
}
