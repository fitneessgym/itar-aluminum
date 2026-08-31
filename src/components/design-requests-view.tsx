import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Eye, FileImage, PackageCheck, XCircle } from "lucide-react";
import { useItar, type DesignRequestStatus } from "@/lib/itar-store";
import { money, qty } from "@/lib/format";
import { Badge, Card, Kpi } from "./ui-bits";

const labels: Record<DesignRequestStatus, string> = {
  new: "جديد", reviewing: "قيد المراجعة", quoted: "عرض سعر", approved: "موافق عليه", converted: "تم تحويله", rejected: "مرفوض",
};

export function DesignRequestsView() {
  const requests = useItar((s) => s.designRequests);
  const update = useItar((s) => s.updateDesignRequestStatus);
  const [selected, setSelected] = useState<string | null>(null);
  const current = requests.find((r) => r.id === selected) ?? null;
  const fresh = useMemo(() => requests.filter((r) => r.status === "new").length, [requests]);
  const total = useMemo(() => requests.reduce((n, r) => n + r.estimatedTotal, 0), [requests]);

  return <div className="space-y-6">
    <header><p className="text-xs font-medium tracking-widest text-subtle">طلبات العملاء</p><h1 className="mt-1 text-3xl tracking-tight md:text-4xl">تصاميم الواجهات</h1><p className="mt-2 max-w-2xl text-sm text-muted">كل تصميم أرسله العميل من الصفحة الرئيسية يظهر هنا مع الصورة والمقاسات وقائمة المواد التقديرية.</p></header>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Kpi label="إجمالي التصاميم" value={String(requests.length)} /><Kpi label="تصاميم جديدة" value={String(fresh)} tone={fresh ? "warn" : "ok"} /><Kpi label="القيمة التقديرية" value={money(total)} /></div>
    <div className="grid gap-3 lg:grid-cols-2">
      {requests.length === 0 ? <Card><p className="text-sm text-muted">لا توجد طلبات تصميم حتى الآن.</p></Card> : requests.map((r) => <Card key={r.id}>
        <div className="flex gap-3">
          <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-elevated">{r.image ? <img src={r.image} className="h-full w-full object-cover" alt="" /> : <FileImage className="m-6 text-subtle" size={32} />}</div>
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-medium">{r.number} · {r.customerName}</p><Badge tone={r.status === "new" ? "danger" : r.status === "approved" ? "ok" : "muted"}>{labels[r.status]}</Badge></div><p className="mt-1 text-xs text-subtle">{r.width} × {r.height} مم · {r.color} · {r.glass}</p><p className="mt-2 text-sm">تقدير: {money(r.estimatedTotal)}</p><button type="button" className="mt-3 inline-flex items-center gap-1 text-xs text-accent" onClick={() => setSelected(r.id)}><Eye size={14} /> فتح التصميم</button></div>
        </div>
      </Card>)}
    </div>
    {current ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setSelected(null)}><div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-5 flex items-center justify-between"><div><p className="text-xs text-subtle">{current.number}</p><h2 className="text-2xl">{current.customerName}</h2></div><button onClick={() => setSelected(null)} className="rounded-md p-2 text-muted hover:bg-elevated">×</button></div>
      <div className="grid gap-5 lg:grid-cols-2"><div>{current.image ? <img src={current.image} className="max-h-[55vh] w-full rounded-xl object-contain bg-elevated" alt="تصميم العميل" /> : <div className="grid h-64 place-items-center rounded-xl bg-elevated text-muted">لا توجد صورة</div>}</div><div className="space-y-4"><div className="grid grid-cols-2 gap-2"><Info label="العرض" value={`${current.width} مم`} /><Info label="الارتفاع" value={`${current.height} مم`} /><Info label="النوع" value={current.type} /><Info label="الإطار" value={current.color} /><Info label="الزجاج" value={current.glass} /><Info label="التقدير" value={money(current.estimatedTotal)} /></div><div><h3 className="mb-2 font-medium">BOM تقديري</h3><ul className="divide-y divide-border rounded-lg border border-border">{current.bom.map((b) => <li key={b.sku} className="flex justify-between gap-3 p-2.5 text-sm"><span>{b.name}</span><span>{qty(b.qty)} {b.unit}</span></li>)}</ul></div>{current.notes && <div><h3 className="mb-1 font-medium">ملاحظات</h3><p className="rounded-lg bg-elevated p-3 text-sm text-muted">{current.notes}</p></div>}<div className="flex flex-wrap gap-2 pt-2"><button onClick={() => update(current.id, "reviewing")} className="btn btn-primary inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm"><Clock3 size={15}/> قيد المراجعة</button><button onClick={() => update(current.id, "quoted")} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><PackageCheck size={15}/> عرض سعر</button><button onClick={() => update(current.id, "converted")} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><CheckCircle2 size={15}/> تحويل لمشروع</button><button onClick={() => update(current.id, "rejected")} className="inline-flex items-center gap-2 rounded-md border border-danger/30 px-3 py-2 text-sm text-danger"><XCircle size={15}/> رفض</button></div></div></div>
    </div></div> : null}
  </div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-elevated p-3"><p className="text-xs text-subtle">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
