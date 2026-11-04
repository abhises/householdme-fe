"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Uploader } from "@/components/admin/media";
import { Loading, PageHeader, Panel, useList } from "@/components/admin/ui";
import { adminApi, errorText } from "@/lib/admin-api";
import type { Media } from "@/lib/types";

const size = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function MediaPage() {
  const { items, setItems, loading, error } = useList<Media>("/media");
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const remove = async (m: Media) => {
    if (!window.confirm(`Delete ${m.filename}? Pages that use this file will show an empty photo slot.`)) return;
    try {
      await adminApi(`/media/${m.id}`, { method: "DELETE" });
      setItems((cur) => cur.filter((x) => x.id !== m.id));
    } catch (e) {
      setMsg(errorText(e));
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <>
      <PageHeader title="Media library" subtitle="Images and videos used across the site. Storage driver is set by STORAGE_DRIVER in the API (local disk now, S3 later)." />
      <Panel title="Upload">
        <Uploader accept="image/*,video/mp4,video/webm,application/pdf" onUploaded={(m) => setItems((cur) => [...m, ...cur])} />
        <span className="small">Up to 15 MB per file. PNG, JPG, WebP, GIF, AVIF, SVG, MP4, WebM or PDF.</span>
      </Panel>
      {msg && <div className="a-alert error">{msg}</div>}
      {loading ? (
        <Loading error={error} />
      ) : items.length === 0 ? (
        <p className="small">No files uploaded yet.</p>
      ) : (
        <div className="a-media-grid">
          {items.map((m) => (
            <div key={m.id} className="a-media">
              <div className="img">{m.mimeType.startsWith("image/") ? <img src={m.url} alt={m.filename} /> : m.mimeType.split("/")[1]}</div>
              <div className="meta">
                <span title={m.filename} style={{ fontWeight: 700 }}>{m.filename}</span>
                <span className="small">
                  {size(m.size)} · {m.driver}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" className="a-btn sm" onClick={() => copy(m.url)}>{copied === m.url ? "Copied" : "Copy URL"}</button>
                  <button type="button" className="a-btn sm danger" onClick={() => remove(m)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
