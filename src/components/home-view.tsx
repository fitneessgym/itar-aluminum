import { alertsOf, booksOf, projectPnl, STATUS_LABEL, UNIT_LABEL, available, useItar } from "@/lib/itar-store";
import { money, qty } from "@/lib/format";
import { Badge, Card, Kpi } from "./ui-bits";

export function HomeView() {
  const products = useItar((s) => s.products);
  const docs = useItar((s) => s.docs);
  const payments = useItar((s) => s.payments);
  const expenses = useItar((s) => s.expenses);
  const work = useItar((s) => s.workOrders);
  const parties = useItar((s) => s.parties);
  const tasks = useItar((s) => s.tasks);
  const books = booksOf({ products, docs, payments, expenses });
  const alerts = alertsOf(products);
  const openOrders = work.filter((w) => w.status !== "delivered");
  const qaWait = work.filter((w) => w.qaStatus === "pending" || w.qaStatus === "rework");
  const setView = useItar((s) => s.setView);
  const reservedValue = products.reduce((s, p) => s + p.reserved * p.cost, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium tracking-widest text-subtle">لوحة الإدارة</p>
        <h1 className="mt-1 text-3xl tracking-tight md:text-4xl">نظرة على إطار</h1>
        <p className="mt-2 max-w-xl text-sm leading-normal text-muted">
          حجز المواد عند توقيع العقد، تنبيه النواقص، وربح كل مشروع ألمنيوم وزجاج.
        </p>
      </header>

      {alerts.length > 0 ? (
        <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          تنبيه حد أدنى: {alerts.map((a) => a.text.split("—")[0].trim()).join(" · ")}
        </div>
      ) : null}

      {qaWait.length > 0 ? (
        <button
          type="button"
          className="w-full rounded-xl bg-warn/10 px-4 py-3 text-start text-sm text-warn"
          onClick={() => setView("quality")}
        >
          جودة: {qaWait.length} أعمال بانتظار فحص أو إعادة عمل
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="قيمة المستودع" value={money(books.inventory)} hint={`محجوز ${money(reservedValue)}`} />
        <Kpi label="مبيعات" value={money(books.sales)} />
        <Kpi label="ذمم الزبائن" value={money(books.ar)} tone={books.ar > 0 ? "warn" : "ok"} />
        <Kpi label="الصندوق" value={money(books.cash)} tone={books.cash < 0 ? "danger" : "ok"} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium">نواقص وإكسسوار</h2>
            <button type="button" className="text-xs text-accent" onClick={() => setView("stock")}>
              المستودع
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted">كل الأصناف فوق الحد الأدنى.</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map((a) => {
                const p = products.find((x) => x.id === a.id);
                if (!p) return null;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{p.name}</p>
                      <p className="text-xs text-subtle">محجوز {qty(p.reserved)}</p>
                    </div>
                    <Badge tone="danger">
                      {qty(available(p))} {UNIT_LABEL[p.unit]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium">المشاريع المفتوحة</h2>
            <button type="button" className="text-xs text-accent" onClick={() => setView("shop")}>
              الورشة
            </button>
          </div>
          {openOrders.length === 0 ? (
            <p className="text-sm text-muted">لا أوامر مفتوحة.</p>
          ) : (
            <ul className="divide-y divide-border">
              {openOrders.slice(0, 5).map((w) => {
                const who = parties.find((p) => p.id === w.customerId);
                const pnl = projectPnl(w, products);
                const openTasks = tasks.filter((t) => t.orderId === w.id && t.status !== "done").length;
                return (
                  <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {w.number} — {who?.name}
                      </p>
                      <p className="text-xs text-subtle">
                        ربح {money(pnl.profit)} · {openTasks} مهام
                      </p>
                    </div>
                    <Badge tone={w.status === "quote" ? "muted" : "accent"}>{STATUS_LABEL[w.status]}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium">آخر الفواتير</h2>
          <button type="button" className="text-xs text-accent" onClick={() => setView("sales")}>
            المبيعات
          </button>
        </div>
        <ul className="divide-y divide-border">
          {docs.slice(0, 5).map((d) => {
            const who = parties.find((p) => p.id === d.partyId);
            const total = d.lines.reduce((s, l) => s + l.qty * l.price, 0);
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm">
                    {d.number} · {who?.name}
                  </p>
                  <p className="text-xs text-subtle">{d.kind === "sale" ? "مبيعات" : "مشتريات"}</p>
                </div>
                <p className="tabular text-sm">{money(total)}</p>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
