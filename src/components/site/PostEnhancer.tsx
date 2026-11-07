'use client';
import { useEffect } from 'react';
import { SUBSCRIBED_KEY } from './NewsletterForm';

const THANKS = "Thanks! Confirm your subscription via the email we just sent you.";
async function subscribe(email: string, source: string) {
  if (!/.+@.+\..+/.test(email)) throw new Error("Enter a valid email address");
  const res = await fetch("/api/public/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source }) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.details?.[0]?.message ?? body?.error ?? "Something went wrong");
  }
  try { localStorage.setItem(SUBSCRIBED_KEY, "1"); } catch {}
}

/**
 * Adds behaviour to plain HTML stored in the database:
 *  - <form data-bq-subscribe data-source="..."> with an email input  -> newsletter signup
 *  - <div data-bq-gallery> with .bq-gallery__main img and buttons[data-src] -> image gallery
 *  - <section data-bq-helpful> with buttons[data-vote]                  -> "Was this helpful?"
 *  - <button data-bq-copy>                                               -> copies the page URL
 *  - <aside class="bq-toc" data-bq-spy>                                  -> highlights the section in view
 *  - <div data-bq-estimator data-budget data-cap>                        -> live estimate (see below)
 */
export function PostEnhancer({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const off: (() => void)[] = [];
    const on = (el: Element, ev: string, fn: (e: Event) => void) => { el.addEventListener(ev, fn); off.push(() => el.removeEventListener(ev, fn)); };

    root.querySelectorAll<HTMLFormElement>('form[data-bq-subscribe]').forEach((form) => {
      on(form, 'submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector<HTMLInputElement>('input[type=email]');
        form.querySelector('.bq-form-error')?.remove();
        try {
          await subscribe(input?.value ?? '', form.dataset.source || 'post');
          const p = document.createElement('p');
          p.className = 'bq-form-done';
          p.textContent = THANKS;
          form.replaceWith(p);
        } catch (err) {
          const p = document.createElement('p');
          p.className = 'bq-form-error';
          p.textContent = (err as Error).message;
          form.appendChild(p);
        }
      });
    });

    root.querySelectorAll<HTMLElement>('[data-bq-gallery]').forEach((gallery) => {
      const main = gallery.querySelector<HTMLImageElement>('.bq-gallery__main img');
      const thumbs = gallery.querySelectorAll<HTMLButtonElement>('button[data-src]');
      thumbs.forEach((btn) => on(btn, 'click', () => {
        if (main) { main.src = btn.dataset.src!; main.alt = btn.getAttribute('aria-label') ?? ''; }
        thumbs.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      }));
    });

    root.querySelectorAll<HTMLElement>('[data-bq-helpful]').forEach((box) => {
      box.querySelectorAll('button[data-vote]').forEach((btn) => on(btn, 'click', () => {
        box.innerHTML = '<span style="font-size:15px;font-weight:700">Thanks for your feedback. Missing something? <a href="/contact">Let us know</a>.</span>';
      }));
    });

    // "Copy link" button
    root.querySelectorAll<HTMLButtonElement>('button[data-bq-copy]').forEach((btn) => on(btn, 'click', async () => {
      const label = btn.textContent;
      try { await navigator.clipboard.writeText(window.location.href.split('#')[0]); btn.textContent = 'Link copied'; }
      catch { btn.textContent = 'Copy failed'; }
      setTimeout(() => { btn.textContent = label; }, 2000);
    }));

    // Table of contents that highlights the section you're reading: <aside class="bq-toc" data-bq-spy>
    root.querySelectorAll<HTMLElement>('[data-bq-spy]').forEach((toc) => {
      const links = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].filter((a) => a.getAttribute('href')!.length > 1);
      const targets = links.map((a) => document.getElementById(decodeURIComponent(a.getAttribute('href')!.slice(1))));
      let raf = 0;
      const update = () => {
        raf = 0;
        let cur = 0;
        targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < 140) cur = i; });
        links.forEach((a, i) => a.classList.toggle('is-active', i === cur));
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
      window.addEventListener('scroll', onScroll, { passive: true });
      off.push(() => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); });
      update();
    });

    /*
     * Estimator: result = budget / (range value × every selected factor × 52 weeks), capped.
     *   <div data-bq-estimator data-budget="650" data-cap="7">
     *     <div data-factor-group><button data-factor="0.7" aria-pressed="true">…</button>…</div>
     *     <input type="range" data-range>            (e.g. cleans per week)
     *     <span data-out="range"> <span data-out="result"> <span data-out="perYear">
     */
    root.querySelectorAll<HTMLElement>('[data-bq-estimator]').forEach((box) => {
      const budget = Number(box.dataset.budget) || 0, cap = Number(box.dataset.cap) || Infinity;
      const range = box.querySelector<HTMLInputElement>('input[data-range]');
      const out = (k: string, v: string) => box.querySelectorAll(`[data-out="${k}"]`).forEach((el) => { el.textContent = v; });
      const calc = () => {
        const factors = [...box.querySelectorAll<HTMLButtonElement>('[data-factor-group] button[aria-pressed="true"]')].map((b) => Number(b.dataset.factor) || 1);
        const per = (range ? Number(range.value) : 1) * factors.reduce((a, b) => a * b, 1);
        const perYear = Math.round(per * 52);
        const years = perYear ? budget / perYear : Infinity;
        out('range', range?.value ?? '');
        out('perYear', String(perYear));
        out('result', years >= cap ? `${cap}+ years` : `${(Math.round(years * 10) / 10).toLocaleString('en-US')} ${years < 1.05 ? 'year' : 'years'}`);
      };
      box.querySelectorAll<HTMLElement>('[data-factor-group]').forEach((group) => {
        group.querySelectorAll<HTMLButtonElement>('button[data-factor]').forEach((btn) => on(btn, 'click', () => {
          group.querySelectorAll('button[data-factor]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          calc();
        }));
      });
      if (range) on(range, 'input', calc);
      calc();
    });

    return () => off.forEach((f) => f());
  }, [rootId]);
  return null;
}
