"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { adminApi, errorText } from "@/lib/admin-api";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi("/api/auth/login", { method: "POST", json: { email, password } });
      const next = params.get("next");
      // Full navigation so the proxy sees the new cookie
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="stack" style={{ gap: 6 }}>
        <span className="logo" style={{ color: "var(--ink)" }}>HouseholdMe</span>
        <span className="eyebrow eyebrow-blue">Admin panel</span>
      </div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>Sign in</h1>
      {error && <div className="a-alert error">{error}</div>}
      <div className="a-field">
        <label htmlFor="email">Email</label>
        <input id="email" className="a-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="a-field">
        <label htmlFor="password">Password</label>
        <input id="password" className="a-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="a-btn primary" style={{ padding: "12px 16px", fontSize: 15 }} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <Link href="/" className="small">← Back to the site</Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="a-login">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
