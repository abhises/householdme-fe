"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { usePagedList } from "@/components/admin/usePagedList";
import { adminApi, errorText } from "@/lib/admin-api";
import { usd } from "@/lib/format";
import type { Deal, Product } from "@/lib/types";

type Edit = { id: string; productId: string; wasPrice: number; active: boolean; sortOrder: number };
const blank: Edit = { id: "", productId: "", wasPrice: 0, active: true, sortOrder: 0 };

export default function DealsPage() {
  const confirm = useConfirm();
  const { rows, meta, error: loadError, load, setPage, setPageSize } = usePagedList<Deal>("deals");
  const [products, setProducts] = useState<Product[]>([]);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi<{ items: Product[] }>("/products?pageSize=500").then((d) => setProducts(d.items)).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError("");
    const { id, ...body } = edit;
    if (!body.productId) {
      setError("Choose a product");
      return;
    }
    try {
      await adminApi(id ? `/deals/${id}` : "/deals", { method: id ? "PUT" : "POST", json: body });
      setEdit(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (d: Deal) => {
    if (!(await confirm({ title: `Remove the deal on ${d.product.name}?`, message: "It disappears from the deals page. The product itself stays." , confirmLabel: "Remove" }))) return;
    try {
      await adminApi(`/deals/${d.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const current = products.find((p) => p.id === edit?.productId);

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Deals</h1>
          <p className="ad-hint" style={{ margin: "4px 0 0" }}>Price drops on /deals. The current price comes from the product.</p>
        </div>
        <button className="ad-btn ad-btn--primary" onClick={() => { setEdit({ ...blank, sortOrder: meta?.total ?? 0 }); setError(""); }}>+ New deal</button>
      </div>
      {edit && (
        <form className="ad-card ad-form" style={{ marginBottom: 16, maxWidth: 640 }} onSubmit={save}>
          <label>Product
            <select value={edit.productId} onChange={(e) => setEdit({ ...edit, productId: e.target.value })}>
              <option value="">—</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({usd(p.price)})</option>)}
            </select>
          </label>
          <div className="ad-2">
            <label>Previous price (USD)<input type="number" value={edit.wasPrice} onChange={(e) => setEdit({ ...edit, wasPrice: Number(e.target.value) })} />
              <span className="ad-hint">{current ? `Now ${usd(current.price)}${edit.wasPrice > current.price ? ` · ${Math.round((1 - current.price / edit.wasPrice) * 100)}% off` : ""}` : "The price over the past 90 days."}</span>
            </label>
            <label>Sort order<input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></label>
          </div>
          <label className="ad-check"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Show on the deals page</label>
          {error && <p className="ad-error">{error}</p>}
          <div className="ad-savebar"><button className="ad-btn ad-btn--primary">Save</button><button type="button" className="ad-btn" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      {!edit && error && <p className="ad-error">{error}</p>}
      {loadError && <p className="ad-error">{loadError}</p>}
      <table className="ad-table">
        <thead><tr><th>#</th><th>Product</th><th>Was</th><th>Now</th><th>Off</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows?.map((d) => (
            <tr key={d.id}>
              <td className="ad-cell-hide">{d.sortOrder}</td>
              <td className="ad-cell-main"><strong>{d.product.name}</strong></td>
              <td>{usd(d.wasPrice)}</td>
              <td>{usd(d.product.price)}</td>
              <td>{d.wasPrice ? `${Math.round((1 - d.product.price / d.wasPrice) * 100)}%` : "—"}</td>
              <td><span className={`ad-pill ad-pill--${d.active ? "published" : "draft"}`}>{d.active ? "active" : "hidden"}</span></td>
              <td className="ad-cell-end" style={{ whiteSpace: "nowrap" }}>
                <button className="ad-btn ad-btn--sm" onClick={() => { setEdit({ id: d.id, productId: d.productId, wasPrice: d.wasPrice, active: d.active, sortOrder: d.sortOrder }); setError(""); }}>Edit</button>{" "}
                <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(d)}>Remove</button>
              </td>
            </tr>
          ))}
          {rows?.length === 0 && <tr><td colSpan={7}>No deals yet.</td></tr>}
        </tbody>
      </table>
      {meta && <Pagination {...meta} onChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
