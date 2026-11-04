"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { adminApi, errorText } from "@/lib/admin-api";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await adminApi("/api/auth/login", { method: "POST", json: { email, password } });
      const next = params.get("next");
      // Full navigation so the proxy sees the new cookie
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
    } catch (err) {
      setError(errorText(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="ad-form">
      <label>Email<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <p className="ad-error">{error}</p>}
      <button className="ad-btn ad-btn--primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="ad-login">
      <div className="ad-login__box">
        <span className="ad-login__logo">Household<span>Me</span> admin</span>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
