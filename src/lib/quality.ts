export type QaStage = "cut" | "assemble" | "install" | "final";
export type QaResult = "pass" | "fail" | "rework";
export type QaStatus = "none" | "pending" | "pass" | "rework" | "fail";

export type QaItem = {
  label: string;
  ok: boolean | null;
};

export type Inspection = {
  id: string;
  orderId: string;
  stage: QaStage;
  date: string;
  inspectorId: string;
  items: QaItem[];
  notes: string;
  result: QaResult;
};

export type Review = {
  id: string;
  orderId: string;
  date: string;
  reviewerId: string;
  verdict: "approve" | "return";
  comment: string;
};

export const STAGE_LABEL: Record<QaStage, string> = {
  cut: "فحص القص",
  assemble: "فحص التجميع",
  install: "فحص التركيب",
  final: "فحص نهائي",
};

export const QA_STATUS_LABEL: Record<QaStatus, string> = {
  none: "بدون فحص",
  pending: "بانتظار الجودة",
  pass: "مقبول",
  rework: "إعادة عمل",
  fail: "مرفوض",
};

export const CHECKLIST: Record<QaStage, string[]> = {
  cut: ["مطابقة طول القطع للمقاس", "زوايا القص نظيفة بلا نتوء", "استخدام الفضلة قبل القطاع الجديد", "باركود القطاع مقروء"],
  assemble: ["زوايا الإطار مربوطة", "الزجاج محكم بلا خلخلة", "الإكسسوار كامل ويعمل", "السيليكون منتظم دون فجوات"],
  install: ["ميزان الشباك/الباب", "التثبيت والبراغي مكتملة", "عزل الإطار من المطر", "الموقع نظيف بعد التركيب"],
  final: ["مطابقة عرض السعر", "صورة إغلاق العمل", "لا خدوش على البروفيل", "موافقة الزبون على الاستلام"],
};

export function blankItems(stage: QaStage): QaItem[] {
  return CHECKLIST[stage].map((label) => ({ label, ok: null }));
}

export function scoreOf(items: QaItem[]) {
  const answered = items.filter((i) => i.ok !== null);
  if (answered.length === 0) return 0;
  const ok = answered.filter((i) => i.ok).length;
  return Math.round((ok / items.length) * 100);
}

export function resultOf(items: QaItem[]): QaResult {
  if (items.some((i) => i.ok === false)) return "rework";
  if (items.every((i) => i.ok === true)) return "pass";
  return "fail";
}
