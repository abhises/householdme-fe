"use client";

import { useState, type FormEvent } from "react";
import { PageHeader, Panel } from "@/components/admin/ui";
import { adminApi, errorText } from "@/lib/admin-api";

export default function AccountPage() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setMsg({ ok: false, text: "The new passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      await adminApi("/api/auth/password", { method: "PUT", json: { currentPassword, newPassword } });
      setMsg({ ok: true, text: "Password changed." });
      setCurrent("");
      setNew("");
      setConfirm("");
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Account" />
      <Panel title="Change password">
        <form onSubmit={submit} className="stack" style={{ gap: 14, maxWidth: 420 }}>
          {msg && <div className={`a-alert ${msg.ok ? "ok" : "error"}`}>{msg.text}</div>}
          <div className="a-field"><label>Current password</label><input className="a-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required /></div>
          <div className="a-field"><label>New password</label><input className="a-input" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNew(e.target.value)} required /></div>
          <div className="a-field"><label>Repeat new password</label><input className="a-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
          <button className="a-btn primary" style={{ alignSelf: "flex-start" }} disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
        </form>
      </Panel>
    </>
  );
}
