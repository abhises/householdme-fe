"use client";

import { useState, type FormEvent } from "react";

interface Props {
  /** "inline" = blue button on dark band, "boxed" = black-bordered form, "stacked" = popup form */
  variant?: "inline" | "boxed" | "stacked";
  button?: string;
  source?: string;
  doneClassName?: string;
  onDone?: () => void;
}

export const SUBSCRIBED_KEY = "hm-subscribed";

export function NewsletterForm({ variant = "inline", button = "Subscribe", source, doneClassName, onDone }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/.+@.+\..+/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.details?.[0]?.message ?? body?.error ?? "Something went wrong");
      }
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {}
      setState("done");
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className={doneClassName} style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
        Thanks! Confirm your subscription via the email we just sent you.
      </p>
    );
  }

  if (variant === "stacked") {
    return (
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }} noValidate>
        <input
          type="email"
          aria-label="Email address"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ border: "2px solid var(--ink)", padding: "13px 14px", fontSize: 15, minWidth: 0 }}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="btn"
          style={{ background: "var(--blue)", color: "#fff", border: "2px solid var(--ink)", padding: "13px 18px", fontWeight: 800, fontSize: 16 }}
        >
          {state === "sending" ? "Subscribing…" : button}
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={submit} className={`nl-inline ${variant === "boxed" ? "boxed" : ""}`} noValidate>
      <input type="email" aria-label="Email address" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "…" : button}
      </button>
      {error && <p className="form-error" style={variant === "inline" ? { color: "#ffb4ab" } : undefined}>{error}</p>}
    </form>
  );
}
