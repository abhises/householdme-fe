import type { SectionFieldDef } from "./types";

/** Short random id for a new section or list item. */
export const newId = () => Math.random().toString(36).slice(2, 10);

/** Starting values for a new section or list item, from the fields' defaults. */
export function emptyData(fields: SectionFieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.default !== undefined) out[f.key] = f.default;
    else if (f.type === "list") out[f.key] = [];
    else if (f.type === "toggle") out[f.key] = false;
    else out[f.key] = "";
  }
  return out;
}

/** "{{label}} · {{name}}" with an item's values, for list rows in the form. */
export function fillLabel(tpl: string | undefined, item: Record<string, unknown>, fallback: string) {
  if (!tpl) return fallback;
  const s = tpl
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) => {
      const v = item[k];
      return typeof v === "string" || typeof v === "number" ? String(v).replace(/<[^>]+>/g, "") : "";
    })
    .replace(/^[\s·|-]+|[\s·|-]+$/g, "")
    .trim();
  return s ? (s.length > 70 ? s.slice(0, 68) + "…" : s) : fallback;
}
