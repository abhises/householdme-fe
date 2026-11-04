"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, errorText } from "@/lib/admin-api";
import { usePaging, type Paged } from "./Pagination";

/** Loads `/resource?page=&pageSize=` (+ extra query) and keeps the page in the URL, like the BrasQ lists. */
export function usePagedList<T>(resource: string, query = "") {
  const paging = usePaging();
  const { page, pageSize } = paging;
  const [rows, setRows] = useState<T[] | null>(null);
  const [meta, setMeta] = useState<Paged | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      adminApi<{ items: T[] } & Paged>(`/${resource}?page=${page}&pageSize=${pageSize}${query ? `&${query}` : ""}`)
        .then((d) => {
          setRows(d.items);
          setMeta(d);
          setError("");
        })
        .catch((e) => setError(errorText(e))),
    [resource, page, pageSize, query],
  );
  useEffect(() => {
    load();
  }, [load]);
  return { rows, meta, error, setError, load, ...paging };
}
