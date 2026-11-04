import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

const API_URL = process.env.API_URL ?? "http://localhost:4100";

/**
 * Fetch from the public API on the server. Content is edited live in the admin
 * panel, so responses are never cached. A 404 renders the site's not-found page.
 */
export async function api<T>(path: string, opts: { preview?: boolean } = {}): Promise<T> {
  let res: Response;
  const headers: Record<string, string> = {};
  if (opts.preview) {
    // Forward the admin session so the API returns drafts (?preview=1)
    const session = (await cookies()).get("hm_admin")?.value;
    if (session) headers.Authorization = `Bearer ${session}`;
    path += (path.includes("?") ? "&" : "?") + "preview=1";
  }
  try {
    res = await fetch(`${API_URL}/api/public${path}`, { cache: "no-store", headers });
  } catch {
    throw new Error(`Could not reach the HouseholdMe API at ${API_URL}. Is householdme-be running?`);
  }
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

/** Like api(), but returns `fallback` when the API is unreachable (used for build-time prerendering of chrome). */
export async function apiOr<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}/api/public${path}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}
