import { useMemo, useState } from "react";
import { toast } from "sonner";
import { projectPnl, useItar } from "@/lib/itar-store";
import {
  QA_STATUS_LABEL,
  STAGE_LABEL,
  blankItems,
  scoreOf,
  type QaItem,
  type QaStage,
} from "@/lib/quality";
import { money } from "@/lib/format";
import { Badge, Btn, Card, Field, Modal, fieldClass } from "./ui-bits";

const STAGES: QaStage[] = ["cut", "assemble", "install", "final"];

export function QualityView() {
  const orders = useItar((s) => s.workOrders);
  const parties = useItar((s) => s.parties);
  const employees = useItar((s) => s.employees);
  const inspections = useItar((s) => s.inspections);
  const reviews = useItar((s) => s.reviews);
  const products = useItar((s) => s.products);
  const inspectors = employees.filter((e) => e.team === "qa" || e.team === "assemble");
  const [inspect, setInspect] = useState<{ orderId: string; stage: QaStage } | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [items, setItems] = useState<QaItem[]>([]);
  const [notes, setNotes] = useState("");
  const [inspectorId, setInspectorId] = useState(inspectors[0]?.id ?? "");
  const [comment, setComment] = useState("");

  const pending = orders.filter(
    (w) => w.status === "assembled" || w.status === "done" || w.qaStatus === "rework" || w.qaStatus === "pending",
  );

  const order = inspect ? orders.find((w) => w.id === inspect.orderId) : null;
  const reviewOrder = reviewId ? orders.find((w) => w.id === reviewId) : null;
  const reviewPnl = reviewOrder ? projectPnl(reviewOrder, products) : null;

  const stats = useMemo(() => {
    const pass = inspections.filter((i) => i.result === "pass").length;
    const rework = inspections.filter((i) => i.result === "rework" || i.result === "fail").length;
    const waiting = orders.filter((w) => w.qaStatus === "pending" || w.qaStatus === "rework").length;
    return { pass, rework, waiting, rate: inspections.length ? Math.round((pass / inspections.length) * 100) : 0 };
  }, [inspections, orders]);

  function openInspect(orderId: string, stage: QaStage) {
    setInspect({ orderId, stage });
    setItems(blankItems(stage));
    setNotes("");
  }

  function submitInspect() {
    if (!inspect || items.some((i) => i.ok === null)) {
      toast.error("علّم كل بند: مطابق أو غير مطابق");
      return;
    }
    useItar.getState().saveInspection({
      orderId: inspect.orderId,
      stage: inspect.stage,
      inspectorId,
      items,
      notes,
    });
    setInspect(null);
    toast.success("سُجّل الفحص");
  }

  function submitReview(verdict: "approve" | "return") {
    if (!reviewId) return;
    const o = orders.find((w) => w.id === reviewId);
    if (verdict === "approve" && o?.qaStatus !== "pass") {
      toast.error("الفحص النهائي لازم يكون مقبول قبل التسليم");
      return;
    }
    useItar.getState().saveReview({
      orderId: reviewId,
      reviewerId: inspectorId,
      verdict,
      comment,
    });
    setReviewId(null);
    setComment("");
    toast.success(verdict === "approve" ? "اعتُمد التسليم" : "أُعيد للعمل");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium tracking-widest text-subtle">الجودة</p>
        <h1 className="mt-1 text-3xl tracking-tight">فحص ومراجعة الأعمال</h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          كل مرحلة لها قائمة فحص. التسليم لا يتم إلا بعد فحص نهائي مقبول ومراجعة المشرف.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat k="بانتظار فحص" v={`${stats.waiting}`} />
        <Stat k="فحوصات ناجحة" v={`${stats.pass}`} />
        <Stat k="إعادة عمل" v={`${stats.rework}`} />
        <Stat k="نسبة القبول" v={`${stats.rate}%`} />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-medium">أعمال تحتاج فحص</h2>
        {pending.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">لا أعمال معلّقة على الجودة.</p>
          </Card>
        ) : (
          pending.map((w) => {
            const who = parties.find((p) => p.id === w.customerId);
            const last = inspections.find((i) => i.orderId === w.id);
            return (
              <Card key={w.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-subtle">{w.number}</p>
                    <p className="font-medium">{who?.name}</p>
                    <p className="mt-1 text-sm text-muted">{last ? `${STAGE_LABEL[last.stage]} — ${last.notes}` : "لم يُفحص بعد"}</p>
                  </div>
                  <Badge
                    tone={
                      w.qaStatus === "pass" ? "ok" : w.qaStatus === "rework" || w.qaStatus === "fail" ? "danger" : "warn"
                    }
                  >
                    {QA_STATUS_LABEL[w.qaStatus ?? "pending"]}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STAGES.map((s) => (
                    <Btn key={s} variant="ghost" onClick={() => openInspect(w.id, s)}>
                      {STAGE_LABEL[s]}
                    </Btn>
                  ))}
                  <Btn onClick={() => setReviewId(w.id)}>مراجعة المشرف</Btn>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <Card>
        <h2 className="mb-3 text-base font-medium">سجل الفحوصات</h2>
        <ul className="divide-y divide-border">
          {inspections.slice(0, 8).map((i) => {
            const w = orders.find((o) => o.id === i.orderId);
            const who = parties.find((p) => p.id === w?.customerId);
            const inspector = employees.find((e) => e.id === i.inspectorId);
            return (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p>
                    {w?.number} · {who?.name}
                  </p>
                  <p className="text-xs text-subtle">
                    {STAGE_LABEL[i.stage]} · {inspector?.name} · {scoreOf(i.items)}%
                  </p>
                </div>
                <Badge tone={i.result === "pass" ? "ok" : "danger"}>
                  {i.result === "pass" ? "مطابق" : "إعادة"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      {inspect && order ? (
        <Modal title={`${STAGE_LABEL[inspect.stage]} — ${order.number}`} onClose={() => setInspect(null)}>
          <div className="space-y-3">
            <Field label="المفتش">
              <select className={fieldClass} value={inspectorId} onChange={(e) => setInspectorId(e.target.value)}>
                {inspectors.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </Field>
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li key={item.label} className="flex items-center justify-between gap-2 rounded-md bg-surface px-3 py-2">
                  <span className="text-sm">{item.label}</span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className={`h-11 rounded-md px-3 text-sm ${item.ok === true ? "bg-ok text-accent-fg" : "ring-1 ring-border"}`}
                      onClick={() => {
                        const next = [...items];
                        next[idx] = { ...item, ok: true };
                        setItems(next);
                      }}
                    >
                      مطابق
                    </button>
                    <button
                      type="button"
                      className={`h-11 rounded-md px-3 text-sm ${item.ok === false ? "bg-danger text-accent-fg" : "ring-1 ring-border"}`}
                      onClick={() => {
                        const next = [...items];
                        next[idx] = { ...item, ok: false };
                        setItems(next);
                      }}
                    >
                      خلل
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <Field label="ملاحظة">
              <input className={fieldClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Btn className="w-full" onClick={submitInspect}>
              حفظ الفحص
            </Btn>
          </div>
        </Modal>
      ) : null}

      {reviewOrder && reviewPnl ? (
        <Modal title={`مراجعة ${reviewOrder.number}`} onClose={() => setReviewId(null)}>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              مواد {money(reviewPnl.materials)} · أجور {money(reviewPnl.wages)} · ربح {money(reviewPnl.profit)}
            </p>
            <p className="text-sm">
              حالة الجودة: {QA_STATUS_LABEL[reviewOrder.qaStatus ?? "none"]}
            </p>
            <Field label="تعليق المشرف">
              <input className={fieldClass} value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Btn className="flex-1" variant="danger" onClick={() => submitReview("return")}>
                إعادة للعمل
              </Btn>
              <Btn className="flex-1" onClick={() => submitReview("approve")}>
                اعتماد التسليم
              </Btn>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <Card>
      <p className="text-xs text-muted">{k}</p>
      <p className="mt-2 text-2xl font-medium tabular">{v}</p>
    </Card>
  );
}
