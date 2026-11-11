"use client";

/* eslint-disable @next/next/no-img-element */
// The post editor, ported from the BrasQ admin (/admin/posts/new). A post is built from sections (default for new
// posts) or written as plain HTML, with live preview, CSS and JSON-LD tabs. Guides made before sections existed keep
// the classic guide template and its form tabs until they are switched to sections.
import { css as cssLang } from "@codemirror/lang-css";
import { html as htmlLang } from "@codemirror/lang-html";
import { json as jsonLang } from "@codemirror/lang-json";
import type { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, errorText, slugify } from "@/lib/admin-api";
import { score } from "@/lib/format";
import { newId } from "@/lib/sections-client";
import {
  POST_TYPES, type AllSettings, type Author, type Category, type Guide, type GuideFull, type Media, type PostType,
  type SectionsDoc, type SectionType, type StickyBar,
} from "@/lib/types";
import { useConfirm } from "./ConfirmDialog";
import { EditorPreview } from "./Editor";
import { FormFields, ImageInput, type FieldDef } from "./FormFields";
import { MediaPicker } from "./MediaLibrary";
import { SectionsEditor, starterDoc } from "./SectionsEditor";

const EMPTY_BAR: Required<StickyBar> = { name: "", score: "", price: "", shop: "", url: "", image: "" };

const BLANK = {
  slug: "", type: "BUYING_GUIDE", title: "", seoTitle: null, seoDescription: null, jsonLd: null, short: "", intro: "", published: false,
  categoryId: "", authorId: "", modelsTested: 0, testWeeks: 0, updatedLabel: "", publishedLabel: "", photoNote: "", coverImage: null,
  heroImage: null, testImage: null, forWho: "", howTested: "", howCaption: null, bought: null, criteria: [], tableHead: null,
  tableRows: null, tableNote: null, faq: [], sources: [], changes: [], full: null, sortOrder: 0, html: "", css: "", sections: null,
  stickyBar: null, newsletterPopup: false,
} as unknown as Guide;

const emptyFull: GuideFull = {
  titles: {}, summary: [], compare: null, deep: [], bars: [], buyIntro: "", buying: [], tiers: [], vsHead: [], vsRows: [],
  vsNote: "", care: [], skip: [], skipNote: "", next: [], durable: [], situations: [], specsIntro: "", specsExplained: [],
  mistakes: [], verdict: [], glossary: [],
};

/** Fields the server accepts (relations and timestamps from the loaded record are left out) */
const toPayload = (f: Guide, bar: Required<StickyBar>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, category: _c, author: _a, products: _p, createdAt: _cr, updatedAt: _u, ...rest } = f as Guide & { createdAt?: string; updatedAt?: string };
  return { ...rest, slug: f.slug || slugify(f.short || f.title), short: f.short.trim() || f.title, stickyBar: bar.name && bar.url ? bar : null };
};

type CodeTab = "html" | "css" | "jsonld";
type ClassicTab = "content" | "table" | "faq" | "longform";
type Tab = "sections" | CodeTab | ClassicTab | "picks" | "preview";

/* ---------- classic guide template forms (guides made before sections) ---------- */
const CONTENT: FieldDef[] = [
  { key: "forWho", label: "Who is this for?", type: "textarea", rows: 5 },
  { key: "howTested", label: "How we tested", type: "textarea", rows: 5 },
  { key: "howCaption", label: "Test photo caption", type: "text" },
  { key: "bought", label: "How the products were obtained", type: "textarea", help: "Added to “Why you can trust us”, e.g. “We bought 18 of the 22 machines ourselves…”" },
  { key: "criteria", label: "Score criteria", type: "lines", help: "One per line, e.g. Suction, Battery, Ease of use, Noise. Used for the review score breakdown." },
];
const TABLE: FieldDef[] = [
  { key: "tableHead", label: "Header row", type: "cells", help: "Leave the table empty to show the picks with rank, score and price." },
  { key: "tableRows", label: "Rows", type: "table", rows: 8 },
  { key: "tableNote", label: "Note below the table", type: "text" },
];
const FAQ: FieldDef[] = [
  { key: "faq", label: "Questions", type: "list", itemLabel: "{{q}}", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
  { key: "sources", label: "Sources", type: "lines" },
  { key: "changes", label: "Changelog", type: "list", itemLabel: "{{date}} · {{text}}", fields: [{ key: "date", label: "Date", type: "text" }, { key: "text", label: "What changed", type: "text" }] },
];
const TITLES: FieldDef[] = [
  { key: "buying", label: "What to look for (heading)", type: "text", half: true },
  { key: "vs", label: "Product types table (heading)", type: "text", half: true },
  { key: "vsToc", label: "Product types (in the table of contents)", type: "text", half: true },
  { key: "care", label: "Maintenance (heading)", type: "text", half: true },
  { key: "situations", label: "Situations (heading)", type: "text", half: true },
  { key: "mistakes", label: "Mistakes (heading)", type: "text", half: true },
];
const pair = (a: string, al: string, b: string, bl: string, area = false): FieldDef[] => [
  { key: a, label: al, type: "text" },
  { key: b, label: bl, type: area ? "textarea" : "text" },
];
const longform = (products: { value: string; label: string }[]): FieldDef[] => [
  { key: "summary", label: "The short answer", type: "lines", rows: 6, help: "One point per line." },
  {
    key: "compare", label: "Compare side by side (JSON)", type: "json", rows: 18,
    help: "cols: products by slug with stars, reviews, was (old price) and highlight. In groups[].rows[].cells use \"y\"/\"n\" for yes/no and \"b9.1:91\" for a bar (label:percent). better: \"high\", \"low\" or null.",
  },
  {
    key: "deep", label: "Picks in depth", type: "list", itemLabel: "{{product}}",
    fields: [
      { key: "product", label: "Product", type: "select", options: products },
      { key: "bestFor", label: "Choose this if…", type: "text" },
      { key: "body", label: "Text", type: "paragraphs", rows: 8 },
      { key: "specs", label: "Measured", type: "list", itemLabel: "{{k}}: {{v}}", fields: pair("k", "Label", "v", "Value") },
      { key: "scores", label: "Score breakdown", type: "list", itemLabel: "{{k}}: {{v}}", fields: [{ key: "k", label: "Criterion", type: "text" }, { key: "v", label: "Score (0–10)", type: "number", step: 0.1 }] },
    ],
  },
  {
    key: "bars", label: "Results by test", type: "list", itemLabel: "{{heading}}",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "note", label: "Note", type: "textarea" },
      { key: "rows", label: "Results", type: "list", itemLabel: "{{name}} · {{value}}", fields: [{ key: "name", label: "Model", type: "text", half: true }, { key: "value", label: "Value shown", type: "text", half: true }, { key: "pct", label: "Bar length (%)", type: "number" }] },
    ],
  },
  { key: "buyIntro", label: "What to look for: intro", type: "textarea" },
  { key: "buying", label: "What to look for: topics", type: "list", itemLabel: "{{heading}}", fields: [{ key: "heading", label: "Heading", type: "text" }, { key: "paragraphs", label: "Text", type: "paragraphs", rows: 6 }, { key: "tip", label: "Our tip", type: "textarea" }] },
  { key: "tiers", label: "How much to spend", type: "list", itemLabel: "{{heading}}", fields: [{ key: "heading", label: "Tier", type: "text", half: true }, { key: "pick", label: "Pick line", type: "text", half: true }, { key: "text", label: "Text", type: "textarea" }] },
  { key: "vsHead", label: "Product types table: header", type: "cells", help: 'Start with " | " to leave the first column empty.' },
  { key: "vsRows", label: "Product types table: rows", type: "table" },
  { key: "vsNote", label: "Product types table: note", type: "textarea" },
  { key: "care", label: "Maintenance", type: "list", itemLabel: "{{heading}}", fields: pair("heading", "Heading", "text", "Text", true) },
  { key: "skip", label: "Tested but not recommended", type: "list", itemLabel: "{{name}} ({{score}})", fields: [{ key: "name", label: "Model", type: "text", half: true }, { key: "score", label: "Score", type: "text", half: true }, { key: "why", label: "Why not", type: "textarea" }] },
  { key: "skipNote", label: "Not recommended: note", type: "textarea" },
  { key: "next", label: "What we're testing now", type: "list", itemLabel: "{{name}}", fields: [{ key: "name", label: "Model", type: "text", half: true }, { key: "status", label: "Status", type: "text", half: true }, { key: "text", label: "Text", type: "textarea" }] },
  { key: "durable", label: "Durability, warranty and repair", type: "paragraphs", rows: 6 },
  { key: "situations", label: "Situations", type: "list", itemLabel: "{{heading}}", fields: pair("heading", "Heading", "text", "Text", true) },
  { key: "specsIntro", label: "Numbers on the box: intro", type: "textarea" },
  { key: "specsExplained", label: "Numbers on the box", type: "list", itemLabel: "{{term}}", fields: pair("term", "Term", "text", "Explanation", true) },
  { key: "mistakes", label: "Mistakes", type: "list", itemLabel: "{{heading}}", fields: pair("heading", "Heading", "text", "Text", true) },
  { key: "verdict", label: "Our final verdict", type: "paragraphs", rows: 6 },
  { key: "glossary", label: "Glossary", type: "list", itemLabel: "{{term}}", fields: pair("term", "Term", "definition", "Definition", true) },
];

const FONTS = "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

export function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [form, setForm] = useState<Guide>(BLANK);
  const [bar, setBarState] = useState<Required<StickyBar>>(EMPTY_BAR);
  const [loaded, setLoaded] = useState(!id);
  const [cats, setCats] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [home, setHome] = useState<AllSettings["home"] | null>(null);
  /** "Home page hero" ticked in this editor (saved to the home page settings on save) */
  const [makeHero, setMakeHero] = useState(false);
  const [tab, setTab] = useState<Tab>("sections");
  const [split, setSplit] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  /** bumps when the record is (re)loaded so the classic form fields re-read their value */
  const [version, setVersion] = useState(0);
  const [picker, setPicker] = useState<null | "insert" | "cover" | "bar">(null);
  const views = useRef<Partial<Record<"html" | "css", EditorView>>>({});
  const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  /** true once the editor touched the sections, so changing the post type no longer swaps the starter */
  const [sectionsTouched, setSectionsTouched] = useState(false);
  const [sectionsHtml, setSectionsHtml] = useState("");
  const [previewError, setPreviewError] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);

  const usesSections = form.sections !== null;
  /** A guide made before sections: rendered by the classic template, edited with its form tabs */
  const classic = !!id && !usesSections && !form.html.trim();

  const load = useCallback((g: Guide) => {
    setForm({ ...BLANK, ...g, html: g.html ?? "", css: g.css ?? "" });
    setBarState({ ...EMPTY_BAR, ...(g.stickyBar ?? {}) } as Required<StickyBar>);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    adminApi<{ items: Category[] }>("/categories").then((d) => setCats(d.items)).catch(() => {});
    adminApi<{ items: Author[] }>("/authors").then((d) => setAuthors(d.items)).catch(() => {});
    adminApi<{ values: AllSettings }>("/settings").then((d) => setHome(d.values.home)).catch(() => {});
    adminApi<{ types: SectionType[] }>("/section-types").then((d) => {
      setSectionTypes(d.types);
      // a new post starts from the section layout of its type
      if (!id) setForm((f) => (f.sections === null && !f.html ? { ...f, sections: starterDoc(f.type, d.types) } : f));
    }).catch((e) => setMsg({ ok: false, text: errorText(e) }));
    if (id) {
      adminApi<Guide>(`/guides/${id}`)
        .then((g) => {
          load(g);
          setTab(g.sections ? "sections" : g.html?.trim() ? "html" : "content");
          setLoaded(true);
        })
        .catch((e) => setMsg({ ok: false, text: errorText(e) }));
    }
  }, [id, load]);

  const set = <K extends keyof Guide>(k: K, v: Guide[K]) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
  const patch = (p: Partial<Guide>) => { setForm((f) => ({ ...f, ...p })); setDirty(true); };
  const setBar = (k: keyof StickyBar, v: string) => { setBarState((b) => ({ ...b, [k]: v })); setDirty(true); };

  const isHero = !!home && !!form.slug && home.heroGuideSlug === form.slug;

  const save = useCallback(async (override?: Partial<Guide>) => {
    const f = { ...form, ...override };
    if (!f.title.trim()) { setMsg({ ok: false, text: "Title is required" }); return; }
    if (!f.categoryId) { setMsg({ ok: false, text: "Choose a category" }); return; }
    if (!f.authorId) { setMsg({ ok: false, text: "Choose an author" }); return; }
    if (f.jsonLd?.trim()) { try { JSON.parse(f.jsonLd); } catch { setMsg({ ok: false, text: "JSON-LD is not valid JSON" }); return; } }
    setSaving(true); setMsg(null);
    try {
      const body = toPayload(f, bar);
      const g = id
        ? await adminApi<Guide>(`/guides/${id}`, { method: "PUT", json: body })
        : await adminApi<Guide>("/guides", { method: "POST", json: body });
      if (makeHero && home && home.heroGuideSlug !== g.slug) {
        const next = { ...home, heroGuideSlug: g.slug };
        await adminApi(`/settings/home`, { method: "PUT", json: next });
        setHome(next); setMakeHero(false);
      }
      load(g); setDirty(false); setSavedAt(Date.now());
      setMsg({ ok: true, text: `Saved ${new Date().toLocaleTimeString()}` });
      if (!id) router.replace(`/admin/guides/${g.id}`);
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    } finally { setSaving(false); }
  }, [form, bar, id, router, load, makeHero, home]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [save, dirty]);

  /** New posts: swap in the starter sections for another type until the sections were edited. */
  const changeType = (type: PostType) => {
    if (!id && form.sections && !sectionsTouched) { setForm((f) => ({ ...f, type, sections: starterDoc(type, sectionTypes) })); setSelected(null); setDirty(true); }
    else set("type", type);
  };

  const setSections = (doc: SectionsDoc) => { set("sections", doc); setSectionsTouched(true); };

  /** HTML (or classic) post -> sections. HTML becomes one Custom HTML section so the page looks the same. */
  const useSectionsMode = async () => {
    if (classic) {
      if (!(await confirm({ title: "Build this post with sections?", message: "The page stops using the classic guide template and starts from the section layout for its type. The classic fields are kept but no longer shown on the site.", confirmLabel: "Use sections" }))) return;
      const doc = starterDoc(form.type, sectionTypes);
      patch({ sections: doc }); setSelected(doc.items[0]?.id ?? null); setTab("sections");
      return;
    }
    if (!(await confirm({ title: "Edit this post with sections?", message: "The current HTML becomes one “Custom HTML” section, so the page looks the same. You can then add sections around it, or rebuild it section by section.", confirmLabel: "Use sections" }))) return;
    const items = form.html.trim() ? [{ id: newId(), type: "custom-html", data: { html: form.html, tocTitle: "" } }] : [];
    patch({ sections: { layout: form.html.trim() ? "raw" : "toc", items } }); setSelected(items[0]?.id ?? null); setTab("sections");
  };
  /** Sections -> hand-written HTML, starting from the HTML the sections produce now. */
  const useHtmlMode = async () => {
    if (!(await confirm({ title: "Edit the HTML by hand?", message: "The post stops using sections. You keep the HTML they produce now and edit it directly. Section forms will no longer update this post.", confirmLabel: "Edit HTML" }))) return;
    patch({ html: sectionsHtml || form.html, sections: null }); setTab("html");
  };

  const remove = async () => {
    if (!id || !(await confirm({ title: `Delete "${form.title}"?`, message: "The post and all its products (reviews) are deleted. This cannot be undone." }))) return;
    try {
      await adminApi(`/guides/${id}`, { method: "DELETE" });
      setDirty(false);
      router.push("/admin/guides");
    } catch (e) { setMsg({ ok: false, text: errorText(e) }); }
  };

  const onPicked = (m: Media) => {
    if (picker === "cover") set("coverImage", m.url);
    else if (picker === "bar") setBar("image", m.url);
    else {
      const view = views.current[tab === "css" ? "css" : "html"];
      const snippet = tab === "css" ? `url("${m.url}")` : `<img src="${m.url}" alt="${m.alt ?? ""}" loading="lazy">`;
      if (view) {
        const { from, to } = view.state.selection.main;
        view.dispatch({ changes: { from, to, insert: snippet }, selection: { anchor: from + snippet.length } });
        view.focus();
      } else set("html", form.html + "\n" + snippet);
    }
    setPicker(null);
  };

  // Live preview of the sections, rendered by the server with the post settings from the form (debounced).
  useEffect(() => {
    if (!form.sections) return;
    const t = setTimeout(() => {
      adminApi<{ html: string }>("/guides/preview", {
        method: "POST",
        json: {
          sections: form.sections, type: form.type, slug: form.slug || "preview", title: form.title, intro: form.intro,
          coverImage: form.coverImage, heroImage: form.heroImage, modelsTested: form.modelsTested, testWeeks: form.testWeeks,
          updatedLabel: form.updatedLabel, publishedLabel: form.publishedLabel, categoryId: form.categoryId || null,
          authorId: form.authorId || null, guideId: id ?? null,
        },
      }).then((r) => { setSectionsHtml(r.html); setPreviewError(""); }).catch((e) => setPreviewError(errorText(e)));
    }, 350);
    return () => clearTimeout(t);
  }, [form.sections, form.type, form.slug, form.title, form.intro, form.coverImage, form.heroImage, form.modelsTested, form.testWeeks, form.updatedLabel, form.publishedLabel, form.categoryId, form.authorId, id]);

  const pageHtml = usesSections ? sectionsHtml : form.html;
  /** Scroll position of the preview, kept when it reloads with new content */
  const previewScroll = useRef(0);
  const [doc, setDoc] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      previewScroll.current = frame.current?.contentWindow?.scrollY ?? previewScroll.current;
      const origin = window.location.origin;
      setDoc(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${origin}/" target="_blank">
<link href="${FONTS}" rel="stylesheet"><link rel="stylesheet" href="${origin}/sections.css">
<style>body{margin:0;background:#fff}.bq-sec.is-selected{outline:2px dashed var(--orange);outline-offset:8px}${form.css}</style></head><body class="bq-post">${pageHtml}</body></html>`);
    }, 300);
    return () => clearTimeout(t);
  }, [pageHtml, form.css]);

  /** Outline the selected section in the preview and scroll it into view. */
  const markSelected = useCallback((scroll: boolean) => {
    const d = frame.current?.contentDocument;
    if (!d) return;
    d.querySelectorAll(".bq-sec.is-selected").forEach((el) => el.classList.remove("is-selected"));
    const el = selected ? d.querySelector(`[data-section="${CSS.escape(selected)}"]`) : null;
    if (el) { el.classList.add("is-selected"); if (scroll) el.scrollIntoView({ block: "start", behavior: "smooth" }); }
  }, [selected]);
  useEffect(() => { markSelected(true); }, [markSelected]);

  const extensions = useMemo(() => ({ html: [htmlLang()], css: [cssLang()], jsonld: [jsonLang()] }), []);
  const slug = form.slug || slugify(form.short || form.title);
  const liveUrl = id && form.slug ? `/${form.slug}${form.published ? "" : "?preview=1"}` : null;

  if (!loaded) return <p>{msg?.text ?? "Loading…"}</p>;

  const code = (which: CodeTab) => (
    <div className="ad-code">
      <CodeMirror
        value={which === "jsonld" ? form.jsonLd ?? "" : form[which]}
        extensions={extensions[which]}
        onChange={(v) => (which === "jsonld" ? set("jsonLd", v || null) : set(which, v))}
        onCreateEditor={(view) => { if (which !== "jsonld") views.current[which] = view; }}
        basicSetup={{ foldGutter: true, highlightActiveLine: true }}
      />
    </div>
  );
  const preview = classic ? (
    <EditorPreview url={id ? `/${form.slug}` : null} reloadKey={savedAt} mobile={mobile} />
  ) : (
    <div className={`ad-preview${mobile ? " ad-preview--mobile" : ""}`}>
      <iframe ref={frame} title="Preview" srcDoc={doc} sandbox="allow-same-origin allow-popups" onLoad={() => { frame.current?.contentWindow?.scrollTo(0, previewScroll.current); markSelected(false); }} />
    </div>
  );

  const products = (form.products ?? []).map((p) => ({ value: p.slug, label: p.name }));
  const nullIfEmpty = <T,>(v: T[] | null) => (v && v.length ? v : null);
  const picks = (
    <div className="ad-panel">
      <div className="ad-head" style={{ margin: 0 }}>
        <h2>Products in this post</h2>
        {id && <Link href={`/admin/products/new?guideId=${id}`} className="ad-btn ad-btn--sm ad-btn--primary">+ Add product</Link>}
      </div>
      <p className="ad-hint">Products get their own review page and can be used in Picks and Head-to-head sections. Ordered by rank: 0 = our pick, 1 = budget pick, 2 = upgrade.</p>
      {!id ? <p className="ad-hint">Save the post first.</p> : (
        <table className="ad-table">
          <thead><tr><th>Rank</th><th>Product</th><th>Label</th><th>Score</th><th></th></tr></thead>
          <tbody>
            {(form.products ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.rank}</td>
                <td className="ad-cell-main"><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                <td><span className="ad-pill">{p.label}</span></td>
                <td>{score(p.score)}</td>
                <td className="ad-cell-end"><Link href={`/admin/products/${p.id}`} className="ad-btn ad-btn--sm">Edit</Link></td>
              </tr>
            ))}
            {(form.products ?? []).length === 0 && <tr><td colSpan={5}>No products yet.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
  const classicPanel = (
    <div className="ad-tabpanel" key={`${version}-${tab}`}>
      {tab === "content" && <FormFields fields={CONTENT} value={form} onChange={(v) => patch(v as Partial<Guide>)} />}
      {tab === "table" && <FormFields fields={TABLE} value={form} onChange={(v) => patch({ ...v, tableHead: nullIfEmpty(v.tableHead), tableRows: nullIfEmpty(v.tableRows) } as Partial<Guide>)} />}
      {tab === "faq" && <FormFields fields={FAQ} value={form} onChange={(v) => patch(v as Partial<Guide>)} />}
      {tab === "longform" && (
        <>
          <div className="ad-panel ad-form">
            <label className="ad-check">
              <input type="checkbox" checked={!!form.full} onChange={(e) => set("full", e.target.checked ? (form.full ?? emptyFull) : null)} />
              Long-form guide (short answer, comparison table, picks in depth, buying advice, glossary…)
            </label>
          </div>
          {form.full && (
            <>
              <div className="ad-panel">
                <h2>Section titles</h2>
                <p className="ad-hint">Optional headings that mention the product type.</p>
                <FormFields fields={TITLES} value={form.full.titles ?? {}} onChange={(t) => set("full", { ...form.full!, titles: t })} />
              </div>
              <FormFields fields={longform(products)} value={form.full} onChange={(v) => set("full", v as GuideFull)} />
            </>
          )}
        </>
      )}
    </div>
  );

  const tabs: [Tab, string][] = classic
    ? [["content", "Content"], ["table", "Results table"], ["faq", "FAQ & sources"], ["longform", "Long-form sections"], ["picks", "Products"]]
    : [...(usesSections ? ([["sections", "Sections"]] as [Tab, string][]) : []), ["html", "HTML"], ["css", "CSS"], ["jsonld", "JSON-LD"], ["picks", "Products"]];
  if (!split) tabs.push(["preview", "Preview"]);

  const work =
    tab === "preview" ? preview
      : tab === "picks" ? picks
        : classic ? classicPanel
          : tab === "sections" && form.sections ? <SectionsEditor doc={form.sections} onChange={setSections} selected={selected} onSelect={setSelected} types={sectionTypes} />
            : tab === "html" && usesSections ? (
              <div className="ad-code-wrap">
                <div className="se-htmlbar"><span className="ad-hint">This HTML is generated from the sections and updates when you save. {previewError && <span className="ad-error">{previewError}</span>}</span><button className="ad-btn ad-btn--sm" onClick={useHtmlMode}>Edit HTML by hand</button></div>
                <div className="ad-code"><CodeMirror value={sectionsHtml} extensions={extensions.html} readOnly editable={false} basicSetup={{ foldGutter: true }} /></div>
              </div>
            ) : code(tab === "css" || tab === "jsonld" ? tab : "html");

  return (
    <>
      <div className="ad-head">
        <h1>{id ? form.title || "Untitled" : "New post"}</h1>
        <div className="ad-savebar">
          {msg && <span className={msg.ok ? "ad-ok" : "ad-error"}>{msg.text}</span>}
          {dirty && !msg && <span className="ad-hint">Unsaved changes</span>}
          {liveUrl && <a className="ad-btn" href={liveUrl} target="_blank" rel="noreferrer">Open on site ↗</a>}
          {id && <button className="ad-btn ad-btn--danger" onClick={remove}>Delete</button>}
          {!form.published
            ? <><button className="ad-btn" disabled={saving} onClick={() => save()}>Save draft</button><button className="ad-btn ad-btn--primary" disabled={saving} onClick={() => save({ published: true })}>Publish</button></>
            : <><button className="ad-btn" disabled={saving} onClick={() => save({ published: false })}>Unpublish</button><button className="ad-btn ad-btn--primary" disabled={saving} onClick={() => save()}>Update</button></>}
        </div>
      </div>

      <div className="ad-editor">
        <div className="ad-editor__meta ad-form" key={version}>
          <label>Title<input value={form.title} onChange={(e) => set("title", e.target.value)} /></label>
          <div className="ad-2">
            <label>Type
              <select value={form.type} onChange={(e) => changeType(e.target.value as PostType)}>
                {POST_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>Status
              <select value={form.published ? "published" : "draft"} onChange={(e) => set("published", e.target.value === "published")}>
                <option value="draft">Draft</option><option value="published">Published</option>
              </select>
            </label>
          </div>
          <label>Slug<input value={form.slug} placeholder="from title" onChange={(e) => set("slug", e.target.value)} />
            <span className="ad-hint">/{slug || "…"}</span></label>
          <label>Excerpt<textarea style={{ fontFamily: "var(--sans)", fontSize: 13, minHeight: 70 }} value={form.intro} onChange={(e) => set("intro", e.target.value)} />
            <span className="ad-hint">Used on cards, in search and as fallback meta description.</span></label>
          <div className="ad-2">
            <label>Category
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Author
              <select value={form.authorId} onChange={(e) => set("authorId", e.target.value)}>
                <option value="">—</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          </div>
          <label>Cover image
            <div style={{ display: "flex", gap: 6 }}><input value={form.coverImage ?? ""} onChange={(e) => set("coverImage", e.target.value || null)} /><button type="button" className="ad-btn ad-btn--sm" onClick={() => setPicker("cover")}>Pick</button></div>
            {form.coverImage && <img src={form.coverImage} alt="" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", marginTop: 4 }} />}
          </label>

          <fieldset>
            <legend>Card details</legend>
            <div className="ad-2">
              <label>Models tested<input type="number" value={form.modelsTested} onChange={(e) => set("modelsTested", Number(e.target.value))} /></label>
              <label>Test weeks<input type="number" value={form.testWeeks} onChange={(e) => set("testWeeks", Number(e.target.value))} /></label>
            </div>
            <label>Short name<input value={form.short} placeholder={form.title || "Stick vacuums"} onChange={(e) => set("short", e.target.value)} />
              <span className="ad-hint">Breadcrumbs, menus and search. Defaults to the title.</span></label>
            <div className="ad-2">
              <label>Updated<input value={form.updatedLabel} placeholder="October 3, 2026" onChange={(e) => set("updatedLabel", e.target.value)} /></label>
              <label>First published<input value={form.publishedLabel} placeholder="February 14, 2026" onChange={(e) => set("publishedLabel", e.target.value)} /></label>
            </div>
            <label className="ad-check"><input type="checkbox" checked={isHero || makeHero} disabled={isHero} onChange={(e) => { setMakeHero(e.target.checked); setDirty(true); }} />Home page hero</label>
            {isHero && <span className="ad-hint">This post is the home page hero. Tick another post to replace it.</span>}
          </fieldset>

          {classic && (
            <fieldset>
              <legend>Classic template images</legend>
              <div className="sf-field"><span className="sf-label">Lead photo</span><ImageInput value={form.heroImage ?? ""} onChange={(v) => set("heroImage", v || null)} /><span className="ad-hint">Top of the guide and the home page hero.</span></div>
              <div className="sf-field"><span className="sf-label">Test setup photo</span><ImageInput value={form.testImage ?? ""} onChange={(v) => set("testImage", v || null)} /></div>
              <label>Placeholder note<input value={form.photoNote} placeholder="stick vacuums in the test house" onChange={(e) => set("photoNote", e.target.value)} /></label>
            </fieldset>
          )}

          <fieldset>
            <legend>SEO</legend>
            <label>SEO title<input value={form.seoTitle ?? ""} placeholder={`${form.title} – HouseholdMe`} onChange={(e) => set("seoTitle", e.target.value || null)} /></label>
            <label>Meta description<textarea style={{ fontFamily: "var(--sans)", fontSize: 13, minHeight: 60 }} value={form.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value || null)} /></label>
            <span className="ad-hint">{classic ? "Structured data (JSON-LD) is generated automatically for long-form classic guides." : "Structured data (JSON-LD) is edited in its own tab."}</span>
          </fieldset>

          <fieldset>
            <legend>Conversion</legend>
            <label className="ad-check"><input type="checkbox" checked={form.newsletterPopup} onChange={(e) => set("newsletterPopup", e.target.checked)} />Newsletter popup</label>
            <span className="ad-hint">Shown as set under Settings (after scrolling, on a timer…). Long-form classic guides always show it.</span>
            <span className="ad-hint">Sticky “our pick” bar. Shown when name and URL are filled in.</span>
            <label>Product name<input value={bar.name} onChange={(e) => setBar("name", e.target.value)} /></label>
            <div className="ad-2">
              <label>Score<input value={bar.score} onChange={(e) => setBar("score", e.target.value)} /></label>
              <label>Price<input value={bar.price} placeholder="$339" onChange={(e) => setBar("price", e.target.value)} /></label>
            </div>
            <label>Shop<input value={bar.shop} placeholder="Amazon" onChange={(e) => setBar("shop", e.target.value)} /></label>
            <label>Affiliate URL<input value={bar.url} onChange={(e) => setBar("url", e.target.value)} /></label>
            <label>Image<div style={{ display: "flex", gap: 6 }}><input value={bar.image} onChange={(e) => setBar("image", e.target.value)} /><button type="button" className="ad-btn ad-btn--sm" onClick={() => setPicker("bar")}>Pick</button></div></label>
          </fieldset>
        </div>

        <div className="ad-editor__work">
          <div className="ad-tabs" role="tablist">
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
            ))}
            <span className="ad-tabs__spacer" />
            {!usesSections && <button onClick={useSectionsMode} title="Build this post from sections">Use sections</button>}
            {!classic && (tab === "html" || tab === "css") && !(usesSections && tab === "html") && <button onClick={() => setPicker("insert")} title="Upload or pick an image and insert it at the cursor">+ Image</button>}
            <button onClick={() => { setSplit(!split); if (tab === "preview") setTab(classic ? "content" : usesSections ? "sections" : "html"); }}>{split ? "Full-width editor" : "Side-by-side preview"}</button>
            <button aria-pressed={mobile} onClick={() => setMobile(!mobile)}>{mobile ? "Mobile" : "Desktop"} preview</button>
          </div>
          <div className={`ad-split${split ? " ad-split--side" : ""}`}>
            {work}
            {split && tab !== "preview" && preview}
          </div>
          <p className="ad-hint">
            {classic
              ? "This post uses the classic guide template; the preview shows it as last saved. Ctrl/⌘+S saves."
              : <>The HTML is the whole page body, rendered inside the site header and footer with <a href="/sections.css" target="_blank">sections.css</a>. Ctrl/⌘+S saves.</>}
          </p>
        </div>
      </div>

      {picker && <MediaPicker onPick={onPicked} onClose={() => setPicker(null)} />}
    </>
  );
}
