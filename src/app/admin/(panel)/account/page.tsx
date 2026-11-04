"use client";

import { useState, type FormEvent } from "react";
import { adminApi, errorText } from "@/lib/admin-api";

export default function AccountPage() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [repeat, setRepeat] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== repeat) return setMsg({ ok: false, text: "The new passwords don't match." });
    setBusy(true);
    try {
      await adminApi("/api/auth/password", { method: "PUT", json: { currentPassword, newPassword } });
      setMsg({ ok: true, text: "Password changed." });
      setCurrent(""); setNew(""); setRepeat("");
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="ad-head"><h1>Account</h1></div>
      <form className="ad-card ad-form" style={{ maxWidth: 420 }} onSubmit={submit}>
        <strong>Change password</strong>
        <label>Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNew(e.target.value)} /><span className="ad-hint">At least 8 characters.</span></label>
        <label>Repeat new password<input type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} /></label>
        {msg && <p className={msg.ok ? "ad-ok" : "ad-error"}>{msg.text}</p>}
        <div className="ad-savebar"><button className="ad-btn ad-btn--primary" disabled={busy}>{busy ? "Saving…" : "Change password"}</button></div>
      </form>
    </>
  );
}
