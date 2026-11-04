"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { adminApi, errorText } from "@/lib/admin-api";
import type { Media } from "@/lib/types";
import { Field } from "./fields";

export async function uploadFiles(files: FileList | File[]): Promise<Media[]> {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("files", f));
  const res = await adminApi<{ items: Media[] }>("/media", { method: "POST", body: fd });
  return res.items;
}

export function Uploader({ onUploaded, accept = "image/*", multiple = true, compact }: { onUploaded: (m: Media[]) => void; accept?: string; multiple?: boolean; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    try {
      onUploaded(await uploadFiles(files));
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div
        className={`a-drop ${over ? "over" : ""}`}
        style={compact ? { padding: 10, fontSize: 13 } : undefined}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
      >
        {busy ? "Uploading…" : compact ? "Upload" : "Drop files here or click to upload"}
        <input ref={input} type="file" accept={accept} multiple={multiple} hidden onChange={(e) => handle(e.target.files)} />
      </div>
      {err && <div className="a-alert error">{err}</div>}
    </div>
  );
}

export function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminApi<{ items: Media[] }>("/media")
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 900, flexDirection: "column", flexWrap: "nowrap", boxShadow: "10px 10px 0 var(--blue)" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="stack" style={{ padding: 22, gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Media library</h2>
          <Uploader onUploaded={(m) => setItems((cur) => [...m, ...cur])} />
          {loading ? (
            <p>Loading…</p>
          ) : items.length === 0 ? (
            <p className="small">No uploads yet.</p>
          ) : (
            <div className="a-media-grid">
              {items
                .filter((m) => m.mimeType.startsWith("image/") || m.mimeType.startsWith("video/"))
                .map((m) => (
                  <button key={m.id} type="button" className="a-media" style={{ cursor: "pointer", padding: 0, textAlign: "left" }} onClick={() => onPick(m.url)}>
                    <div className="img">{m.mimeType.startsWith("image/") ? <img src={m.url} alt={m.filename} /> : "video"}</div>
                    <div className="meta"><span>{m.filename}</span></div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Single image URL with preview, upload and library picker. */
export function ImageField({ label, hint, value, onChange, className }: { label: string; hint?: string; value: string | null | undefined; onChange: (v: string | null) => void; className?: string }) {
  const [picking, setPicking] = useState(false);
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="a-image-field">
        <div className="preview">{value && <img src={value} alt="" />}</div>
        <div className="stack" style={{ gap: 8, flex: "1 1 220px", minWidth: 0 }}>
          <input className="a-input" placeholder="https://… or upload" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Uploader compact multiple={false} onUploaded={(m) => m[0] && onChange(m[0].url)} />
            <button type="button" className="a-btn sm" onClick={() => setPicking(true)}>Choose from library</button>
            {value && <button type="button" className="a-btn sm danger" onClick={() => onChange(null)}>Clear</button>}
          </div>
        </div>
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            onChange(url);
            setPicking(false);
          }}
        />
      )}
    </Field>
  );
}

/** Ordered list of image URLs (product gallery). */
export function ImageListField({ label, hint, value, onChange }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [picking, setPicking] = useState(false);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const a = [...value];
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
  };
  return (
    <Field label={label} hint={hint}>
      <div className="a-media-grid">
        {value.map((url, i) => (
          <div key={url + i} className="a-media">
            <div className="img"><img src={url} alt="" /></div>
            <div className="meta">
              <span title={url}>{i === 0 ? "Main photo" : `Photo ${i + 1}`}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button type="button" className="a-btn sm" onClick={() => move(i, -1)} disabled={i === 0}>←</button>
                <button type="button" className="a-btn sm" onClick={() => move(i, 1)} disabled={i === value.length - 1}>→</button>
                <button type="button" className="a-btn sm danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Uploader compact onUploaded={(m) => onChange([...value, ...m.map((x) => x.url)])} />
        <button type="button" className="a-btn sm" onClick={() => setPicking(true)}>Choose from library</button>
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            onChange([...value, url]);
            setPicking(false);
          }}
        />
      )}
    </Field>
  );
}
