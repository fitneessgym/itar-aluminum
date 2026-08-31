import { useState } from "react";
import { dueOf, lineSum, UNIT_LABEL, useItar, type LineInput } from "@/lib/itar-store";
import { money, qty, todayIso } from "@/lib/format";
import { Badge, Btn, Card, Field, Modal, fieldClass } from "./ui-bits";
import { InvoiceSheet } from "./print-sheet";

export function SalesView() {
  const parties = useItar((s) => s.parties);
  const products = useItar((s) => s.products);
  const docs = useItar((s) => s.docs);
  const [tab, setTab] = useState<"sale" | "purchase">("sale");
  const [printId, setPrintId] = useState<string | null>(null);
  const [open, setOpen] = useState<"doc" | "pay" | "party" | null>(null);
  const [partyId, setPartyId] = useState(
    parties.find((p) => p.kind === "customer")?.id ?? "",
  );
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineInput[]>([{ productId: products[0]?.id ?? "", qty: 1 }]);
  const [pay, setPay] = useState({ docId: "", amount: "", method: "cash" as const });
  const [newParty, setNewParty] = useState({
    name: "",
    phone: "",
    city: "الخليل",
    kind: "customer" as "customer" | "supplier",
  });

  const rows = docs.filter((d) => d.kind === tab);
  const people = parties.filter((p) => p.kind === (tab === "sale" ? "customer" : "supplier"));
  const printDoc = docs.find((d) => d.id === printId);

  function addLine() {
    setLines([...lines, { productId: products[0]?.id ?? "", qty: 1 }]);
  }

  function saveDoc() {
    const id = useItar.getState().postDoc({
      kind: tab,
      partyId,
      date: todayIso(),
      note,
      lines: lines.filter((l) => l.qty > 0),
    });
    if (id) {
      setOpen(null);
      setNote("");
    }
  }

  function savePay() {
    const amount = Number(pay.amount);
    if (!pay.docId || !Number.isFinite(amount) || amount <= 0) return;
    const doc = docs.find((d) => d.id === pay.docId);
    if (!doc) return;
    useItar.getState().addPayment({
      partyId: doc.partyId,
      docId: doc.id,
      amount,
      method: pay.method,
      date: todayIso(),
      note: "",
    });
    setOpen(null);
  }

  function saveParty() {
    if (!newParty.name.trim()) return;
    useItar.getState().addParty({ ...newParty, name: newParty.name.trim() });
    setOpen(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle">الفواتير</p>
          <h1 className="mt-1 text-3xl tracking-tight">مبيعات ومشتريات</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="ghost" onClick={() => setOpen("party")}>
            جهة جديدة
          </Btn>
          <Btn variant="ghost" onClick={() => setOpen("pay")}>
            سند قبض / صرف
          </Btn>
          <Btn
            onClick={() => {
              setPartyId(people[0]?.id ?? "");
              setOpen("doc");
            }}
          >
            {tab === "sale" ? "فاتورة بيع" : "فاتورة شراء"}
          </Btn>
        </div>
      </div>

      <div className="flex gap-1 no-print">
        {(["sale", "purchase"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setPartyId(
                parties.find((p) => p.kind === (t === "sale" ? "customer" : "supplier"))?.id ?? "",
              );
            }}
            className={`h-11 rounded-full px-4 text-sm ${
              tab === t ? "bg-accent text-accent-fg" : "bg-surface text-muted ring-1 ring-border"
            }`}
          >
            {t === "sale" ? "مبيعات" : "مشتريات"}
          </button>
        ))}
      </div>

      <ul className="space-y-3 no-print">
        {rows.map((d) => {
          const who = parties.find((p) => p.id === d.partyId);
          const total = lineSum(d.lines);
          const due = dueOf(d);
          return (
            <li key={d.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-subtle">{d.number}</p>
                    <p className="text-base font-medium">{who?.name}</p>
                    <p className="mt-1 text-sm text-muted">{d.note || "—"}</p>
                  </div>
                  <Badge tone={due === 0 ? "ok" : due < total ? "warn" : "danger"}>
                    {due === 0 ? "مسددة" : due < total ? "جزئي" : "ذمة"}
                  </Badge>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {d.lines.map((l, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>
                        {l.name} · {qty(l.qty)} {UNIT_LABEL[l.unit]}
                      </span>
                      <span className="tabular">{money(l.qty * l.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                  <span>
                    المطلوب {money(total)} · واصل {money(d.paid)}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular font-medium">المتبقي {money(due)}</span>
                    <button
                      type="button"
                      className="text-accent"
                      onClick={() => {
                        setPrintId(d.id);
                        window.setTimeout(() => window.print(), 50);
                      }}
                    >
                      طباعة
                    </button>
                  </span>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {open === "doc" ? (
        <Modal title={tab === "sale" ? "فاتورة بيع" : "فاتورة شراء"} onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <Field label={tab === "sale" ? "الزبون" : "المورّد"}>
              <select className={fieldClass} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <select
                  className={`${fieldClass} col-span-2`}
                  value={l.productId}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...l, productId: e.target.value };
                    setLines(next);
                  }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClass}
                  value={l.qty}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...l, qty: Number(e.target.value) };
                    setLines(next);
                  }}
                />
              </div>
            ))}
            <button type="button" className="text-sm text-accent" onClick={addLine}>
              + سطر
            </button>
            <Field label="ملاحظة">
              <input className={fieldClass} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Btn className="w-full" onClick={saveDoc}>
              ترحيل الفاتورة وصرف/إدخال المستودع
            </Btn>
          </div>
        </Modal>
      ) : null}

      {open === "pay" ? (
        <Modal title="سند" onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <Field label="الفاتورة">
              <select
                className={fieldClass}
                value={pay.docId}
                onChange={(e) => setPay({ ...pay, docId: e.target.value })}
              >
                <option value="">اختر</option>
                {docs
                  .filter((d) => dueOf(d) > 0)
                  .map((d) => {
                    const who = parties.find((p) => p.id === d.partyId);
                    return (
                      <option key={d.id} value={d.id}>
                        {d.number} — {who?.name} — متبقي {money(dueOf(d))}
                      </option>
                    );
                  })}
              </select>
            </Field>
            <Field label="المبلغ">
              <input className={fieldClass} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
            </Field>
            <Btn className="w-full" onClick={savePay}>
              تسجيل الدفعة
            </Btn>
          </div>
        </Modal>
      ) : null}

      {open === "party" ? (
        <Modal title="زبون أو مورّد" onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <Field label="النوع">
              <select
                className={fieldClass}
                value={newParty.kind}
                onChange={(e) =>
                  setNewParty({ ...newParty, kind: e.target.value as "customer" | "supplier" })
                }
              >
                <option value="customer">زبون</option>
                <option value="supplier">مورّد</option>
              </select>
            </Field>
            <Field label="الاسم">
              <input className={fieldClass} value={newParty.name} onChange={(e) => setNewParty({ ...newParty, name: e.target.value })} />
            </Field>
            <Field label="الهاتف">
              <input className={fieldClass} value={newParty.phone} onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })} />
            </Field>
            <Field label="المدينة">
              <input className={fieldClass} value={newParty.city} onChange={(e) => setNewParty({ ...newParty, city: e.target.value })} />
            </Field>
            <Btn className="w-full" onClick={saveParty}>
              حفظ
            </Btn>
          </div>
        </Modal>
      ) : null}

      {printDoc ? <InvoiceSheet doc={printDoc} party={parties.find((p) => p.id === printDoc.partyId)} /> : null}
    </div>
  );
}
