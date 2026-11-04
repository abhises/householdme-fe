"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
// Form generator modelled on the BrasQ admin's SectionForm: one field definition list
// drives labels, inputs, collapsible repeatable lists and media pickers.
import { useState, type ReactNode } from "react";
import type { Media } from "@/lib/types";
import { MediaPicker } from "./MediaLibrary";

export type FieldDef = {
  key: string;
  label: string;
  type:
    | "text"
    | "link"
    | "textarea"
    | "number"
    | "toggle"
    | "select"
    | "image"
    | "list"
    | "cells"
    | "lines"
    | "paragraphs"
    | "table"
    | "json";
  help?: ReactNode;
  placeholder?: string;
  required?: boolean;
  /** select: options */
  options?: { value: string; label: string }[];
  /** list: sub fields */
  fields?: FieldDef[];
  /** list: item title, e.g. "{{q}}" */
  itemLabel?: string;
  /** number: step */
  step?: number;
  rows?: number;
  /** render two fields per row in a grid */
  half?: boolean;
};

type Data = Record<string, any>;

export function emptyData(fields: FieldDef[]): Data {
  const o: Data = {};
  for (const f of fields) {
    o[f.key] =
      f.type === "number" ? 0 : f.type === "toggle" ? false : ["list", "lines", "paragraphs", "cells", "table"].includes(f.type) ? [] : f.type === "json" ? null : "";
  }
  return o;
}

function fillLabel(tpl: string | undefined, item: Data, fallback: string) {
  if (!tpl) return fallback;
  const out = tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (item?.[k] == null ? "" : String(item[k]))).trim();
  return out || fallback;
}

/** Renders `fields` for `value`; half-width fields are paired two per row. */
export function FormFields({ fields, value, onChange }: { fields: FieldDef[]; value: Data; onChange: (v: Data) => void }) {
  const rows: FieldDef[][] = [];
  for (const f of fields) {
    const last = rows[rows.length - 1];
    if (f.half && last && last.length === 1 && last[0].half) last.push(f);
    else rows.push([f]);
  }
  return (
    <div className="ad-form sf">
      {rows.map((row) =>
        row.length === 2 ? (
          <div key={row[0].key} className="ad-2">
            {row.map((f) => (
              <FieldInput key={f.key} field={f} value={value?.[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
            ))}
          </div>
        ) : (
          <FieldInput key={row[0].key} field={row[0]} value={value?.[row[0].key]} onChange={(v) => onChange({ ...value, [row[0].key]: v })} />
        ),
      )}
    </div>
  );
}

export function FieldInput({ field: f, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: any) => void }) {
  const str = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const label = (
    <>
      {f.label}
      {f.required && <span className="sf-req" title="Required"> *</span>}
    </>
  );
  const help = f.help ? <span className="ad-hint">{f.help}</span> : null;

  switch (f.type) {
    case "toggle":
      return (
        <label className="ad-check">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          {label}
        </label>
      );
    case "select":
      return (
        <label>
          {label}
          <select value={str} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {help}
        </label>
      );
    case "number":
      return (
        <label>
          {label}
          <input type="number" step={f.step ?? "any"} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
          {help}
        </label>
      );
    case "textarea":
      return (
        <label>
          {label}
          <textarea className="sf-text" rows={f.rows} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
          {help}
        </label>
      );
    case "image":
      return (
        <div className="sf-field">
          <span className="sf-label">{label}</span>
          <ImageInput value={str} onChange={onChange} />
          {help}
        </div>
      );
    case "list":
      return (
        <div className="sf-field">
          <span className="sf-label">{label}</span>
          {help}
          <ListInput field={f} value={Array.isArray(value) ? (value as Data[]) : []} onChange={onChange} />
        </div>
      );
    case "cells":
      return <TextCodec field={f} value={value} onChange={onChange} mono toText={(v) => (v ?? []).join(" | ")} fromText={(t) => t.split("|").map((c) => c.trim())} placeholder="value | value | value" single />;
    case "lines":
      return <TextCodec field={f} value={value} onChange={onChange} toText={(v) => (v ?? []).join("\n")} fromText={(t) => t.split("\n").map((s) => s.trim()).filter(Boolean)} defaultHelp="One per line." />;
    case "paragraphs":
      return <TextCodec field={f} value={value} onChange={onChange} toText={(v) => (v ?? []).join("\n\n")} fromText={(t) => t.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)} defaultHelp="Empty line = new paragraph." />;
    case "table":
      return <TextCodec field={f} value={value} onChange={onChange} mono toText={(v) => (v ?? []).map((r: string[]) => r.join(" | ")).join("\n")} fromText={(t) => t.split("\n").filter((l) => l.trim()).map((l) => l.split("|").map((c) => c.trim()))} defaultHelp='One row per line, cells separated by " | ".' />;
    case "json":
      return <JsonInput field={f} value={value} onChange={onChange} />;
    default: // text, link
      return (
        <label>
          {label}
          <input type={f.type === "link" ? "url" : "text"} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
          {help}
        </label>
      );
  }
}

/** A textarea that edits a structured value through a text representation (keeps your typing as-is). */
function TextCodec({
  field: f,
  value,
  onChange,
  toText,
  fromText,
  mono,
  single,
  placeholder,
  defaultHelp,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: any) => void;
  toText: (v: any) => string;
  fromText: (t: string) => any;
  mono?: boolean;
  single?: boolean;
  placeholder?: string;
  defaultHelp?: string;
}) {
  const [text, setText] = useState(() => toText(value));
  const set = (t: string) => {
    setText(t);
    onChange(fromText(t));
  };
  const help = f.help ?? defaultHelp;
  return (
    <label>
      {f.label}
      {single ? (
        <input className={mono ? "sf-mono" : undefined} value={text} placeholder={f.placeholder ?? placeholder} onChange={(e) => set(e.target.value)} />
      ) : (
        <textarea className={mono ? "sf-mono" : "sf-text"} rows={f.rows ?? 4} value={text} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />
      )}
      {help && <span className="ad-hint">{help}</span>}
    </label>
  );
}

function JsonInput({ field: f, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: any) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2));
  const [err, setErr] = useState("");
  return (
    <label>
      {f.label}
      <textarea
        className="sf-code"
        spellCheck={false}
        rows={f.rows ?? 16}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(e.target.value.trim() ? JSON.parse(e.target.value) : null);
            setErr("");
          } catch (x) {
            setErr((x as Error).message);
          }
        }}
      />
      {err ? <span className="ad-error">Invalid JSON: {err}</span> : f.help && <span className="ad-hint">{f.help}</span>}
    </label>
  );
}

function ListInput({ field, value, onChange }: { field: FieldDef; value: Data[]; onChange: (v: Data[]) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  // Stable row keys so text fields inside items keep their state while reordering
  const [keys, setKeys] = useState<number[]>(() => value.map((_, i) => i));
  const [next, setNext] = useState(value.length);
  const rowKeys = keys.length === value.length ? keys : value.map((_, i) => i);
  const sub = field.fields ?? [];
  const singular = field.label.replace(/s$/, "").toLowerCase() || "item";

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    const k = [...rowKeys];
    [k[i], k[j]] = [k[j], k[i]];
    setKeys(k);
    onChange(n);
    setOpen(j);
  };
  const duplicate = (i: number) => {
    const n = [...value];
    n.splice(i + 1, 0, structuredClone(value[i]));
    const k = [...rowKeys];
    k.splice(i + 1, 0, next);
    setNext(next + 1);
    setKeys(k);
    onChange(n);
    setOpen(i + 1);
  };
  const remove = (i: number) => {
    setKeys(rowKeys.filter((_, k) => k !== i));
    onChange(value.filter((_, k) => k !== i));
    setOpen(null);
  };
  const add = () => {
    setKeys([...rowKeys, next]);
    setNext(next + 1);
    onChange([...value, emptyData(sub)]);
    setOpen(value.length);
  };

  return (
    <div className="sf-list">
      {value.map((item, i) => (
        <div key={rowKeys[i]} className={`sf-item${open === i ? " is-open" : ""}`}>
          <div className="sf-item__head">
            <button type="button" className="sf-item__toggle" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="sf-item__n">{i + 1}</span>
              {fillLabel(field.itemLabel, item, `${field.label.replace(/s$/, "")} ${i + 1}`)}
            </button>
            <span className="sf-item__ops">
              <button type="button" aria-label="Move up" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" aria-label="Move down" title="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}>↓</button>
              <button type="button" aria-label="Duplicate" title="Duplicate" onClick={() => duplicate(i)}>⧉</button>
              <button type="button" aria-label="Remove" title="Remove" onClick={() => remove(i)}>×</button>
            </span>
          </div>
          {open === i && (
            <div className="sf-item__body">
              <FormFields fields={sub} value={item} onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="ad-btn ad-btn--sm sf-add" onClick={add}>+ Add {singular}</button>
    </div>
  );
}

export function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="sf-image">
      {value ? <img src={value} alt="" /> : <span className="sf-image__empty" />}
      <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 0 }}>
        <input value={value} placeholder="Image URL" onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="ad-btn ad-btn--sm" onClick={() => setPicking(true)}>Pick</button>
        {value && <button type="button" className="ad-btn ad-btn--sm" onClick={() => onChange("")}>Clear</button>}
      </div>
      {picking && (
        <MediaPicker
          onPick={(m: Media) => {
            onChange(m.url);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

/** Ordered list of image URLs (product gallery), each with move/remove. */
export function GalleryInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [picking, setPicking] = useState(false);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="sf-field">
      <div className="ad-gallery">
        {value.map((url, i) => (
          <figure key={url + i}>
            <div><img src={url} alt="" /></div>
            <figcaption>
              <span>{i === 0 ? "Main" : i + 1}</span>
              <span className="sf-item__ops">
                <button type="button" aria-label="Move left" onClick={() => move(i, -1)} disabled={i === 0}>←</button>
                <button type="button" aria-label="Move right" onClick={() => move(i, 1)} disabled={i === value.length - 1}>→</button>
                <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))}>×</button>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <button type="button" className="ad-btn ad-btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => setPicking(true)}>+ Add photo</button>
      {picking && (
        <MediaPicker
          onPick={(m: Media) => {
            onChange([...value, m.url]);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}
