"use client";

/* eslint-disable @next/next/no-img-element */
// The site page editor (privacy, terms, guidelines…), built like the post editor: sections (default for new pages)
// or plain HTML, with live preview, CSS and JSON-LD tabs. Pages made before sections existed open already converted
// to sections (nothing changes on the site until they're saved). The contact page is a form and isn't edited here.
import { css as cssLang } from "@codemirror/lang-css";
import { html as htmlLang } from "@codemirror/lang-html";
import { json as jsonLang } from "@codemirror/lang-json";
import type { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, errorText, slugify } from "@/lib/admin-api";
import { newId } from "@/lib/sections-client";
import { CONTACT_PAGE_SLUG, type InfoPage, type Media, type SectionsDoc, type SectionType } from "@/lib/types";
import { useConfirm } from "./ConfirmDialog";
import { MediaPicker } from "./MediaLibrary";
import { pageStarterDoc, SectionsEditor } from "./SectionsEditor";

const BLANK: InfoPage = {
  id: "", slug: "", title: "", lead: "", sections: [], sortOrder: 0, published: false, seoTitle: null, seoDescription: null,
  coverImage: null, jsonLd: null, html: "", css: "", doc: null, updatedAt: "",
};

/** A classic page (heading/text list) as sections: Page header, one Text section per heading, Page links. */
function classicToDoc(p: InfoPage, types: SectionType[]): SectionsDoc {
  const starter = pageStarterDoc(types);
  const texts = p.sections.map((s) => ({ id: newId(), type: "text", data: { heading: s.heading, body: s.body } }));
  return {
    ...starter,
    items: texts.length
      ? [...starter.items.filter((s) => s.type === "page-header"), ...texts, ...starter.items.filter((s) => s.type === "page-links")]
      : starter.items,
  };
}

/** Fields the server accepts */
const toPayload = (p: InfoPage) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, updatedAt: _u, ...rest } = p as InfoPage & { createdAt?: string };
  delete (rest as { createdAt?: string }).createdAt;
  return { ...rest, slug: p.slug || slugify(p.title) };
};

type CodeTab = "html" | "css" | "jsonld";
type Tab = "sections" | CodeTab | "preview";

const FONTS = "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

export function PageEditor({ id }: { id?: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [form, setForm] = useState<InfoPage>(BLANK);
  const [loaded, setLoaded] = useState(!id);
  const [tab, setTab] = useState<Tab>("sections");
  const [split, setSplit] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(0);
  const [picker, setPicker] = useState<null | "insert" | "cover">(null);
  const views = useRef<Partial<Record<"html" | "css", EditorView>>>({});
  const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sectionsHtml, setSectionsHtml] = useState("");
  const [previewError, setPreviewError] = useState("");
  /** The page was made with the old heading/text layout and has just been converted to sections (not saved yet) */
  const [converted, setConverted] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  const usesSections = form.doc !== null;
  const isContact = form.slug === CONTACT_PAGE_SLUG && !!id;

  const load = useCallback((p: InfoPage) => {
    setForm({ ...BLANK, ...p, html: p.html ?? "", css: p.css ?? "" });
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    Promise.all([
      adminApi<{ types: SectionType[] }>("/section-types?scope=page"),
      id ? adminApi<InfoPage>(`/info-pages/${id}`) : Promise.resolve(null),
    ])
      .then(([{ types }, p]) => {
        setSectionTypes(types);
        if (!p) {
          // a new page starts from the page layout
          setForm((f) => (f.doc === null && !f.html ? { ...f, doc: pageStarterDoc(types) } : f));
          return;
        }
        const classic = !p.doc && !p.html?.trim() && p.slug !== CONTACT_PAGE_SLUG;
        load(classic ? { ...p, doc: classicToDoc(p, types) } : p);
        setConverted(classic);
        setTab(p.doc || classic ? "sections" : "html");
        setLoaded(true);
      })
      .catch((e) => setMsg({ ok: false, text: errorText(e) }));
  }, [id, load]);

  const set = <K extends keyof InfoPage>(k: K, v: InfoPage[K]) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
  const patch = (p: Partial<InfoPage>) => { setForm((f) => ({ ...f, ...p })); setDirty(true); };

  const save = useCallback(async (override?: Partial<InfoPage>) => {
    const f = { ...form, ...override };
    if (!f.title.trim()) { setMsg({ ok: false, text: "Title is required" }); return; }
    if (f.jsonLd?.trim()) { try { JSON.parse(f.jsonLd); } catch { setMsg({ ok: false, text: "JSON-LD is not valid JSON" }); return; } }
    setSaving(true); setMsg(null);
    try {
      const body = toPayload(f);
      const p = id
        ? await adminApi<InfoPage>(`/info-pages/${id}`, { method: "PUT", json: body })
        : await adminApi<InfoPage>("/info-pages", { method: "POST", json: body });
      load(p); setDirty(false); setConverted(false);
      setMsg({ ok: true, text: `Saved ${new Date().toLocaleTimeString()}` });
      if (!id) router.replace(`/admin/info-pages/${p.id}`);
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    } finally { setSaving(false); }
  }, [form, id, router, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [save, dirty]);

  /** HTML page -> sections. The HTML becomes one Custom HTML section, so the page looks the same. */
  const useSectionsMode = async () => {
    if (!(await confirm({ title: "Edit this page with sections?", message: "The current HTML becomes one “Custom HTML” section, so the page looks the same. You can then add sections around it.", confirmLabel: "Use sections" }))) return;
    const items = form.html.trim() ? [{ id: newId(), type: "custom-html", data: { html: form.html, tocTitle: "" } }] : [];
    patch({ doc: { layout: form.html.trim() ? "raw" : "toc", tocTitle: "On this page", className: "bq-page", items } }); setSelected(items[0]?.id ?? null); setTab("sections");
  };
  /** Sections -> hand-written HTML, starting from the HTML the sections produce now. */
  const useHtmlMode = async () => {
    if (!(await confirm({ title: "Edit the HTML by hand?", message: "The page stops using sections. You keep the HTML they produce now and edit it directly.", confirmLabel: "Edit HTML" }))) return;
    patch({ html: sectionsHtml || form.html, doc: null }); setTab("html");
  };

  const remove = async () => {
    if (!id || !(await confirm({ title: `Delete "${form.title}"?`, message: `/info/${form.slug} will show “page not found”. Links in the footer may point to it. This cannot be undone.` }))) return;
    try {
      await adminApi(`/info-pages/${id}`, { method: "DELETE" });
      setDirty(false);
      router.push("/admin/info-pages");
    } catch (e) { setMsg({ ok: false, text: errorText(e) }); }
  };

  const onPicked = (m: Media) => {
    if (picker === "cover") set("coverImage", m.url);
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

  // Live preview of the sections, rendered by the server (debounced).
  useEffect(() => {
    if (!form.doc) return;
    const t = setTimeout(() => {
      adminApi<{ html: string }>("/info-pages/preview", {
        method: "POST",
        json: { doc: form.doc, slug: form.slug || "preview", title: form.title, lead: form.lead, coverImage: form.coverImage },
      }).then((r) => { setSectionsHtml(r.html); setPreviewError(""); }).catch((e) => setPreviewError(errorText(e)));
    }, 350);
    return () => clearTimeout(t);
  }, [form.doc, form.slug, form.title, form.lead, form.coverImage]);

  const pageHtml = usesSections ? sectionsHtml : form.html;
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

  const markSelected = useCallback((scroll: boolean) => {
    const d = frame.current?.contentDocument;
    if (!d) return;
    d.querySelectorAll(".bq-sec.is-selected").forEach((el) => el.classList.remove("is-selected"));
    const el = selected ? d.querySelector(`[data-section="${CSS.escape(selected)}"]`) : null;
    if (el) { el.classList.add("is-selected"); if (scroll) el.scrollIntoView({ block: "start", behavior: "smooth" }); }
  }, [selected]);
  useEffect(() => { markSelected(true); }, [markSelected]);

  const extensions = useMemo(() => ({ html: [htmlLang()], css: [cssLang()], jsonld: [jsonLang()] }), []);
  const slug = form.slug || slugify(form.title);
  const liveUrl = id && form.slug ? `/info/${form.slug}${form.published ? "" : "?preview=1"}` : null;

  if (!loaded) return <p>{msg?.text ?? "Loading…"}</p>;

  if (isContact) {
    return (
      <>
        <div className="ad-head"><h1>{form.title || "Contact"}</h1></div>
        <div className="ad-panel" style={{ maxWidth: 640 }}>
          <p style={{ marginTop: 0 }}>The contact page is a form at <a href="/contact" target="_blank" rel="noreferrer">/contact</a>, so it isn&apos;t built with sections like other pages. <code>/info/contact</code> redirects there.</p>
          <p className="ad-hint">Messages sent through the form arrive under Messages.</p>
          <div className="ad-quick"><Link className="ad-btn ad-btn--primary" href="/admin/messages">Open messages</Link><Link className="ad-btn" href="/admin/info-pages">Back to pages</Link></div>
        </div>
      </>
    );
  }

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
  const preview = (
    <div className={`ad-preview${mobile ? " ad-preview--mobile" : ""}`}>
      <iframe ref={frame} title="Preview" srcDoc={doc} sandbox="allow-same-origin allow-popups" onLoad={() => { frame.current?.contentWindow?.scrollTo(0, previewScroll.current); markSelected(false); }} />
    </div>
  );

  const tabs: [Tab, string][] = [...(usesSections ? ([["sections", "Sections"]] as [Tab, string][]) : []), ["html", "HTML"], ["css", "CSS"], ["jsonld", "JSON-LD"]];
  if (!split) tabs.push(["preview", "Preview"]);

  const work =
    tab === "preview" ? preview
      : tab === "sections" && form.doc ? <SectionsEditor doc={form.doc} onChange={(d) => set("doc", d)} selected={selected} onSelect={setSelected} types={sectionTypes} scope="page" />
          : tab === "html" && usesSections ? (
            <div className="ad-code-wrap">
              <div className="se-htmlbar"><span className="ad-hint">This HTML is generated from the sections and updates when you save. {previewError && <span className="ad-error">{previewError}</span>}</span><button className="ad-btn ad-btn--sm" onClick={useHtmlMode}>Edit HTML by hand</button></div>
              <div className="ad-code"><CodeMirror value={sectionsHtml} extensions={extensions.html} readOnly editable={false} basicSetup={{ foldGutter: true }} /></div>
            </div>
          ) : code(tab === "css" || tab === "jsonld" ? tab : "html");

  return (
    <>
      <div className="ad-head">
        <h1>{id ? form.title || "Untitled" : "New page"}</h1>
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

      {converted && (
        <p className="ad-panel" style={{ margin: "0 0 12px", padding: "10px 14px" }}>
          This page used the old layout, so its headings and texts have been turned into sections. The live page doesn&apos;t change until you click <b>{form.published ? "Update" : "Save draft"}</b>.
        </p>
      )}

      <div className="ad-editor">
        <div className="ad-editor__meta ad-form" key={version}>
          <label>Title<input value={form.title} onChange={(e) => set("title", e.target.value)} /></label>
          <label>Status
            <select value={form.published ? "published" : "draft"} onChange={(e) => set("published", e.target.value === "published")}>
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </label>
          <label>Slug<input value={form.slug} placeholder="from title" onChange={(e) => set("slug", e.target.value)} />
            <span className="ad-hint">/info/{slug || "…"}</span></label>
          <label>Lead<textarea style={{ fontFamily: "var(--sans)", fontSize: 13, minHeight: 70 }} value={form.lead} onChange={(e) => set("lead", e.target.value)} />
            <span className="ad-hint">Intro under the title, and the fallback meta description.</span></label>
          <label>Cover image
            <div style={{ display: "flex", gap: 6 }}><input value={form.coverImage ?? ""} onChange={(e) => set("coverImage", e.target.value || null)} /><button type="button" className="ad-btn ad-btn--sm" onClick={() => setPicker("cover")}>Pick</button></div>
            {form.coverImage && <img src={form.coverImage} alt="" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", marginTop: 4 }} />}
          </label>
          <label>Sort order<input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            <span className="ad-hint">Order in the page list beside each page.</span></label>

          <fieldset>
            <legend>SEO</legend>
            <label>SEO title<input value={form.seoTitle ?? ""} placeholder={`${form.title} – HouseholdMe`} onChange={(e) => set("seoTitle", e.target.value || null)} /></label>
            <label>Meta description<textarea style={{ fontFamily: "var(--sans)", fontSize: 13, minHeight: 60 }} value={form.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value || null)} /></label>
            <span className="ad-hint">Structured data (JSON-LD) is edited in its own tab.</span>
          </fieldset>
        </div>

        <div className="ad-editor__work">
          <div className="ad-tabs" role="tablist">
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
            ))}
            <span className="ad-tabs__spacer" />
            {!usesSections && <button onClick={useSectionsMode} title="Build this page from sections">Use sections</button>}
            {(tab === "html" || tab === "css") && !(usesSections && tab === "html") && <button onClick={() => setPicker("insert")} title="Upload or pick an image and insert it at the cursor">+ Image</button>}
            <button onClick={() => { setSplit(!split); if (tab === "preview") setTab(usesSections ? "sections" : "html"); }}>{split ? "Full-width editor" : "Side-by-side preview"}</button>
            <button aria-pressed={mobile} onClick={() => setMobile(!mobile)}>{mobile ? "Mobile" : "Desktop"} preview</button>
          </div>
          <div className={`ad-split${split ? " ad-split--side" : ""}`}>
            {work}
            {split && tab !== "preview" && preview}
          </div>
          <p className="ad-hint">The HTML is the whole page body, rendered inside the site header and footer with <a href="/sections.css" target="_blank">sections.css</a>. Ctrl/⌘+S saves.</p>
        </div>
      </div>

      {picker && <MediaPicker onPick={onPicked} onClose={() => setPicker(null)} />}
    </>
  );
}
