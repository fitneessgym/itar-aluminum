import { useMemo, useState } from "react";
import { CAT_LABEL, UNIT_LABEL, available, type Category, type Unit, useItar } from "@/lib/itar-store";
import { money, qty } from "@/lib/format";
import { Badge, Btn, Card, Field, Modal, fieldClass } from "./ui-bits";

const CATS: Category[] = ["aluminum", "glass", "accessories", "consumable"];

export function StockView() {
  const products = useItar((s) => s.products);
  const bars = useItar((s) => s.bars);
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<"in" | "new" | null>(null);
  const [pick, setPick] = useState(products[0]?.id ?? "");
  const [delta, setDelta] = useState("10");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "aluminum" as Category,
    unit: "m" as Unit,
    stock: "0",
    min: "10",
    cost: "",
    price: "",
  });

  const rows = useMemo(() => {
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (q && !`${p.name} ${p.sku}`.includes(q)) return false;
      return true;
    });
  }, [products, cat, q]);

  function receive() {
    const n = Number(delta);
    if (!pick || !Number.isFinite(n) || n === 0) return;
    useItar.getState().adjustStock(pick, n);
    setOpen(null);
  }

  function create() {
    const cost = Number(form.cost);
    const price = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(cost) || !Number.isFinite(price)) return;
    useItar.getState().addProduct({
      name: form.name.trim(),
      sku: form.sku.trim() || form.name.slice(0, 6),
      category: form.category,
      unit: form.unit,
      stock: Number(form.stock) || 0,
      min: Number(form.min) || 0,
      cost,
      price,
    });
    setOpen(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle">المستودع</p>
          <h1 className="mt-1 text-3xl tracking-tight">الأصناف والكميات</h1>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => setOpen("in")}>
            إدخال بضاعة
          </Btn>
          <Btn onClick={() => setOpen("new")}>صنف جديد</Btn>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالاسم أو الباركود…"
          className={fieldClass}
        />
        <div className="flex gap-1 overflow-x-auto">
          {(["all", ...CATS] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`h-11 shrink-0 rounded-full px-3 text-sm ${
                cat === c ? "bg-accent text-accent-fg" : "bg-surface text-muted ring-1 ring-border"
              }`}
            >
              {c === "all" ? "الكل" : CAT_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start font-medium">الصنف</th>
              <th className="px-4 py-3 text-start font-medium">التصنيف</th>
              <th className="px-4 py-3 text-end font-medium">متاح / محجوز</th>
              <th className="px-4 py-3 text-end font-medium">التكلفة</th>
              <th className="px-4 py-3 text-end font-medium">البيع</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <p>{p.name}</p>
                  <p className="text-xs text-subtle">{p.sku}</p>
                </td>
                <td className="px-4 py-3 text-muted">{CAT_LABEL[p.category]}</td>
                <td className="px-4 py-3 text-end">
                  <span className="tabular">
                    {qty(available(p))} {UNIT_LABEL[p.unit]}
                  </span>
                  {p.reserved > 0 ? (
                    <span className="ms-2 text-xs text-subtle">حُجز {qty(p.reserved)}</span>
                  ) : null}
                  {available(p) <= p.min ? (
                    <span className="ms-2">
                      <Badge tone="danger">نواقص</Badge>
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-end tabular text-muted">{money(p.cost)}</td>
                <td className="px-4 py-3 text-end tabular">{money(p.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-medium">فضلات قابلة للاستخدام</h2>
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {bars.filter((b) => b.lengthCm < 600).length === 0 ? (
              <li className="text-muted">لا فضلات محفوظة بعد القص.</li>
            ) : (
              bars
                .filter((b) => b.lengthCm < 600)
                .slice(0, 12)
                .map((b) => (
                  <li key={b.id} className="flex justify-between gap-3">
                    <span className="truncate">{b.sku}</span>
                    <span className="tabular text-muted">
                      {b.lengthCm} سم · {b.barcode}
                    </span>
                  </li>
                ))
            )}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-medium">قطاعات 6 متر</h2>
          <ul className="space-y-2 text-sm">
            {["AL-SL-W", "AL-SL-B", "AL-DR-W"].map((sku) => {
              const n = bars.filter((b) => b.sku === sku && b.lengthCm === 600).length;
              const prod = products.find((p) => p.sku === sku);
              return (
                <li key={sku} className="flex justify-between">
                  <span>{prod?.name}</span>
                  <span className="tabular">{n} قطاع</span>
                </li>
              );
            })}
          </ul>
          {q.length > 4 ? (
            <p className="mt-3 text-xs text-muted">
              باركود مطابق: {bars.filter((b) => b.barcode.includes(q.toUpperCase())).length}
            </p>
          ) : null}
        </Card>
      </div>

      {open === "in" ? (
        <Modal title="إدخال بضاعة للمستودع" onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <Field label="الصنف">
              <select className={fieldClass} value={pick} onChange={(e) => setPick(e.target.value)}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الكمية (+ إدخال / − صرف)">
              <input className={fieldClass} value={delta} onChange={(e) => setDelta(e.target.value)} />
            </Field>
            <Btn className="w-full" onClick={receive}>
              حفظ الحركة
            </Btn>
          </div>
        </Modal>
      ) : null}

      {open === "new" ? (
        <Modal title="صنف جديد" onClose={() => setOpen(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم">
              <input className={fieldClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="الرمز">
              <input className={fieldClass} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="التصنيف">
              <select
                className={fieldClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {CAT_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الوحدة">
              <select
                className={fieldClass}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
              >
                {Object.entries(UNIT_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="تكلفة الشراء">
              <input className={fieldClass} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
            <Field label="سعر البيع">
              <input className={fieldClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
          </div>
          <Btn className="mt-4 w-full" onClick={create}>
            إضافة الصنف
          </Btn>
        </Modal>
      ) : null}
    </div>
  );
}
