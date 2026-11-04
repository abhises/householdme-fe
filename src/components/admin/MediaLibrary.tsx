"use client";

/* eslint-disable @next/next/no-img-element */
// Port of the BrasQ admin media library: drag & drop / file picker / URL import, alt text, paging.
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, errorText } from "@/lib/admin-api";
import type { Media } from "@/lib/types";
import { useConfirm } from "./ConfirmDialog";
import { DEFAULT_PAGE_SIZE, Pagination, usePaging, type Paged, type Paging } from "./Pagination";

type MediaPage = { items: Media[]; driver: string } & Paged;

export function MediaLibrary({ onPick }: { onPick?: (m: Media) => void }) {
  const [items, setItems] = useState<Media[] | null>(null);
  const [driver, setDriver] = useState("");
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const [remote, setRemote] = useState("");
  const [copied, setCopied] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  // the page lives in the URL on the Media page, but in local state inside the editors' picker
  const urlPaging = usePaging();
  const [localPage, setLocalPage] = useState(1);
  const [localSize, setLocalSize] = useState(DEFAULT_PAGE_SIZE * 2);
  const { page, pageSize, setPage, setPageSize }: Paging = onPick
    ? { page: localPage, pageSize: localSize, setPage: setLocalPage, setPageSize: (n) => { setLocalSize(n); setLocalPage(1); } }
    : urlPaging;
  const [meta, setMeta] = useState<Paged | null>(null);

  const load = useCallback(
    () =>
      adminApi<MediaPage>(`/media?page=${page}&pageSize=${pageSize}`)
        .then((d) => {
          setItems(d.items);
          setDriver(d.driver);
          setMeta(d);
        })
        .catch((e) => setError(errorText(e))),
    [page, pageSize],
  );
  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList | File[]) => {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      await adminApi("/media", { method: "POST", body: fd });
      // newest first: show the upload on page 1
      if (page > 1) setPage(1);
      else await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const importUrl = async () => {
    if (!remote) return;
    setBusy(true);
    setError("");
    try {
      await adminApi("/media/import", { method: "POST", json: { url: remote } });
      setRemote("");
      if (page > 1) setPage(1);
      else await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: Media) => {
    if (!(await confirm({ title: `Delete ${m.filename}?`, message: "Pages that use this file will show an empty photo slot." }))) return;
    try {
      await adminApi(`/media/${m.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(errorText(e));
    }
  };

  const saveAlt = async (m: Media, alt: string) => {
    if (alt !== m.alt) await adminApi(`/media/${m.id}`, { method: "PATCH", json: { alt } }).catch((e) => setError(errorText(e)));
  };

  return (
    <div>
      <div
        className={`ad-drop${over ? " ad-drop--over" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(e.dataTransfer.files);
        }}
      >
        <strong>{busy ? "Uploading…" : "Drop images here or click to upload"}</strong>
        <div className="ad-hint">
          PNG, JPG, WebP, AVIF, GIF, SVG, MP4 or PDF up to 15 MB. Stored {driver === "s3" ? "in S3" : "on the server's disk"} (switch with STORAGE_DRIVER).
        </div>
        <input ref={input} type="file" multiple accept="image/*,video/mp4,video/webm,application/pdf" hidden onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>
      <div className="ad-filters">
        <input style={{ flex: 1 }} placeholder="…or paste an image URL to import it" value={remote} onChange={(e) => setRemote(e.target.value)} />
        <button className="ad-btn" disabled={busy || !remote} onClick={importUrl}>Import</button>
      </div>
      {error && <p className="ad-error">{error}</p>}
      {!items ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="ad-hint">No media yet.</p>
      ) : (
        <div className="ad-media">
          {items.map((m) => (
            <figure key={m.id}>
              <div>
                {m.mimeType.startsWith("image/") ? (
                  <img src={m.url} alt={m.alt} loading="lazy" />
                ) : (
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{m.mimeType}</span>
                )}
              </div>
              <figcaption>
                <span title={m.filename}>
                  {m.filename} · {Math.max(1, Math.round(m.size / 1024))} KB · {m.driver}
                </span>
                <input defaultValue={m.alt} placeholder="Alt text" onBlur={(e) => saveAlt(m, e.target.value)} style={{ border: "1px solid var(--line)", padding: "4px 6px", font: "12px var(--sans)" }} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {onPick && <button className="ad-btn ad-btn--sm ad-btn--primary" onClick={() => onPick(m)}>Use</button>}
                  <button
                    className="ad-btn ad-btn--sm"
                    onClick={() => {
                      navigator.clipboard.writeText(new URL(m.url, window.location.origin).href);
                      setCopied(m.id);
                    }}
                  >
                    {copied === m.id ? "Copied" : "Copy URL"}
                  </button>
                  {!onPick && <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(m)}>Delete</button>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </div>
  );
}

export function MediaPicker({ onPick, onClose }: { onPick: (m: Media) => void; onClose: () => void }) {
  return (
    <div className="ad-modal" onClick={onClose}>
      <div className="ad-modal__box" onClick={(e) => e.stopPropagation()}>
        <div className="ad-head" style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 20 }}>Choose an image</h1>
          <button className="ad-btn" onClick={onClose}>Close</button>
        </div>
        <MediaLibrary onPick={onPick} />
      </div>
    </div>
  );
}
