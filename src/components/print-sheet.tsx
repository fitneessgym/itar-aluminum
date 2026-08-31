import { dueOf, lineSum, UNIT_LABEL, type Doc, type Party, type WorkOrder, openingsOf } from "@/lib/itar-store";
import { KIND_LABEL } from "@/lib/itar-store";
import { cutPieces } from "@/lib/workshop";
import { dayLabel, money, qty } from "@/lib/format";

export function InvoiceSheet({ doc, party }: { doc: Doc; party?: Party }) {
  const total = lineSum(doc.lines);
  const due = dueOf(doc);
  return (
    <article className="print-sheet mx-auto max-w-2xl bg-elevated p-8 text-fg">
      <header className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <p className="font-display text-2xl">إطار</p>
          <p className="mt-1 text-sm text-muted">شركة إطار للألمنيوم والزجاج — الخليل</p>
        </div>
        <div className="text-end">
          <p className="text-xs text-subtle">{doc.kind === "sale" ? "فاتورة مبيعات" : "فاتورة مشتريات"}</p>
          <p className="text-lg font-medium">{doc.number}</p>
          <p className="text-sm text-muted">{dayLabel(doc.date)}</p>
        </div>
      </header>
      <p className="mt-4 text-sm">
        إلى: <span className="font-medium">{party?.name}</span>
        {party ? ` · ${party.city} · ${party.phone}` : ""}
      </p>
      {doc.note ? <p className="mt-1 text-sm text-muted">{doc.note}</p> : null}
      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="py-2 text-start font-medium">البند</th>
            <th className="py-2 text-end font-medium">كمية</th>
            <th className="py-2 text-end font-medium">سعر</th>
            <th className="py-2 text-end font-medium">المجموع</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={i} className="border-b border-border/70">
              <td className="py-2">{l.name}</td>
              <td className="py-2 text-end tabular">
                {qty(l.qty)} {UNIT_LABEL[l.unit]}
              </td>
              <td className="py-2 text-end tabular">{money(l.price)}</td>
              <td className="py-2 text-end tabular">{money(l.qty * l.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 space-y-1 text-end text-sm">
        <p>الإجمالي {money(total)}</p>
        <p>واصل {money(doc.paid)}</p>
        <p className="text-base font-medium">المتبقي {money(due)}</p>
      </div>
    </article>
  );
}

export function CutListSheet({ order, party }: { order: WorkOrder; party?: Party }) {
  const openings = openingsOf(order);
  return (
    <article className="print-sheet mx-auto max-w-2xl bg-elevated p-8 text-fg">
      <header className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <p className="font-display text-2xl">قائمة قص</p>
          <p className="mt-1 text-sm text-muted">
            {order.number} — {party?.name}
          </p>
        </div>
        <p className="text-sm text-muted">{dayLabel(order.date)}</p>
      </header>
      {openings.map((o) => (
        <section key={o.id} className="mt-5">
          <p className="text-sm font-medium">
            {KIND_LABEL[o.kind]} · {o.qty} × {o.width}×{o.height} سم · {o.color} · {o.glass}
          </p>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-1.5 text-start font-medium">القطعة</th>
                <th className="py-1.5 text-end font-medium">الطول</th>
                <th className="py-1.5 text-end font-medium">العدد</th>
              </tr>
            </thead>
            <tbody>
              {cutPieces(o).map((p, i) => (
                <tr key={i} className="border-b border-border/70">
                  <td className="py-1.5">{p.label}</td>
                  <td className="py-1.5 text-end tabular">{p.kind === "glass" ? "—" : `${p.lengthCm} سم`}</td>
                  <td className="py-1.5 text-end tabular">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <p className="mt-6 text-sm">
        ألمنيوم {qty(order.alumM)} م · زجاج {qty(order.glassM2)} م² · الإجمالي {money(order.total)}
      </p>
    </article>
  );
}
