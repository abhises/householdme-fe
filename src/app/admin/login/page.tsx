"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { adminApi, errorText } from "@/lib/admin-api";

const EYE = "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6";
const EYE_OFF = "M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
    <form onSubmit={submit}>
      <label>
        Email
        <input
          type="email"
          required
          autoFocus
          autoComplete="username"
          placeholder="you@householdme.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Password
        <div className="ad-login__pw">
          <input
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="ad-login__eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            title={show ? "Hide password" : "Show password"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={show ? EYE_OFF : EYE} /></svg>
          </button>
        </div>
      </label>
      {error && <p className="ad-login__error" role="alert">{error}</p>}
      <button className="ad-login__submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="ad-login">
      <Link href="/" className="ad-login__back">← Back to main site</Link>
      <div className="ad-login__box">
        <div className="ad-login__brand">
          <img src="/icon.png" alt="" className="ad-login__mark" width={52} height={52} />
          <div>
            <h1>Welcome back</h1>
            <p>Sign in to the HouseholdMe admin</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="ad-login__foot">© {new Date().getFullYear()} HouseholdMe</p>
    </div>
  );
}
