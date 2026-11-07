'use client';
import { useMemo, useState } from 'react';
import { emptyData, fillLabel, newId } from '@/lib/sections-client';
import type { PostType, SectionItem, SectionsDoc, SectionType } from '@/lib/types';
import { SectionForm } from './SectionForm';

/** Which sections a new post of each type starts with (keys of built-in section types + starting values). */
const STARTERS: Record<PostType, [string, Record<string, unknown>?][]> = {
  BUYING_GUIDE: [['post-header'], ['short-answer'], ['picks'], ['text', { heading: 'Why you can trust us' }], ['text', { heading: 'How we tested' }], ['table', { heading: 'Test results compared' }], ['verdict'], ['faq'], ['author-box'], ['sources']],
  SINGLE_REVIEW: [['post-header', { tag: 'Review' }], ['short-answer', { heading: 'Our verdict in short' }], ['text', { heading: 'What it does well' }], ['text', { heading: 'Where it falls short' }], ['table', { heading: 'Test results' }], ['verdict'], ['faq'], ['author-box'], ['sources']],
  COMPARISON: [['post-header', { tag: 'Comparison' }], ['short-answer'], ['head-to-head'], ['text', { heading: 'How we compared them' }], ['verdict'], ['faq'], ['author-box'], ['sources']],
  INFO_ARTICLE: [['post-header', { tag: 'Explained', copyLink: true }], ['short-answer'], ['stats'], ['text'], ['steps'], ['faq'], ['author-box'], ['sources'], ['keep-reading']],
};

export function starterDoc(type: PostType, types: SectionType[]): SectionsDoc {
  const byKey = new Map(types.map((t) => [t.key, t]));
  const items = STARTERS[type].filter(([k]) => byKey.has(k)).map(([k, extra]) => ({ id: newId(), type: k, data: { ...emptyData(byKey.get(k)!.fields), ...extra } }));
  return { layout: 'toc', items };
}

const LAYOUTS: [SectionsDoc['layout'], string][] = [['toc', 'With table of contents'], ['wide', 'Full width'], ['raw', 'No page frame']];

export function SectionsEditor({ doc, onChange, selected, onSelect, types, scope = 'post' }: {
  doc: SectionsDoc; onChange: (d: SectionsDoc) => void; selected: string | null; onSelect: (id: string | null) => void;
  types: SectionType[]; scope?: 'post' | 'home';
}) {
  const showLayout = scope === 'post';
  const [adding, setAdding] = useState(false);
  const byKey = useMemo(() => new Map(types.map((t) => [t.key, t])), [types]);
  const items = doc.items;
  const sel = items.find((s) => s.id === selected) ?? null;
  const selType = sel ? byKey.get(sel.type) : undefined;

  const setItems = (next: SectionItem[]) => onChange({ ...doc, items: next });
  const update = (id: string, patch: Partial<SectionItem>) => setItems(items.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; setItems(n); };
  const add = (t: SectionType) => {
    const item: SectionItem = { id: newId(), type: t.key, data: emptyData(t.fields) };
    const at = sel ? items.findIndex((s) => s.id === sel.id) + 1 : items.length;
    setItems([...items.slice(0, at), item, ...items.slice(at)]);
    onSelect(item.id); setAdding(false);
  };
  const label = (s: SectionItem) => {
    const t = byKey.get(s.type);
    const d = s.data ?? {};
    const sub = fillLabel(t?.tocLabel, d, '') || (typeof d.heading === 'string' ? d.heading : '') || (typeof d.tocTitle === 'string' ? d.tocTitle : '');
    return { name: t?.name ?? `Unknown type “${s.type}”`, sub };
  };

  return (
    <div className="se">
      <div className="se-outline">
        <div className="se-outline__head">
          <span>Sections</span>
          {showLayout && <select aria-label="Page layout" value={doc.layout} onChange={(e) => onChange({ ...doc, layout: e.target.value as SectionsDoc['layout'] })}>
            {LAYOUTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>}
          {showLayout && doc.layout === 'toc' && <>
            <input aria-label="Table of contents title" className="se-input" value={doc.tocTitle ?? ''} placeholder="On this page" onChange={(e) => onChange({ ...doc, tocTitle: e.target.value || undefined })} />
            <label className="se-check"><input type="checkbox" checked={doc.backToTop !== false} onChange={(e) => onChange({ ...doc, backToTop: e.target.checked })} />Back to top link</label>
          </>}
        </div>
        {items.length === 0 && <p className="ad-hint" style={{ padding: 10 }}>No sections yet. Add the first one below.</p>}
        {items.map((s, i) => {
          const l = label(s);
          return (
            <div key={s.id} className={`se-item${s.id === selected ? ' is-selected' : ''}${s.hidden ? ' is-hidden' : ''}`}>
              <button type="button" className="se-item__main" onClick={() => onSelect(s.id === selected ? null : s.id)} aria-pressed={s.id === selected}>
                <b>{l.name}</b>{l.sub && <small>{l.sub}</small>}{s.hidden && <small className="se-item__flag">Hidden</small>}
              </button>
              <span className="se-item__ops">
                <button type="button" title="Move up" aria-label={`Move ${l.name} up`} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" title="Move down" aria-label={`Move ${l.name} down`} onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
              </span>
            </div>
          );
        })}
        <button type="button" className="se-add" onClick={() => setAdding(true)}>+ Add section</button>
      </div>

      <div className="se-form">
        {!sel ? (
          <p className="ad-hint">Select a section on the left to edit it, or add a new one.</p>
        ) : (
          <>
            <div className="se-form__head">
              <strong>{selType?.name ?? sel.type}</strong>
              <span className="se-form__ops">
                <button type="button" className="ad-btn ad-btn--sm" onClick={() => update(sel.id, { hidden: !sel.hidden })}>{sel.hidden ? 'Show' : 'Hide'}</button>
                <button type="button" className="ad-btn ad-btn--sm" onClick={() => { const at = items.findIndex((s) => s.id === sel.id); const copy = { ...structuredClone(sel), id: newId() }; setItems([...items.slice(0, at + 1), copy, ...items.slice(at + 1)]); onSelect(copy.id); }}>Duplicate</button>
                <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => { setItems(items.filter((s) => s.id !== sel.id)); onSelect(null); }}>Remove</button>
              </span>
            </div>
            {selType?.description && <p className="ad-hint" style={{ margin: '0 0 10px' }}>{selType.description}</p>}
            {scope === 'post' && (
              <details className="se-adv"><summary>Position and table of contents</summary>
                <div className="ad-form" style={{ gap: 8, marginTop: 8 }}>
                  <label>Position<select value={sel.placement ?? ''} onChange={(e) => update(sel.id, { placement: (e.target.value || undefined) as SectionItem['placement'] })}>
                    <option value="">Default for this type{selType ? ` (${selType.placement === 'top' ? 'full width, top' : selType.placement === 'bottom' ? 'full width, bottom' : 'main column'})` : ''}</option>
                    <option value="body">Main column</option><option value="top">Full width, top</option><option value="bottom">Full width, bottom</option>
                  </select></label>
                  <label>Name in the table of contents<input value={sel.tocLabel ?? ''} placeholder={sel.tocLabel === '' ? 'Not in the table of contents' : 'From the heading'} onChange={(e) => update(sel.id, { tocLabel: e.target.value === '' ? undefined : e.target.value })} />
                    <span className="ad-hint"><label className="ad-check" style={{ display: 'inline-flex' }}><input type="checkbox" checked={sel.tocLabel === ''} onChange={(e) => update(sel.id, { tocLabel: e.target.checked ? '' : undefined })} />Leave out of the table of contents</label></span></label>
                </div>
              </details>
            )}
            {selType ? <SectionForm fields={selType.fields} value={sel.data ?? {}} onChange={(data) => update(sel.id, { data })} />
              : <p className="ad-error">This section type no longer exists. Remove the section or recreate the type “{sel.type}”.</p>}
          </>
        )}
      </div>

      {adding && <AddSection types={types.filter((t) => t.scope === 'any' || t.scope === scope)} onPick={add} onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddSection({ types, onPick, onClose }: { types: SectionType[]; onPick: (t: SectionType) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const list = types.filter((t) => `${t.name} ${t.description} ${t.group}`.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(list.map((t) => t.group))];
  return (
    <div className="ad-modal" onClick={onClose}>
      <div className="ad-modal__box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add a section">
        <div className="ad-head" style={{ marginBottom: 12 }}><h1 style={{ fontSize: 20 }}>Add a section</h1><button className="ad-btn" onClick={onClose}>Close</button></div>
        <div className="ad-filters"><input autoFocus placeholder="Search sections" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && list[0]) onPick(list[0]); }} /></div>
        {groups.map((g) => (
          <div key={g} className="se-pick">
            <div className="se-pick__group">{g}</div>
            <div className="se-pick__grid">
              {list.filter((t) => t.group === g).map((t) => (
                <button key={t.key} type="button" onClick={() => onPick(t)}>
                  <strong>{t.name}</strong><span>{t.description}</span>
                  {!t.builtIn && <span className="ad-pill ad-pill--custom" style={{ alignSelf: 'flex-start' }}>Custom</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        {list.length === 0 && <p>No sections match.</p>}
      </div>
    </div>
  );
}
