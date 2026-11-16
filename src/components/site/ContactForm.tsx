"use client";

import { useState, type FormEvent } from "react";

export const CONTACT_TOPICS = [
  ["general", "General question"],
  ["editorial", "Editorial / a review"],
  ["corrections", "Report an error"],
  ["partnerships", "Partnerships"],
  ["advertising", "Advertising"],
  ["other", "Something else"],
] as const;

type Fields = { name: string; email: string; topic: string; subject: string; message: string; website: string };
const EMPTY: Fields = { name: "", email: "", topic: "general", subject: "", message: "", website: "" };

export function ContactForm() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (k: keyof Fields) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  function validate() {
    const e: typeof errors = {};
    if (!f.name.trim()) e.name = "Enter your name";
    if (!/.+@.+\..+/.test(f.email)) e.email = "Enter a valid email address";
    if (f.message.trim().length < 10) e.message = "Your message is a bit short (10 characters minimum)";
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setState("sending");
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const details: { path: string; message: string }[] = body?.details ?? [];
        if (details.length) setErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
        throw new Error(details.length ? "Please check the highlighted fields" : body?.error ?? "Something went wrong");
      }
      setState("done");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="contact-done" role="status">
        <strong>Thanks, {f.name.split(" ")[0]}! Your message is on its way.</strong>
        <p>We usually reply within two business days at {f.email}.</p>
        <button type="button" className="btn btn-outline" onClick={() => { setF(EMPTY); setState("idle"); }}>
          Send another message
        </button>
      </div>
    );
  }

  const field = (k: keyof Fields) => ({
    id: `c-${k}`,
    value: f[k],
    onChange: set(k),
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `c-${k}-err` : undefined,
  });
  const err = (k: keyof Fields) => errors[k] && <p id={`c-${k}-err`} className="form-error">{errors[k]}</p>;

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="contact-row">
        <label>
          <span>Name</span>
          <input {...field("name")} autoComplete="name" maxLength={120} />
          {err("name")}
        </label>
        <label>
          <span>Email</span>
          <input {...field("email")} type="email" autoComplete="email" maxLength={200} />
          {err("email")}
        </label>
      </div>
      <div className="contact-row">
        <label>
          <span>Topic</span>
          <select {...field("topic")}>
            {CONTACT_TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          <span>Subject <em>(optional)</em></span>
          <input {...field("subject")} maxLength={200} />
          {err("subject")}
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea {...field("message")} rows={7} maxLength={5000} />
        {err("message")}
      </label>
      {/* Honeypot for bots: hidden from people and screen readers */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>Website <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div>
        <button type="submit" className="btn btn-dark" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
