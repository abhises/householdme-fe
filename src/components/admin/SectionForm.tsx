'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import { emptyData, fillLabel } from '@/lib/sections-client';
import { postTypeLabel, type Guide, type Media, type Product, type SectionFieldDef as FieldDef } from '@/lib/types';
import { MediaPicker } from './MediaLibrary';

type Data = Record<string, unknown>;

/** A form generated from a section type's fields. Used by the section-type editor (sample data) and the post editor. */
export function SectionForm({ fields, value, onChange }: { fields: FieldDef[]; value: Data; onChange: (v: Data) => void }) {
  if (!fields.length) return <p className="ad-hint">This section type has no fields yet.</p>;
  return (
    <div className="ad-form sf">
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={value?.[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </div>
  );
}

function FieldInput({ field: f, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const str = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const label = <>{f.label}{f.required && <span className="sf-req" title="Required"> *</span>}</>;
  const help = f.help ? <span className="ad-hint">{f.help}</span> : null;

  switch (f.type) {
    case 'toggle':
      return <label className="ad-check"><input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
    case 'select':
      return <label>{label}<select value={str || String(f.default ?? '')} onChange={(e) => onChange(e.target.value)}>{(f.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>{help}</label>;
    case 'number':
      return <label>{label}<input type="number" step="any" value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />{help}</label>;
    case 'textarea':
      return <label>{label}<textarea className="sf-text" value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />{help}</label>;
    case 'code':
      return <label>{label}<textarea className="sf-code" spellCheck={false} value={str} onChange={(e) => onChange(e.target.value)} />{help}</label>;
    case 'richtext':
      return <div className="sf-field"><span className="sf-label">{label}</span><RichText value={str} onChange={onChange} placeholder={f.placeholder} />{help}</div>;
    case 'image':
      return <div className="sf-field"><span className="sf-label">{label}</span><ImageInput value={str} onChange={onChange} />{help}</div>;
    case 'post':
      return <div className="sf-field"><span className="sf-label">{label}</span><RefPicker kind="post" value={str} onChange={onChange} />{help}</div>;
    case 'product':
      return <div className="sf-field"><span className="sf-label">{label}</span><RefPicker kind="product" value={str} onChange={onChange} />{help}</div>;
    case 'list':
      return <div className="sf-field"><span className="sf-label">{label}</span>{help}<ListInput field={f} value={Array.isArray(value) ? (value as Data[]) : []} onChange={onChange} /></div>;
    case 'cells':
      return <label>{label}<input className="sf-mono" value={str} placeholder={f.placeholder ?? 'value | value | value'} onChange={(e) => onChange(e.target.value)} />{help}</label>;
    default: // text, link
      return <label>{label}<input type={f.type === 'link' ? 'url' : 'text'} value={str} placeholder={f.placeholder ?? (typeof f.default === 'string' ? f.default : undefined)} onChange={(e) => onChange(e.target.value)} />{help}</label>;
  }
}

function ListInput({ field, value, onChange }: { field: FieldDef; value: Data[]; onChange: (v: Data[]) => void }) {
  const [open, setOpen] = useState<number | null>(value.length ? 0 : null);
  const sub = field.fields ?? [];
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= value.length) return; const n = [...value]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); setOpen(j); };
  const singular = field.label.replace(/s$/, '').toLowerCase() || 'item';
  return (
    <div className="sf-list">
      {value.map((item, i) => (
        <div key={i} className={`sf-item${open === i ? ' is-open' : ''}`}>
          <div className="sf-item__head">
            <button type="button" className="sf-item__toggle" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="sf-item__n">{i + 1}</span>{fillLabel(field.itemLabel, item, `${field.label.replace(/s$/, '')} ${i + 1}`)}
            </button>
            <span className="sf-item__ops">
              <button type="button" aria-label="Move up" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" aria-label="Move down" title="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}>↓</button>
              <button type="button" aria-label="Duplicate" title="Duplicate" onClick={() => { const n = [...value]; n.splice(i + 1, 0, structuredClone(item)); onChange(n); setOpen(i + 1); }}>⧉</button>
              <button type="button" aria-label="Remove" title="Remove" onClick={() => { onChange(value.filter((_, k) => k !== i)); setOpen(null); }}>×</button>
            </span>
          </div>
          {open === i && <div className="sf-item__body"><SectionForm fields={sub} value={item} onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))} /></div>}
        </div>
      ))}
      <button type="button" className="ad-btn ad-btn--sm sf-add" onClick={() => { onChange([...value, emptyData(sub)]); setOpen(value.length); }}>+ Add {singular}</button>
    </div>
  );
}

function RichText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (before: string, after: string, ask?: string) => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    let open = before;
    if (ask) { const url = window.prompt(ask, 'https://'); if (!url) return; open = before.replace('URL', url.replace(/"/g, '%22')); }
    const next = value.slice(0, a) + open + value.slice(a, b) + after + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + open.length, b + open.length); });
  };
  return (
    <div className="sf-rich">
      <div className="sf-rich__bar">
        <button type="button" title="Bold" onClick={() => wrap('<strong>', '</strong>')}><b>B</b></button>
        <button type="button" title="Italic" onClick={() => wrap('<em>', '</em>')}><i>I</i></button>
        <button type="button" title="Link" onClick={() => wrap('<a href="URL">', '</a>', 'Link address (start with / for a page on HouseholdMe)')}>Link</button>
        <span className="ad-hint">Empty line = new paragraph</span>
      </div>
      <textarea ref={ref} className="sf-text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="sf-image">
      {value ? <img src={value} alt="" /> : <span className="sf-image__empty" />}
      <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
        <input value={value} placeholder="Image URL" onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="ad-btn ad-btn--sm" onClick={() => setPicking(true)}>Pick</button>
        {value && <button type="button" className="ad-btn ad-btn--sm" onClick={() => onChange('')}>Clear</button>}
      </div>
      {picking && <MediaPicker onPick={(m: Media) => { onChange(m.url); setPicking(false); }} onClose={() => setPicking(false)} />}
    </div>
  );
}

type RefRow = { id: string; title: string; meta: string; image?: string | null };
const toPost = (p: Guide): RefRow => ({ id: p.id, title: p.title, meta: `${postTypeLabel(p.type)} · /guide/${p.slug}`, image: p.coverImage ?? p.heroImage });
const toProduct = (p: Product): RefRow => ({ id: p.id, title: p.name, meta: [`score ${Number(p.score).toFixed(1)}`, p.price ? `$${p.price}` : '', `/review/${p.slug}`].filter(Boolean).join(' · '), image: p.images?.[0] ?? null });

/** Search-and-pick for posts or products. Stores the id; also accepts a slug typed by automation. */
function RefPicker({ kind, value, onChange }: { kind: 'post' | 'product'; value: string; onChange: (v: string) => void }) {
  const [current, setCurrent] = useState<RefRow | null>(null);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<RefRow[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!value) return;
    const path = kind === 'post' ? `/guides/${encodeURIComponent(value)}` : `/products/${encodeURIComponent(value)}`;
    adminApi<Guide & Product>(path)
      .then((d) => setCurrent(kind === 'post' ? toPost(d) : toProduct(d)))
      .catch(() => setCurrent({ id: value, title: value, meta: kind === 'post' ? 'post slug' : 'product slug' }));
  }, [kind, value]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const sp = new URLSearchParams({ page: '1', pageSize: '8' }); if (q) sp.set('q', q);
      if (kind === 'post') adminApi<{ items: Guide[] }>(`/guides?${sp}`).then((d) => setRows(d.items.map(toPost))).catch(() => setRows([]));
      else adminApi<{ items: Product[] }>(`/products?${sp}`).then((d) => setRows(d.items.map(toProduct))).catch(() => setRows([]));
    }, 200);
    return () => clearTimeout(t);
  }, [kind, q, open]);

  return (
    <div className="sf-ref">
      {value && current && !open ? (
        <div className="sf-ref__row">
          {current.image ? <img src={current.image} alt="" /> : <span className="sf-image__empty" />}
          <span><b>{current.title}</b><small>{current.meta}</small></span>
          <span style={{ display: 'flex', gap: 4 }}><button type="button" className="ad-btn ad-btn--sm" onClick={() => setOpen(true)}>Change</button><button type="button" className="ad-btn ad-btn--sm" onClick={() => onChange('')}>×</button></span>
        </div>
      ) : open ? (
        <div className="sf-ref__search">
          <div style={{ display: 'flex', gap: 6 }}>
            <input autoFocus value={q} placeholder={kind === 'post' ? 'Search posts' : 'Search products'} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="ad-btn ad-btn--sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <div className="sf-ref__results">
            {rows === null ? <span className="ad-hint">Loading…</span> : rows.length === 0 ? <span className="ad-hint">{kind === 'product' ? 'No products found. Add products under Products.' : 'No posts found.'}</span> : rows.map((r) => (
              <button type="button" key={r.id} className="sf-ref__row" onClick={() => { onChange(r.id); setCurrent(r); setOpen(false); }}>
                {r.image ? <img src={r.image} alt="" /> : <span className="sf-image__empty" />}<span><b>{r.title}</b><small>{r.meta}</small></span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className="ad-btn ad-btn--sm" onClick={() => setOpen(true)}>Choose {kind}</button>
      )}
    </div>
  );
}
