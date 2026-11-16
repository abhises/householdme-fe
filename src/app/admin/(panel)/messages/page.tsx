"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText } from "@/lib/admin-api";
import type { ContactMessage } from "@/lib/types";

const TOPICS: Record<string, string> = {
  general: "General",
  editorial: "Editorial",
  corrections: "Correction",
  partnerships: "Partnership",
  advertising: "Advertising",
  other: "Other",
};

const when = (d: string) =>
  new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Tell the sidebar badge to refresh. */
const notifyNav = () => window.dispatchEvent(new Event("hm:messages-changed"));

export default function MessagesPage() {
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const query = [q && `q=${encodeURIComponent(q)}`, status && `status=${status}`].filter(Boolean).join("&");
  const { rows, meta, error, setError, load, page, setPage, setPageSize } = usePagedList<ContactMessage>("messages", query);
  const resetPage = () => { if (page > 1) setPage(1); };

  const setRead = async (m: ContactMessage, read: boolean) => {
    try {
      await adminApi(`/messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ read }) });
      await load();
      notifyNav();
    } catch (e) {
      setError(errorText(e));
    }
  };

  const toggle = (m: ContactMessage) => {
    const next = open === m.id ? null : m.id;
    setOpen(next);
    if (next && !m.read) setRead(m, true);
  };

  const remove = async (m: ContactMessage) => {
    if (!(await confirm({ title: "Delete message?", message: `The message from ${m.name} <${m.email}> will be permanently deleted.`, confirmLabel: "Delete" }))) return;
    try {
      await adminApi(`/messages/${m.id}`, { method: "DELETE" });
      if (open === m.id) setOpen(null);
      await load();
      notifyNav();
    } catch (e) {
      setError(errorText(e));
    }
  };

  const replyHref = (m: ContactMessage) =>
    `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to HouseholdMe"}`)}`;

  return (
    <>
      <div className="ad-head">
        <h1>Messages {meta && <span className="ad-hint">({meta.total})</span>}</h1>
        <a className="ad-btn" href="/contact" target="_blank" rel="noreferrer">View contact page ↗</a>
      </div>
      <div className="ad-filters">
        <input placeholder="Search name, email or message" value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); resetPage(); }} aria-label="Status">
          <option value="">All messages</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>
      {error && <p className="ad-error">{error}</p>}
      {!rows ? <p>Loading…</p> : (
        <table className="ad-table">
          <thead><tr><th>From</th><th>Subject</th><th className="ad-cell-hide">Topic</th><th className="ad-cell-hide">Received</th><th></th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <MessageRow key={m.id} m={m} open={open === m.id} onToggle={() => toggle(m)} onRead={(r) => setRead(m, r)} onDelete={() => remove(m)} replyHref={replyHref(m)} />
            ))}
            {rows.length === 0 && <tr><td colSpan={5}>{q || status ? "No messages match." : "No messages yet. They’ll show up here when someone uses the contact form."}</td></tr>}
          </tbody>
        </table>
      )}
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}

function MessageRow({ m, open, onToggle, onRead, onDelete, replyHref }: {
  m: ContactMessage; open: boolean; onToggle: () => void; onRead: (read: boolean) => void; onDelete: () => void; replyHref: string;
}) {
  return (
    <>
      <tr className={`ad-msg${m.read ? "" : " ad-msg--unread"}`}>
        <td className="ad-cell-main">
          <button type="button" className="ad-msg__toggle" onClick={onToggle} aria-expanded={open}>
            {!m.read && <span className="ad-msg__dot" aria-label="Unread" />}
            <span>{m.name}</span>
          </button>
          <div className="ad-hint">{m.email}</div>
        </td>
        <td>
          <button type="button" className="ad-msg__toggle ad-msg__subject" onClick={onToggle} aria-expanded={open}>
            {m.subject || <span className="ad-hint">{m.message.slice(0, 80)}{m.message.length > 80 ? "…" : ""}</span>}
          </button>
        </td>
        <td className="ad-cell-hide"><span className="ad-pill">{TOPICS[m.topic] ?? m.topic}</span></td>
        <td className="ad-cell-hide">{when(m.createdAt)}</td>
        <td className="ad-cell-end">
          <button type="button" className="ad-btn ad-btn--sm" onClick={onToggle}>{open ? "Close" : "Open"}</button>
        </td>
      </tr>
      {open && (
        <tr className="ad-msg__body">
          <td colSpan={5}>
            <dl className="ad-msg__meta">
              <dt>From</dt><dd>{m.name} &lt;<a href={`mailto:${m.email}`}>{m.email}</a>&gt;</dd>
              <dt>Topic</dt><dd>{TOPICS[m.topic] ?? m.topic}</dd>
              <dt>Received</dt><dd>{when(m.createdAt)}</dd>
              {m.subject && <><dt>Subject</dt><dd>{m.subject}</dd></>}
            </dl>
            <p className="ad-msg__text">{m.message}</p>
            <div className="ad-msg__actions">
              <a className="ad-btn ad-btn--primary ad-btn--sm" href={replyHref}>Reply by email</a>
              <button type="button" className="ad-btn ad-btn--sm" onClick={() => onRead(!m.read)}>Mark as {m.read ? "unread" : "read"}</button>
              <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" onClick={onDelete}>Delete</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
