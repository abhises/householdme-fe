"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Editor behaviour shared by the guide and product editors, following the BrasQ post editor:
// dirty tracking, Ctrl/⌘+S, leave-page warning, confirm-before-delete and a live preview pane.
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { adminApi, errorText } from "@/lib/admin-api";
import { useConfirm } from "./ConfirmDialog";

type Msg = { ok: boolean; text: string } | null;

export function useDocEditor<T extends Record<string, any>>({
  resource,
  id,
  blank,
  editHref,
  listHref,
  validate,
  prepare,
}: {
  resource: string;
  id: string;
  blank: T;
  editHref: (id: string) => string;
  listHref: string;
  validate?: (f: T) => string | null;
  /** fills derived values before saving, e.g. a slug generated from the title */
  prepare?: (f: T) => Partial<T>;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const isNew = id === "new";
  const [form, setForm] = useState<T>(blank);
  const [loaded, setLoaded] = useState(isNew);
  const [msg, setMsg] = useState<Msg>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  /** bumps when a record is (re)loaded so text-based fields re-read their value */
  const [version, setVersion] = useState(0);
  /** bumps after every save so the preview reloads */
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    if (isNew) return;
    adminApi<T>(`/${resource}/${id}`)
      .then((r) => {
        setForm(r);
        setLoaded(true);
        setVersion((v) => v + 1);
      })
      .catch((e) => setMsg({ ok: false, text: errorText(e) }));
  }, [resource, id, isNew]);

  const set = useCallback(<K extends keyof T>(k: K, v: T[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  }, []);
  const patch = useCallback((p: Partial<T>) => {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }, []);

  const save = useCallback(
    async (override?: Partial<T>) => {
      const merged = { ...form, ...override };
      const f = { ...merged, ...prepare?.(merged) };
      const problem = validate?.(f);
      if (problem) {
        setMsg({ ok: false, text: problem });
        return;
      }
      setSaving(true);
      setMsg(null);
      try {
        const saved = isNew
          ? await adminApi<T>(`/${resource}`, { method: "POST", json: f })
          : await adminApi<T>(`/${resource}/${id}`, { method: "PUT", json: f });
        setDirty(false);
        if (isNew) {
          router.replace(editHref(saved.id));
          return;
        }
        setForm(saved);
        setSavedAt(Date.now());
        setMsg({ ok: true, text: `Saved ${new Date().toLocaleTimeString()}` });
      } catch (e) {
        setMsg({ ok: false, text: errorText(e) });
      } finally {
        setSaving(false);
      }
    },
    [form, validate, prepare, isNew, resource, id, router, editHref],
  );

  const remove = async (title: string, message = "This cannot be undone.") => {
    if (isNew || !(await confirm({ title, message }))) return;
    try {
      await adminApi(`/${resource}/${id}`, { method: "DELETE" });
      setDirty(false);
      router.push(listHref);
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty]);

  return { form, setForm, set, patch, loaded, msg, setMsg, saving, dirty, save, remove, isNew, version, savedAt };
}

/** Save message + "Unsaved changes" hint, as in the BrasQ save bar. */
export function SaveStatus({ msg, dirty }: { msg: Msg; dirty: boolean }) {
  if (msg) return <span className={msg.ok ? "ad-ok" : "ad-error"}>{msg.text}</span>;
  if (dirty) return <span className="ad-hint">Unsaved changes</span>;
  return null;
}

/** The live site page in an iframe; reloads after each save. */
export function EditorPreview({ url, reloadKey, mobile }: { url: string | null; reloadKey: number; mobile: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scroll = useRef(0);
  if (!url) return <div className="ad-preview"><p className="ad-hint" style={{ padding: 16 }}>Save first to see a preview.</p></div>;
  const src = `${url}${url.includes("?") ? "&" : "?"}preview=1&v=${reloadKey}`;
  return (
    <div className={`ad-preview${mobile ? " ad-preview--mobile" : ""}`}>
      <iframe
        ref={frame}
        key={src}
        title="Preview"
        src={src}
        onLoad={() => {
          // keep the scroll position when the preview reloads after a save
          const w = frame.current?.contentWindow;
          if (!w) return;
          w.scrollTo(0, scroll.current);
          w.addEventListener("scroll", () => (scroll.current = w.scrollY), { passive: true });
        }}
      />
    </div>
  );
}

/** Tabs row with the BrasQ editor's right-hand preview toggles. */
export function EditorTabs<T extends string>({
  tabs,
  tab,
  onTab,
  split,
  onSplit,
  mobile,
  onMobile,
}: {
  tabs: [T, string][];
  tab: T | "preview";
  onTab: (t: T | "preview") => void;
  split: boolean;
  onSplit: (v: boolean) => void;
  mobile: boolean;
  onMobile: (v: boolean) => void;
}) {
  return (
    <div className="ad-tabs" role="tablist">
      {[...tabs, ...(split ? [] : ([["preview", "Preview"]] as [T | "preview", string][]))].map(([k, l]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => onTab(k)}>
          {l}
        </button>
      ))}
      <span className="ad-tabs__spacer" />
      <button
        onClick={() => {
          onSplit(!split);
          if (tab === "preview") onTab(tabs[0][0]);
        }}
      >
        {split ? "Full-width editor" : "Side-by-side preview"}
      </button>
      <button aria-pressed={mobile} onClick={() => onMobile(!mobile)}>
        {mobile ? "Mobile" : "Desktop"} preview
      </button>
    </div>
  );
}

export function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}
