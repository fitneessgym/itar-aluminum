import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KIND_LABEL,
  STATUS_LABEL,
  needOf,
  openingsOf,
  planFor,
  projectPnl,
  type OrderStatus,
  type WindowKind,
  type WorkOrder,
  useItar,
} from "@/lib/itar-store";
import { money, qty, todayIso } from "@/lib/format";
import { uid } from "@/lib/utils";
import { priceJob, type Opening } from "@/lib/workshop";
import { Badge, Btn, Card, Field, Modal, fieldClass } from "./ui-bits";
import { CutListSheet } from "./print-sheet";

const KINDS: WindowKind[] = ["sliding", "casement", "fixed", "door"];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  quote: "approved",
  approved: "cutting",
  cutting: "assembled",
  assembled: "done",
};

const emptyRow = (): Opening => ({
  id: uid(),
  kind: "sliding",
  width: 140,
  height: 130,
  qty: 2,
  color: "أبيض",
  glass: "زجاج شفاف 6 مم",
});

export function ShopView() {
  const parties = useItar((s) => s.parties);
  const customers = parties.filter((p) => p.kind === "customer");
  const products = useItar((s) => s.products);
  const orders = useItar((s) => s.workOrders);
  const bars = useItar((s) => s.bars);
  const [open, setOpen] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [rows, setRows] = useState<Opening[]>([emptyRow()]);

  const preview = useMemo(() => priceJob(rows, products), [rows, products]);
  const printOrder = orders.find((o) => o.id === printId);

  function save() {
    if (!customerId || rows.length === 0) return;
    const first = rows[0];
    useItar.getState().addWorkOrder({
      customerId,
      date: todayIso(),
      kind: first.kind,
      width: first.width,
      height: first.height,
      color: first.color,
      glass: first.glass,
      qty: rows.reduce((s, r) => s + r.qty, 0),
      alumM: Number(preview.alumM.toFixed(2)),
      glassM2: Number(preview.glassM2.toFixed(2)),
      labor: preview.labor,
      total: preview.total,
      status: "quote",
      openings: rows,
    });
    setOpen(false);
    setRows([emptyRow()]);
    toast.success("تم حفظ عرض السعر");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle">الورشة</p>
          <h1 className="mt-1 text-3xl tracking-tight">قص ذكي وحجز مواد</h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            عدة فتحات في أمر واحد. عند اعتماد العقد تُحجز المواد، وعند القص تُوزَّع على قطاعات 6 م ويُعاد الفضلة للمستودع.
          </p>
        </div>
        <Btn onClick={() => setOpen(true)}>عرض سعر جديد</Btn>
      </div>

      <ul className="space-y-3 no-print">
        {orders.map((w) => (
          <OrderCard
            key={w.id}
            w={w}
            bars={bars}
            onPrint={() => {
              setPrintId(w.id);
              window.setTimeout(() => window.print(), 50);
            }}
          />
        ))}
      </ul>

      {printOrder ? <CutListSheet order={printOrder} party={parties.find((p) => p.id === printOrder.customerId)} /> : null}

      {open ? (
        <Modal title="عرض سعر — عدة فتحات" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="الزبون">
              <select className={fieldClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {rows.map((r, i) => (
              <div key={r.id} className="rounded-lg bg-surface p-3 ring-1 ring-border">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <select
                    className={fieldClass}
                    value={r.kind}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, kind: e.target.value as WindowKind };
                      setRows(next);
                    }}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                  <input
                    className={fieldClass}
                    value={r.width}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, width: Number(e.target.value) };
                      setRows(next);
                    }}
                    aria-label="عرض"
                  />
                  <input
                    className={fieldClass}
                    value={r.height}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, height: Number(e.target.value) };
                      setRows(next);
                    }}
                    aria-label="ارتفاع"
                  />
                  <input
                    className={fieldClass}
                    value={r.qty}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, qty: Number(e.target.value) };
                      setRows(next);
                    }}
                    aria-label="عدد"
                  />
                  <select
                    className={fieldClass}
                    value={r.color}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, color: e.target.value };
                      setRows(next);
                    }}
                  >
                    <option>أبيض</option>
                    <option>بني</option>
                    <option>رمادي</option>
                    <option>أسود</option>
                  </select>
                  <select
                    className={fieldClass}
                    value={r.glass}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, glass: e.target.value };
                      setRows(next);
                    }}
                  >
                    <option>زجاج شفاف 6 مم</option>
                    <option>زجاج دبل 22 مم</option>
                    <option>زجاج رفللكت برونز 8 مم</option>
                  </select>
                </div>
              </div>
            ))}
            <button type="button" className="text-sm text-accent" onClick={() => setRows([...rows, emptyRow()])}>
              + فتحة
            </button>
            <div className="rounded-lg bg-surface p-3 text-sm ring-1 ring-border">
              <p>
                ألمنيوم {qty(preview.alumM)} م · زجاج {qty(preview.glassM2)} م² · أجرة {money(preview.labor)}
              </p>
              <p className="mt-1 text-lg font-medium tabular">{money(preview.total)}</p>
            </div>
            <Btn className="w-full" onClick={save}>
              حفظ عرض السعر
            </Btn>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function OrderCard({ w, bars, onPrint }: { w: WorkOrder; bars: ReturnType<typeof useItar.getState>["bars"]; onPrint: () => void }) {
  const parties = useItar((s) => s.parties);
  const products = useItar((s) => s.products);
  const who = parties.find((p) => p.id === w.customerId);
  const next = NEXT[w.status];
  const plan = w.plan ?? planFor(w, bars);
  const pnl = projectPnl(w, products);
  const need = needOf(w);
  const short = need.filter((n) => {
    const p = products.find((x) => x.sku === n.sku);
    return p ? p.stock - (w.reserved ? 0 : p.reserved) < n.qty : false;
  });

  return (
    <li>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-subtle">{w.number}</p>
            <p className="mt-0.5 text-base font-medium">{who?.name}</p>
            <p className="mt-1 text-sm text-muted">
              {openingsOf(w)
                .map((o) => `${KIND_LABEL[o.kind]} ${o.qty}×${o.width}×${o.height}`)
                .join(" · ")}
            </p>
          </div>
          <Badge tone={w.status === "delivered" ? "ok" : w.status === "quote" ? "muted" : "accent"}>
            {STATUS_LABEL[w.status]}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Meta k="هدر القص" v={`${plan.wastePct}%`} />
          <Meta k="قطاعات 6م" v={`${plan.newBars}`} />
          <Meta k="فضلات ترجع" v={`${plan.remnantsOut.length}`} />
          <Meta k="ربح المشروع" v={money(pnl.profit)} />
        </div>

        {short.length > 0 && w.status === "quote" ? (
          <p className="mt-3 text-sm text-danger">نقص: {short.map((s) => s.sku).join("، ")}</p>
        ) : null}

        <div className="mt-3 overflow-x-auto rounded-md bg-surface p-3 text-xs">
          {plan.bars.slice(0, 6).map((b, i) => (
            <p key={i} className="tabular text-muted">
              {b.source === "new" ? "قطاع 600" : `فضلة ${b.startCm}`} سم ← {b.cuts.map((c) => c.lengthCm).join(" + ")}
              {b.leftoverCm >= 40 ? ` · ترجع ${b.leftoverCm} سم` : b.leftoverCm > 0 ? ` · هدر ${b.leftoverCm} سم` : ""}
            </p>
          ))}
          {plan.bars.length > 6 ? <p className="text-subtle">+ {plan.bars.length - 6} قطاع</p> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {next ? (
            <Btn
              variant="ghost"
              onClick={() => {
                useItar.getState().setOrderStatus(w.id, next);
                if (next === "approved") toast.success("حُجزت المواد من المستودع");
                if (next === "cutting") toast.success("تم القص وإرجاع الفضلات");
              }}
            >
              {next === "approved" ? "اعتماد وحجز" : next === "cutting" ? "قص ذكي" : `ترحيل: ${STATUS_LABEL[next]}`}
            </Btn>
          ) : null}
          {!w.invoiceId ? (
            <Btn
              variant="ghost"
              onClick={() => {
                useItar.getState().invoiceFromOrder(w.id);
                toast.success("صدرت فاتورة من الأمر");
              }}
            >
              فاتورة
            </Btn>
          ) : null}
          <Btn variant="ghost" onClick={onPrint}>
            طباعة قائمة قص
          </Btn>
        </div>
      </Card>
    </li>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-surface px-3 py-2">
      <p className="text-xs text-subtle">{k}</p>
      <p className="tabular">{v}</p>
    </div>
  );
}
