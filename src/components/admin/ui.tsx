"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { adminApi, errorText } from "@/lib/admin-api";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="admin-top">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="a-toolbar">{actions}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, actions, children }: { title?: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      {title && (
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="a-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t} type="button" role="tab" aria-selected={active === t} className={active === t ? "active" : undefined} onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}

/** Loads a list endpoint and exposes reload. */
export function useList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchItems = useCallback(
    () =>
      adminApi<{ items: T[] }>(path)
        .then((res) => {
          setItems(res.items);
          setError(null);
        })
        .catch((e) => setError(errorText(e)))
        .finally(() => setLoading(false)),
    [path],
  );
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  const reload = useCallback(() => {
    setLoading(true);
    return fetchItems();
  }, [fetchItems]);
  return { items, loading, error, reload, setItems };
}

export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
  width?: number | string;
}

/** Searchable table for a CRUD resource with edit/delete actions. */
export function ResourceTable<T extends { id: string }>({
  resource,
  columns,
  editHref,
  query = "",
  searchable = true,
  emptyText = "Nothing here yet.",
  deleteLabel = (row: T) => (row as any).title ?? (row as any).name ?? "this item",
}: {
  resource: string;
  columns: Column<T>[];
  editHref?: (row: T) => string;
  query?: string;
  searchable?: boolean;
  emptyText?: string;
  deleteLabel?: (row: T) => string;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const params = new URLSearchParams(query);
  if (debounced) params.set("q", debounced);
  const { items, loading, error, reload } = useList<T>(`/${resource}${params.size ? `?${params}` : ""}`);
  const [msg, setMsg] = useState<string | null>(null);

  const remove = async (row: T) => {
    if (!window.confirm(`Delete ${deleteLabel(row)}? This cannot be undone.`)) return;
    try {
      await adminApi(`/${resource}/${row.id}`, { method: "DELETE" });
      setMsg(null);
      reload();
    } catch (e) {
      setMsg(errorText(e));
    }
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      {searchable && (
        <div className="a-toolbar">
          <input className="a-input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="small">{loading ? "Loading…" : `${items.length} shown`}</span>
        </div>
      )}
      {(error || msg) && <div className="a-alert error">{error || msg}</div>}
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="a-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} style={{ width: c.width }}>{c.label}</th>
              ))}
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: 24, color: "var(--muted)" }}>{emptyText}</td>
              </tr>
            )}
            {items.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.label}>{c.render(row)}</td>
                ))}
                <td className="actions">
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    {editHref && <Link href={editHref(row)} className="a-btn sm">Edit</Link>}
                    <button type="button" className="a-btn sm danger" onClick={() => remove(row)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Loads one record (or starts from `blank` when id is "new"), and saves it with
 * POST/PUT. Returns form state helpers.
 */
export function useRecord<T extends Record<string, any>>(resource: string, id: string, blank: T, listHref: string) {
  const router = useRouter();
  const isNew = id === "new";
  const [value, setValue] = useState<T>(blank);
  const [loaded, setLoaded] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (isNew) return;
    adminApi<T>(`/${resource}/${id}`)
      .then((v) => {
        setValue(v);
        setLoaded(true);
        setVersion((n) => n + 1);
      })
      .catch((e) => setError(errorText(e)));
  }, [resource, id, isNew]);

  const set = useCallback(<K extends keyof T>(k: K) => (v: T[K]) => setValue((cur) => ({ ...cur, [k]: v })), []);

  const save = async (toBody: (v: T) => unknown = (v) => v) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const body = toBody(value);
      const saved = isNew
        ? await adminApi<T>(`/${resource}`, { method: "POST", json: body })
        : await adminApi<T>(`/${resource}/${id}`, { method: "PUT", json: body });
      if (isNew) {
        router.replace(`${listHref}/${saved.id}`);
      } else {
        setValue(saved);
        setNotice("Saved");
        setTimeout(() => setNotice(null), 2500);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (label: string) => {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await adminApi(`/${resource}/${id}`, { method: "DELETE" });
      router.push(listHref);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return { value, setValue, set, loaded, saving, error, notice, save, remove, isNew, version };
}

export function SaveBar({ saving, error, notice, onSave, onDelete, viewHref, disabled }: { saving: boolean; error: string | null; notice: string | null; onSave: () => void; onDelete?: () => void; viewHref?: string | null; disabled?: boolean }) {
  return (
    <div className="a-sticky-save">
      <div style={{ flex: 1, minWidth: 0 }}>
        {error ? <div className="a-alert error">{error}</div> : notice ? <div className="a-alert ok">{notice}</div> : <span className="small">Changes are published as soon as you save.</span>}
      </div>
      <div className="a-toolbar">
        {viewHref && <a href={viewHref} target="_blank" rel="noreferrer" className="a-btn">View on site ↗</a>}
        {onDelete && <button type="button" className="a-btn danger" onClick={onDelete}>Delete</button>}
        <button type="button" className="a-btn primary" onClick={onSave} disabled={saving || disabled}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function Loading({ error }: { error?: string | null }) {
  return error ? <div className="a-alert error">{error}</div> : <p className="small">Loading…</p>;
}
