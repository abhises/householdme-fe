"use client";

import { useLinkStatus } from "next/link";

/**
 * Put inside a <Link>: shows an animated bar under the link while its page loads, so a click responds at once.
 * (A route-level loading.tsx would do this too, but it makes missing pages answer 200 instead of 404.)
 */
export function PendingHint() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`link-pending${pending ? " is-pending" : ""}`} />;
}
