"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type ReactNode } from "react";
import { slugify } from "@/lib/admin-api";

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`a-field ${className ?? ""}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

type Base = { label: string; hint?: ReactNode; className?: string };

export function TextField({ value, onChange, placeholder, type = "text", ...f }: Base & { value: string | null | undefined; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <Field {...f}>
      <input className="a-input" type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function NumberField({ value, onChange, step, ...f }: Base & { value: number | null | undefined; onChange: (v: number) => void; step?: number }) {
  return (
    <Field {...f}>
      <input className="a-input" type="number" step={step ?? 1} value={value ?? 0} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
    </Field>
  );
}

export function TextArea({ value, onChange, rows = 4, code, ...f }: Base & { value: string | null | undefined; onChange: (v: string) => void; rows?: number; code?: boolean }) {
  return (
    <Field {...f}>
      <textarea className={`a-textarea ${code ? "code" : ""}`} rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function SelectField({ value, onChange, options, ...f }: Base & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Field {...f}>
      <select className="a-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="a-field">
      <label className="a-check" style={{ fontWeight: 600 }}>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Slug input that can be generated from another field. */
export function SlugField({ value, onChange, source, ...f }: Base & { value: string; onChange: (v: string) => void; source: string }) {
  return (
    <Field {...f} hint={f.hint ?? "Used in the URL. Lowercase letters, numbers and dashes."}>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="a-input" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="a-btn sm" onClick={() => onChange(slugify(source))} title="Generate from name">
          Generate
        </button>
      </div>
    </Field>
  );
}

/** string[] edited as one item per line. */
export function LinesField({ value, onChange, rows = 4, ...f }: Base & { value: string[] | null | undefined; onChange: (v: string[]) => void; rows?: number }) {
  const [text, setText] = useState((value ?? []).join("\n"));
  return (
    <Field {...f} hint={f.hint ?? "One item per line."}>
      <textarea
        className="a-textarea"
        rows={rows}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean));
        }}
      />
    </Field>
  );
}

/** Paragraphs (string[]) separated by blank lines. */
export function ParagraphsField({ value, onChange, rows = 6, ...f }: Base & { value: string[] | null | undefined; onChange: (v: string[]) => void; rows?: number }) {
  const [text, setText] = useState((value ?? []).join("\n\n"));
  return (
    <Field {...f} hint={f.hint ?? "Separate paragraphs with a blank line."}>
      <textarea
        className="a-textarea"
        rows={rows}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean));
        }}
      />
    </Field>
  );
}

/** string[][] edited as rows of "a | b | c". */
export function TableField({ value, onChange, rows = 6, ...f }: Base & { value: string[][] | null | undefined; onChange: (v: string[][]) => void; rows?: number }) {
  const [text, setText] = useState((value ?? []).map((r) => r.join(" | ")).join("\n"));
  return (
    <Field {...f} hint={f.hint ?? 'One row per line, cells separated by " | ".'}>
      <textarea
        className="a-textarea code"
        style={{ minHeight: 120 }}
        rows={rows}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split("\n")
              .filter((l) => l.trim())
              .map((l) => l.split("|").map((c) => c.trim())),
          );
        }}
      />
    </Field>
  );
}

export function JsonField({ value, onChange, rows = 14, ...f }: Base & { value: unknown; onChange: (v: unknown, valid: boolean) => void; rows?: number }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2));
  const [err, setErr] = useState<string | null>(null);
  return (
    <Field {...f}>
      <textarea
        className="a-textarea code"
        rows={rows}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : null;
            setErr(null);
            onChange(parsed, true);
          } catch (x) {
            setErr((x as Error).message);
            onChange(null, false);
          }
        }}
      />
      {err && <span className="hint" style={{ color: "var(--bad)" }}>Invalid JSON: {err}</span>}
    </Field>
  );
}

// ------------------------------------------------------------------
// Repeatable list of objects, driven by a field config.
// ------------------------------------------------------------------
export type ListFieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "number" | "lines" | "paragraphs" | "cells" | "bool"; hint?: string; wide?: boolean; step?: number }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; hint?: string; wide?: boolean }
  | { key: string; label: string; type: "list"; fields: ListFieldDef[]; itemLabel?: string; hint?: string; wide?: boolean };

function emptyFor(fields: ListFieldDef[]) {
  const o: Record<string, unknown> = {};
  for (const f of fields) {
    o[f.key] =
      f.type === "number" ? 0 : f.type === "bool" ? false : f.type === "lines" || f.type === "paragraphs" || f.type === "cells" || f.type === "list" ? [] : f.type === "select" ? null : "";
  }
  return o;
}

export function ObjectList({
  label,
  hint,
  value,
  onChange,
  fields,
  itemLabel = "Item",
  addLabel,
}: {
  label?: string;
  hint?: ReactNode;
  value: any[] | null | undefined;
  onChange: (v: any[]) => void;
  fields: ListFieldDef[];
  itemLabel?: string;
  addLabel?: string;
}) {
  const items = value ?? [];
  // Stable keys for rows so text areas keep their state while reordering
  const [keys, setKeys] = useState<number[]>(() => items.map((_, i) => i));
  const [nextKey, setNextKey] = useState(items.length);
  const rowKeys = keys.length === items.length ? keys : items.map((_, i) => i);

  const update = (i: number, k: string, v: unknown) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const remove = (i: number) => {
    setKeys(rowKeys.filter((_, j) => j !== i));
    onChange(items.filter((_, j) => j !== i));
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const a = [...items];
    [a[i], a[j]] = [a[j], a[i]];
    const ks = [...rowKeys];
    [ks[i], ks[j]] = [ks[j], ks[i]];
    setKeys(ks);
    onChange(a);
  };
  const add = () => {
    setKeys([...rowKeys, nextKey]);
    setNextKey(nextKey + 1);
    onChange([...items, emptyFor(fields)]);
  };

  return (
    <div className="a-field">
      {label && <span className="a-label">{label}</span>}
      {hint && <span className="hint">{hint}</span>}
      <div className="a-list">
        {items.map((it, i) => (
          <div key={rowKeys[i]} className="a-list-item">
            <div className="tools">
              <span>
                {itemLabel} {i + 1}
              </span>
              <div>
                <button type="button" className="a-btn sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button type="button" className="a-btn sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
                <button type="button" className="a-btn sm danger" onClick={() => remove(i)}>Remove</button>
              </div>
            </div>
            <div className="a-grid">
              {fields.map((f) => (
                <ListCell key={f.key} def={f} value={it?.[f.key]} onChange={(v) => update(i, f.key, v)} />
              ))}
            </div>
          </div>
        ))}
        <button type="button" className="a-btn" style={{ alignSelf: "flex-start" }} onClick={add}>
          + {addLabel ?? `Add ${itemLabel.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}

function ListCell({ def, value, onChange }: { def: ListFieldDef; value: any; onChange: (v: any) => void }) {
  const cls = def.wide || def.type === "textarea" || def.type === "paragraphs" || def.type === "list" ? "span-all" : undefined;
  switch (def.type) {
    case "text":
      return <TextField className={cls} label={def.label} hint={def.hint} value={value} onChange={onChange} />;
    case "number":
      return <NumberField className={cls} label={def.label} hint={def.hint} value={value} onChange={onChange} step={def.step} />;
    case "textarea":
      return <TextArea className={cls} label={def.label} hint={def.hint} value={value} onChange={onChange} rows={3} />;
    case "lines":
      return <LinesField className={cls} label={def.label} hint={def.hint} value={value} onChange={onChange} rows={3} />;
    case "paragraphs":
      return <ParagraphsField className={cls} label={def.label} hint={def.hint} value={value} onChange={onChange} />;
    case "bool":
      return <Checkbox label={def.label} hint={def.hint} value={!!value} onChange={onChange} />;
    case "select":
      return (
        <Field className={cls} label={def.label} hint={def.hint}>
          <select className="a-select" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">—</option>
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      );
    case "cells":
      return <CellsField className={cls} label={def.label} hint={def.hint} value={value} onChange={onChange} />;
    case "list":
      return (
        <div className={cls}>
          <ObjectList label={def.label} hint={def.hint} value={value} onChange={onChange} fields={def.fields} itemLabel={def.itemLabel ?? "Row"} />
        </div>
      );
  }
}

function CellsField({ value, onChange, ...f }: Base & { value: string[] | null | undefined; onChange: (v: string[]) => void }) {
  const [text, setText] = useState((value ?? []).join(" | "));
  return (
    <Field {...f} hint={f.hint ?? 'Separate values with " | "'}>
      <input
        className="a-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split("|").map((c) => c.trim()));
        }}
      />
    </Field>
  );
}
