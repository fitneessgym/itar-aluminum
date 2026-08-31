import { useState } from "react";
import { booksOf, partyBalance, projectPnl, useItar } from "@/lib/itar-store";
import { money, todayIso } from "@/lib/format";
import { Btn, Card, Field, Kpi, Modal, fieldClass } from "./ui-bits";

export function BooksView() {
  const products = useItar((s) => s.products);
  const docs = useItar((s) => s.docs);
  const payments = useItar((s) => s.payments);
  const expenses = useItar((s) => s.expenses);
  const parties = useItar((s) => s.parties);
  const orders = useItar((s) => s.workOrders);
  const books = booksOf({ products, docs, payments, expenses });
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState({ category: "أجور الورشة", amount: "", note: "" });

  function saveExp() {
    const amount = Number(exp.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    useItar.getState().addExpense({
      category: exp.category,
      amount,
      note: exp.note,
      date: todayIso(),
    });
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle">الحسابات</p>
          <h1 className="mt-1 text-3xl tracking-tight">الصندوق والذمم</h1>
        </div>
        <Btn onClick={() => setOpen(true)}>مصروف</Btn>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="الصندوق" value={money(books.cash)} />
        <Kpi label="ذمم زبائن" value={money(books.ar)} tone="warn" />
        <Kpi label="ذمم مورّدين" value={money(books.ap)} />
        <Kpi
          label="الربح التقديري"
          value={money(books.profit)}
          tone={books.profit >= 0 ? "ok" : "danger"}
          hint="مبيعات − تكلفة − مصروف"
        />
      </div>

      <Card>
        <h2 className="mb-3 text-base font-medium">ربح كل مشروع</h2>
        <ul className="divide-y divide-border text-sm">
          {orders.map((w) => {
            const who = parties.find((p) => p.id === w.customerId);
            const pnl = projectPnl(w, products);
            return (
              <li key={w.id} className="grid grid-cols-2 gap-2 py-2.5 sm:grid-cols-4">
                <span>
                  {w.number} · {who?.name}
                </span>
                <span className="text-muted">مواد {money(pnl.materials)}</span>
                <span className="text-muted">أجور {money(pnl.wages)}</span>
                <span className={`tabular ${pnl.profit >= 0 ? "text-ok" : "text-danger"}`}>
                  {money(pnl.profit)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-medium">حسابات الزبائن</h2>
          <ul className="divide-y divide-border">
            {parties
              .filter((p) => p.kind === "customer")
              .map((p) => {
                const bal = partyBalance(p.id, docs, payments);
                return (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p>{p.name}</p>
                      <p className="text-xs text-subtle">
                        {p.city} · {p.phone}
                      </p>
                    </div>
                    <span className={`tabular ${bal > 0 ? "text-warn" : "text-ok"}`}>
                      {money(bal)}
                    </span>
                  </li>
                );
              })}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-base font-medium">حسابات المورّدين</h2>
          <ul className="divide-y divide-border">
            {parties
              .filter((p) => p.kind === "supplier")
              .map((p) => {
                const bal = partyBalance(p.id, docs, payments);
                return (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p>{p.name}</p>
                      <p className="text-xs text-subtle">
                        {p.city} · {p.phone}
                      </p>
                    </div>
                    <span className={`tabular ${bal > 0 ? "text-danger" : "text-ok"}`}>
                      {money(bal)}
                    </span>
                  </li>
                );
              })}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-medium">المصروفات</h2>
        <ul className="divide-y divide-border">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p>{e.category}</p>
                <p className="text-xs text-subtle">{e.note}</p>
              </div>
              <span className="tabular">{money(e.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {open ? (
        <Modal title="مصروف" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="البند">
              <select
                className={fieldClass}
                value={exp.category}
                onChange={(e) => setExp({ ...exp, category: e.target.value })}
              >
                <option>أجور الورشة</option>
                <option>كهرباء</option>
                <option>نقل</option>
                <option>إيجار</option>
                <option>أخرى</option>
              </select>
            </Field>
            <Field label="المبلغ">
              <input className={fieldClass} value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
            </Field>
            <Field label="ملاحظة">
              <input className={fieldClass} value={exp.note} onChange={(e) => setExp({ ...exp, note: e.target.value })} />
            </Field>
            <Btn className="w-full" onClick={saveExp}>
              تسجيل
            </Btn>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
