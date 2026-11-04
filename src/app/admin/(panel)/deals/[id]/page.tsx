"use client";

import { useParams } from "next/navigation";
import { Checkbox, NumberField, SelectField } from "@/components/admin/fields";
import { Loading, PageHeader, Panel, SaveBar, useList, useRecord } from "@/components/admin/ui";
import { usd } from "@/lib/format";
import type { Deal, Product } from "@/lib/types";

const blank = { productId: "", wasPrice: 0, active: true, sortOrder: 0 } as unknown as Deal;

export default function DealEdit() {
  const { id } = useParams<{ id: string }>();
  const r = useRecord<Deal>("deals", id, blank, "/admin/deals");
  const products = useList<Product>("/products");
  const v = r.value;
  if (!r.loaded) return <Loading error={r.error} />;
  const product = products.items.find((p) => p.id === v.productId);
  return (
    <>
      <PageHeader title={r.isNew ? "New deal" : `Deal: ${v.product?.name ?? ""}`} />
      <Panel title="Deal">
        <div className="a-grid">
          <SelectField
            className="span-2"
            label="Product"
            value={v.productId}
            onChange={r.set("productId")}
            options={products.items.map((p) => ({ value: p.id, label: `${p.name} (${usd(p.price)})` }))}
          />
          <NumberField label="Previous price (USD)" value={v.wasPrice} onChange={r.set("wasPrice")} hint={product ? `Current price: ${usd(product.price)}` : "The 90-day reference price."} />
          <NumberField label="Sort order" value={v.sortOrder} onChange={r.set("sortOrder")} />
          <Checkbox label="Active (shown on the deals page)" value={v.active} onChange={r.set("active")} />
        </div>
      </Panel>
      <SaveBar
        saving={r.saving}
        error={r.error}
        notice={r.notice}
        onSave={() => r.save(({ productId, wasPrice, active, sortOrder }) => ({ productId, wasPrice, active, sortOrder }))}
        onDelete={r.isNew ? undefined : () => r.remove("this deal")}
        viewHref="/deals"
      />
    </>
  );
}
