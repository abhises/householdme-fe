"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, errorText } from "@/lib/admin-api";
import type { AllSettings } from "@/lib/types";

type Msg = { ok: boolean; text: string } | null;

/** Loads one settings group, tracks unsaved changes and saves it (Ctrl/⌘+S works too). */
export function useSetting<K extends keyof AllSettings>(key: K) {
  const [value, setValue] = useState<AllSettings[K] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    adminApi<{ values: AllSettings }>("/settings")
      .then((r) => setValue(r.values[key]))
      .catch((e) => setMsg({ ok: false, text: errorText(e) }));
  }, [key]);

  const update = useCallback((patch: Partial<AllSettings[K]>) => {
    setValue((v) => (v ? { ...v, ...patch } : v));
    setDirty(true);
    setMsg(null);
  }, []);

  const save = useCallback(async () => {
    if (!value) return;
    setBusy(true);
    try {
      const saved = await adminApi<AllSettings[K]>(`/settings/${key}`, { method: "PUT", json: value });
      setValue(saved);
      setDirty(false);
      setSavedAt(Date.now());
      setMsg({ ok: true, text: `Saved ${new Date().toLocaleTimeString()}` });
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    } finally {
      setBusy(false);
    }
  }, [key, value]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty]);

  return { value, update, save, dirty, busy, msg, savedAt };
}
