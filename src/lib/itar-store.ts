import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./utils";
import { todayIso } from "./format";
import {
  blankItems,
  resultOf,
  type Inspection,
  type QaStage,
  type QaStatus,
  type Review,
} from "./quality";
import {
  alumDemand,
  alumSku,
  glassSku,
  jobTotals,
  materialCost,
  packCuts,
  priceJob,
  type Opening,
  type PackPlan,
} from "./workshop";

export type { Opening, PackPlan };
export type { Inspection, QaStage, QaStatus, Review };

export type Unit = "m" | "m2" | "pcs" | "kg";
export type Category = "aluminum" | "glass" | "accessories" | "consumable";
export type View = "home" | "stock" | "shop" | "sales" | "books" | "crew" | "employees" | "quality" | "designs" | "files";
export type Mode = "desk" | "field";
export type WindowKind = "sliding" | "casement" | "fixed" | "door";
export type OrderStatus = "quote" | "approved" | "cutting" | "assembled" | "done" | "delivered";
export type DocKind = "sale" | "purchase";
export type PayMethod = "cash" | "bank" | "check";
export type Team = "cut" | "assemble" | "install" | "qa";

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: Category;
  unit: Unit;
  stock: number;
  reserved: number;
  min: number;
  cost: number;
  price: number;
};

export type Party = {
  id: string;
  kind: "customer" | "supplier";
  name: string;
  phone: string;
  city: string;
};

export type Line = {
  productId: string;
  name: string;
  qty: number;
  unit: Unit;
  price: number;
};

export type Doc = {
  id: string;
  number: string;
  kind: DocKind;
  partyId: string;
  date: string;
  lines: Line[];
  paid: number;
  note: string;
};

export type Payment = {
  id: string;
  partyId: string;
  docId?: string;
  amount: number;
  method: PayMethod;
  date: string;
  note: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
};

export type Movement = {
  id: string;
  date: string;
  productId: string;
  name: string;
  qty: number;
  reason: string;
};

export type Bar = {
  id: string;
  sku: string;
  lengthCm: number;
  barcode: string;
};

export type Employee = {
  id: string;
  name: string;
  team: Team;
  phone: string;
  meters: number;
  role?: string;
  active?: boolean;
  workStart?: string;
  workEnd?: string;
};

export type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "late" | "absent" | "leave";
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
};

export type GpsPing = {
  id: string;
  employeeId: string;
  timestamp: string;
  lat: number;
  lng: number;
  accuracy?: number;
  taskId?: string;
};

export type WorkSite = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
};

export type DesignRequestStatus = "new" | "reviewing" | "quoted" | "approved" | "converted" | "rejected";

export type DesignRequest = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  image?: string;
  width: number;
  height: number;
  type: WindowKind;
  glass: string;
  color: string;
  notes: string;
  status: DesignRequestStatus;
  bom: { sku: string; name: string; qty: number; unit: Unit }[];
  estimatedTotal: number;
};

export type Task = {
  id: string;
  orderId: string;
  team: Team;
  employeeId?: string;
  status: "open" | "doing" | "done";
  photo?: string;
};

export type WorkOrder = {
  id: string;
  number: string;
  customerId: string;
  date: string;
  kind: WindowKind;
  width: number;
  height: number;
  color: string;
  glass: string;
  qty: number;
  alumM: number;
  glassM2: number;
  labor: number;
  total: number;
  status: OrderStatus;
  openings: Opening[];
  invoiceId?: string;
  stockTaken?: boolean;
  reserved?: boolean;
  plan?: PackPlan;
  qaStatus?: QaStatus;
  reviewed?: boolean;
};

export type LineInput = { productId: string; qty: number; price?: number };
export type Alert = { id: string; text: string; tone: "warn" | "danger" };

const OPENING_CASH = 18500;
export const WAGE: Record<Team, number> = { cut: 6, assemble: 5, install: 8, qa: 7 };

export const UNIT_LABEL: Record<Unit, string> = {
  m: "م",
  m2: "م²",
  pcs: "قطعة",
  kg: "كغ",
};

export const CAT_LABEL: Record<Category, string> = {
  aluminum: "ألمنيوم",
  glass: "زجاج",
  accessories: "إكسسوار",
  consumable: "مستهلكات",
};

export const KIND_LABEL: Record<WindowKind, string> = {
  sliding: "شباك منزلق",
  casement: "شباك مفصلي",
  fixed: "شباك ثابت",
  door: "باب ألمنيوم",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  quote: "عرض سعر",
  approved: "محجوز",
  cutting: "قصّ",
  assembled: "تجميع",
  done: "جاهز",
  delivered: "مُسلَّم",
};

export const TEAM_LABEL: Record<Team, string> = {
  cut: "قص",
  assemble: "تجميع",
  install: "تركيب",
  qa: "جودة",
};

function barcode(sku: string, n: number) {
  return `IT-${sku.replace(/[^A-Z0-9]/g, "")}-${String(n).padStart(4, "0")}`;
}

function barsFromMeters(sku: string, meters: number, start = 1): Bar[] {
  const full = Math.floor(meters / 6);
  const rem = Math.round((meters % 6) * 100);
  const bars: Bar[] = [];
  let n = start;
  for (let i = 0; i < full; i++) {
    bars.push({ id: uid(), sku, lengthCm: 600, barcode: barcode(sku, n++) });
  }
  if (rem >= 40) {
    bars.push({ id: uid(), sku, lengthCm: rem, barcode: barcode(sku, n++) });
  }
  return bars;
}

function seed() {
  const p = (partial: Omit<Product, "id">): Product => ({ id: uid(), ...partial });
  const products: Product[] = [
    p({ sku: "AL-SL-W", name: 'بروفايل شباك منزلق 3" أبيض', category: "aluminum", unit: "m", stock: 186, reserved: 0, min: 40, cost: 42, price: 68 }),
    p({ sku: "AL-SL-B", name: 'بروفايل شباك منزلق 3" بني', category: "aluminum", unit: "m", stock: 94, reserved: 0, min: 30, cost: 44, price: 72 }),
    p({ sku: "AL-DR-W", name: 'بروفايل باب 4" أبيض', category: "aluminum", unit: "m", stock: 38, reserved: 0, min: 20, cost: 58, price: 92 }),
    p({ sku: "GL-6", name: "زجاج شفاف 6 مم", category: "glass", unit: "m2", stock: 72, reserved: 0, min: 20, cost: 38, price: 64 }),
    p({ sku: "GL-DBL", name: "زجاج دبل 22 مم", category: "glass", unit: "m2", stock: 18, reserved: 0, min: 12, cost: 95, price: 148 }),
    p({ sku: "GL-BRZ", name: "زجاج رفللكت برونز 8 مم", category: "glass", unit: "m2", stock: 9, reserved: 0, min: 10, cost: 72, price: 118 }),
    p({ sku: "AC-ROL", name: "رولمان شباك منزلق", category: "accessories", unit: "pcs", stock: 240, reserved: 0, min: 80, cost: 4.5, price: 9 }),
    p({ sku: "AC-HND", name: "مقبض ألمنيوم", category: "accessories", unit: "pcs", stock: 64, reserved: 0, min: 24, cost: 11, price: 22 }),
    p({ sku: "AC-HNG", name: "مفصلات باب", category: "accessories", unit: "pcs", stock: 48, reserved: 0, min: 20, cost: 3, price: 6 }),
    p({ sku: "CN-SIL", name: "سيليكون أسود 280 مل", category: "consumable", unit: "pcs", stock: 16, reserved: 0, min: 20, cost: 8, price: 14 }),
  ];

  const parties: Party[] = [
    { id: uid(), kind: "customer", name: "مؤسسة البناء الحديث", phone: "0599 120 448", city: "الخليل" },
    { id: uid(), kind: "customer", name: "أبو محمد للتشطيبات", phone: "0568 774 210", city: "دورا" },
    { id: uid(), kind: "customer", name: "فيلا الرام — تشطيب", phone: "0592 331 905", city: "حلحول" },
    { id: uid(), kind: "customer", name: "ورشة يطا للمقاولات", phone: "0598 441 772", city: "يطا" },
    { id: uid(), kind: "supplier", name: "ألومينكو فلسطين", phone: "02 296 1100", city: "رام الله" },
    { id: uid(), kind: "supplier", name: "زجاج الجنوب", phone: "0599 880 312", city: "الخليل" },
  ];

  const customers = parties.filter((x) => x.kind === "customer");
  const suppliers = parties.filter((x) => x.kind === "supplier");
  const alum = products[0];
  const glass = products[3];
  const handle = products[7];
  const dble = products[4];

  const docs: Doc[] = [
    {
      id: uid(),
      number: "S-1042",
      kind: "sale",
      partyId: customers[0].id,
      date: "2026-08-18",
      paid: 4200,
      note: "شبابيك فيلا الطابق الأرضي",
      lines: [
        { productId: alum.id, name: alum.name, qty: 42, unit: "m", price: alum.price },
        { productId: glass.id, name: glass.name, qty: 18, unit: "m2", price: glass.price },
        { productId: handle.id, name: handle.name, qty: 8, unit: "pcs", price: handle.price },
      ],
    },
    {
      id: uid(),
      number: "S-1043",
      kind: "sale",
      partyId: customers[1].id,
      date: "2026-08-22",
      paid: 0,
      note: "أبواب مطبخ",
      lines: [
        { productId: products[2].id, name: products[2].name, qty: 16, unit: "m", price: products[2].price },
        { productId: dble.id, name: dble.name, qty: 6.4, unit: "m2", price: dble.price },
      ],
    },
    {
      id: uid(),
      number: "P-318",
      kind: "purchase",
      partyId: suppliers[0].id,
      date: "2026-08-12",
      paid: 8000,
      note: "شحنة بروفايل أبيض 6 م",
      lines: [
        { productId: alum.id, name: alum.name, qty: 120, unit: "m", price: alum.cost },
        { productId: products[2].id, name: products[2].name, qty: 40, unit: "m", price: products[2].cost },
      ],
    },
    {
      id: uid(),
      number: "P-321",
      kind: "purchase",
      partyId: suppliers[1].id,
      date: "2026-08-21",
      paid: 0,
      note: "زجاج دبل ورفللكت",
      lines: [
        { productId: dble.id, name: dble.name, qty: 20, unit: "m2", price: dble.cost },
        { productId: products[5].id, name: products[5].name, qty: 12, unit: "m2", price: products[5].cost },
      ],
    },
  ];

  const payments: Payment[] = [
    { id: uid(), partyId: customers[0].id, docId: docs[0].id, amount: 4200, method: "bank", date: "2026-08-20", note: "دفعة أولى" },
    { id: uid(), partyId: suppliers[0].id, docId: docs[2].id, amount: 8000, method: "check", date: "2026-08-14", note: "شيك رقم 4412" },
    { id: uid(), partyId: customers[2].id, amount: 2500, method: "cash", date: "2026-08-24", note: "عربون شبابيك الصالة" },
  ];

  const expenses: Expense[] = [
    { id: uid(), category: "أجور الورشة", amount: 3200, date: "2026-08-05", note: "رواتب القصّاصين" },
    { id: uid(), category: "كهرباء", amount: 640, date: "2026-08-10", note: "فاتورة الشهر" },
    { id: uid(), category: "نقل", amount: 280, date: "2026-08-19", note: "توصيل حلحول" },
  ];

  const openingA: Opening = { id: uid(), kind: "sliding", width: 140, height: 130, qty: 4, color: "أبيض", glass: "زجاج دبل 22 مم" };
  const openingB: Opening = { id: uid(), kind: "fixed", width: 80, height: 60, qty: 2, color: "أبيض", glass: "زجاج دبل 22 مم" };
  const pricedVilla = priceJob([openingA, openingB], products);
  const doorOpen: Opening = { id: uid(), kind: "door", width: 100, height: 220, qty: 2, color: "أبيض", glass: "زجاج شفاف 6 مم" };
  const pricedDoor = priceJob([doorOpen], products);
  const caseOpen: Opening = { id: uid(), kind: "casement", width: 90, height: 140, qty: 3, color: "أبيض", glass: "زجاج شفاف 6 مم" };
  const pricedCase = priceJob([caseOpen], products);

  const villaId = uid();
  const doorId = uid();
  const caseId = uid();
  const workOrders: WorkOrder[] = [
    {
      id: villaId,
      number: "W-77",
      customerId: customers[2].id,
      date: "2026-08-23",
      kind: "sliding",
      width: 140,
      height: 130,
      color: "أبيض",
      glass: "زجاج دبل 22 مم",
      qty: 6,
      alumM: Number(pricedVilla.alumM.toFixed(2)),
      glassM2: Number(pricedVilla.glassM2.toFixed(2)),
      labor: pricedVilla.labor,
      total: pricedVilla.total,
      status: "approved",
      openings: [openingA, openingB],
      reserved: true,
    },
    {
      id: doorId,
      number: "W-78",
      customerId: customers[3].id,
      date: "2026-08-25",
      kind: "door",
      width: 100,
      height: 220,
      color: "أبيض",
      glass: "زجاج شفاف 6 مم",
      qty: 2,
      alumM: pricedDoor.alumM,
      glassM2: pricedDoor.glassM2,
      labor: pricedDoor.labor,
      total: pricedDoor.total,
      status: "quote",
      openings: [doorOpen],
    },
    {
      id: caseId,
      number: "W-79",
      customerId: customers[0].id,
      date: "2026-08-20",
      kind: "casement",
      width: 90,
      height: 140,
      color: "أبيض",
      glass: "زجاج شفاف 6 مم",
      qty: 3,
      alumM: pricedCase.alumM,
      glassM2: pricedCase.glassM2,
      labor: pricedCase.labor,
      total: pricedCase.total,
      status: "assembled",
      openings: [caseOpen],
      stockTaken: true,
      qaStatus: "rework",
    },
  ];

  const want = needOf(workOrders[0]);
  for (const w of want) {
    const prod = products.find((x) => x.sku === w.sku);
    if (prod) prod.reserved = Number((prod.reserved + w.qty).toFixed(2));
  }

  const bars: Bar[] = [
    ...barsFromMeters("AL-SL-W", 186, 100),
    ...barsFromMeters("AL-SL-B", 94, 200),
    ...barsFromMeters("AL-DR-W", 38, 300),
  ];

  const employees: Employee[] = [
    { id: uid(), name: "أحمد القصّاص", team: "cut", phone: "0599 441 120", meters: 412, role: "فني قص", active: true, workStart: "10:00", workEnd: "02:00" },
    { id: uid(), name: "سامي عودة", team: "cut", phone: "0568 220 773", meters: 288, role: "فني قص", active: true, workStart: "10:00", workEnd: "02:00" },
    { id: uid(), name: "وليد التجميع", team: "assemble", phone: "0592 881 004", meters: 196, role: "فني تجميع", active: true, workStart: "10:00", workEnd: "02:00" },
    { id: uid(), name: "محمود التركيب", team: "install", phone: "0598 110 552", meters: 340, role: "فني تركيب", active: true, workStart: "10:00", workEnd: "02:00" },
    { id: uid(), name: "كريم الميدان", team: "install", phone: "0599 663 218", meters: 154, role: "فني تركيب", active: true, workStart: "10:00", workEnd: "02:00" },
    { id: uid(), name: "ياسر الجودة", team: "qa", phone: "0592 770 331", meters: 86, role: "مراقب جودة", active: true, workStart: "10:00", workEnd: "02:00" },
  ];

  const qaId = employees[5].id;
  const tasks: Task[] = [
    { id: uid(), orderId: villaId, team: "cut", employeeId: employees[0].id, status: "open" },
    { id: uid(), orderId: villaId, team: "assemble", employeeId: employees[2].id, status: "open" },
    { id: uid(), orderId: villaId, team: "install", employeeId: employees[3].id, status: "open" },
    { id: uid(), orderId: caseId, team: "assemble", employeeId: employees[2].id, status: "done" },
  ];

  const movements: Movement[] = [
    { id: uid(), date: "2026-08-12", productId: alum.id, name: alum.name, qty: 120, reason: "شراء P-318" },
    { id: uid(), date: "2026-08-18", productId: alum.id, name: alum.name, qty: -42, reason: "بيع S-1042" },
  ];

  const inspections: Inspection[] = [
    {
      id: uid(),
      orderId: caseId,
      stage: "cut",
      date: "2026-08-21",
      inspectorId: qaId,
      items: blankItems("cut").map((i) => ({ ...i, ok: true })),
      notes: "القص مطابق.",
      result: "pass",
    },
    {
      id: uid(),
      orderId: caseId,
      stage: "assemble",
      date: "2026-08-24",
      inspectorId: qaId,
      items: blankItems("assemble").map((i, n) => ({ ...i, ok: n !== 3 })),
      notes: "فجوة سيليكون في الضلفة الوسطى — إعادة عمل.",
      result: "rework",
    },
  ];

  const reviews: Review[] = [];
  const designRequests: DesignRequest[] = [];
  const attendance: Attendance[] = [];
  const gpsPings: GpsPing[] = [];
  const workSites: WorkSite[] = [
    { id: uid(), name: "المصنع الرئيسي", address: "الخليل", lat: 31.5326, lng: 35.0998, radius: 180 },
    { id: uid(), name: "مشروع واجهة بيت لحم", address: "بيت لحم", lat: 31.7054, lng: 35.2024, radius: 250 },
  ];

  return { products, parties, docs, payments, expenses, workOrders, movements, bars, employees, tasks, designRequests, inspections, reviews, attendance, gpsPings, workSites };
}

function nextNo(prefix: string, items: { number: string }[]) {
  const nums = items
    .map((i) => Number(i.number.replace(/^[A-Z]-/, "")))
    .filter((n) => Number.isFinite(n));
  const n = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `${prefix}-${n}`;
}

export function openingsOf(w: WorkOrder): Opening[] {
  if (w.openings?.length) return w.openings;
  return [{ id: w.id, kind: w.kind, width: w.width, height: w.height, qty: w.qty, color: w.color, glass: w.glass }];
}

export function needOf(order: WorkOrder) {
  const t = jobTotals(openingsOf(order));
  const color = openingsOf(order)[0]?.color ?? order.color;
  const kind = openingsOf(order)[0]?.kind ?? order.kind;
  const glass = openingsOf(order)[0]?.glass ?? order.glass;
  return [
    { sku: alumSku(kind, color), qty: t.alumM },
    { sku: glassSku(glass), qty: t.glassM2 },
    { sku: "AC-ROL", qty: t.rollers },
    { sku: "AC-HND", qty: t.handles },
    { sku: "AC-HNG", qty: t.hinges },
    { sku: "CN-SIL", qty: t.silicone },
  ].filter((x) => x.qty > 0);
}

export function available(p: Product) {
  return Number((p.stock - p.reserved).toFixed(2));
}

export function alertsOf(products: Product[]): Alert[] {
  return products
    .filter((p) => available(p) <= p.min)
    .map((p) => ({
      id: p.id,
      tone: available(p) <= 0 ? "danger" : "warn",
      text: `${p.name} — المتاح ${available(p)} ${UNIT_LABEL[p.unit]} (الحد ${p.min})`,
    }));
}

export function planFor(order: WorkOrder, bars: Bar[]): PackPlan {
  const demand = alumDemand(openingsOf(order));
  const sku = alumSku(openingsOf(order)[0]?.kind ?? order.kind, openingsOf(order)[0]?.color ?? order.color);
  const remnants = bars.filter((b) => b.sku === sku && b.lengthCm < 600).map((b) => b.lengthCm);
  return packCuts(demand, remnants);
}

export function projectPnl(order: WorkOrder, products: Product[]) {
  const materials = materialCost(openingsOf(order), products);
  const wages = Math.round(order.alumM * WAGE.cut + order.alumM * WAGE.assemble + order.alumM * WAGE.install);
  const revenue = order.total;
  return { materials, wages, revenue, profit: revenue - materials - wages };
}

function applyNeed(
  products: Product[],
  need: { sku: string; qty: number }[],
  mode: "reserve" | "release" | "consume",
) {
  return products.map((p) => {
    const hit = need.find((n) => n.sku === p.sku);
    if (!hit) return p;
    if (mode === "reserve") return { ...p, reserved: Number((p.reserved + hit.qty).toFixed(2)) };
    if (mode === "release") return { ...p, reserved: Number((Math.max(0, p.reserved - hit.qty)).toFixed(2)) };
    return {
      ...p,
      stock: Number((p.stock - hit.qty).toFixed(2)),
      reserved: Number((Math.max(0, p.reserved - hit.qty)).toFixed(2)),
    };
  });
}

function applyCutBars(bars: Bar[], order: WorkOrder, plan: PackPlan) {
  const sku = alumSku(openingsOf(order)[0]?.kind ?? order.kind, openingsOf(order)[0]?.color ?? order.color);
  const remnants = bars
    .filter((b) => b.sku === sku && b.lengthCm < 600)
    .sort((a, b) => a.lengthCm - b.lengthCm);
  const usedRemnantIds = remnants.slice(0, plan.remnantsUsed).map((b) => b.id);
  let newLeft = plan.newBars;
  const next = bars.filter((b) => {
    if (usedRemnantIds.includes(b.id)) return false;
    if (b.sku === sku && b.lengthCm === 600 && newLeft > 0) {
      newLeft -= 1;
      return false;
    }
    return true;
  });
  const maxN = next.reduce((m, b) => {
    const n = Number(b.barcode.split("-").pop());
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 400);
  plan.remnantsOut.forEach((cm, i) => {
    next.push({ id: uid(), sku, lengthCm: cm, barcode: barcode(sku, maxN + 1 + i) });
  });
  return next;
}

type State = {
  hydrated: boolean;
  view: View;
  mode: Mode;
  techId: string;
  products: Product[];
  parties: Party[];
  docs: Doc[];
  payments: Payment[];
  expenses: Expense[];
  workOrders: WorkOrder[];
  movements: Movement[];
  bars: Bar[];
  employees: Employee[];
  tasks: Task[];
  designRequests: DesignRequest[];
  inspections: Inspection[];
  reviews: Review[];
  attendance: Attendance[];
  gpsPings: GpsPing[];
  workSites: WorkSite[];
  setHydrated: (v: boolean) => void;
  setView: (v: View) => void;
  setMode: (m: Mode) => void;
  setTech: (id: string) => void;
  resetDemo: () => void;
  addProduct: (p: Omit<Product, "id" | "reserved">) => void;
  adjustStock: (id: string, delta: number, reason?: string) => void;
  addParty: (p: Omit<Party, "id">) => void;
  postDoc: (input: {
    kind: DocKind;
    partyId: string;
    date: string;
    note: string;
    lines: LineInput[];
    skipStock?: boolean;
  }) => string;
  addPayment: (p: Omit<Payment, "id">) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  addWorkOrder: (w: Omit<WorkOrder, "id" | "number">) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  invoiceFromOrder: (id: string) => string;
  assignTask: (taskId: string, employeeId: string) => void;
  startTask: (taskId: string) => void;
  finishTask: (taskId: string, photo?: string) => void;
  checkIn: (employeeId: string, location?: { lat: number; lng: number }) => void;
  checkOut: (employeeId: string, location?: { lat: number; lng: number }) => void;
  addGpsPing: (employeeId: string, location: { lat: number; lng: number; accuracy?: number }, taskId?: string) => void;
  clearGpsPings: () => void;
  addDesignRequest: (input: Omit<DesignRequest, "id" | "number" | "createdAt" | "status">) => string;
  updateDesignRequestStatus: (id: string, status: DesignRequestStatus) => void;
  saveInspection: (input: {
    orderId: string;
    stage: QaStage;
    inspectorId: string;
    items: { label: string; ok: boolean | null }[];
    notes: string;
  }) => void;
  saveReview: (input: { orderId: string; reviewerId: string; verdict: "approve" | "return"; comment: string }) => void;
  hydrateCloud: (data: Record<string, unknown>) => void;
};

export const useItar = create<State>()(
  persist(
    (set, get) => ({
      hydrated: true,
      view: "home",
      mode: "desk",
      techId: "",
      ...seed(),
      setHydrated: (hydrated) => set({ hydrated }),
      setView: (view) => set({ view }),
      setMode: (mode) => set({ mode }),
      setTech: (techId) => set({ techId }),
      resetDemo: () => set({ ...seed(), view: "home", mode: "desk" }),
      addProduct: (p) => set({ products: [{ id: uid(), reserved: 0, ...p }, ...get().products] }),
      adjustStock: (id, delta, reason = "تعديل يدوي") => {
        const prod = get().products.find((x) => x.id === id);
        if (!prod) return;
        let bars = get().bars;
        if (prod.category === "aluminum" && delta > 0) {
          bars = [...bars, ...barsFromMeters(prod.sku, delta, Date.now() % 9000)];
        }
        set({
          products: get().products.map((x) =>
            x.id === id ? { ...x, stock: Number((x.stock + delta).toFixed(2)) } : x,
          ),
          bars,
          movements: [
            { id: uid(), date: todayIso(), productId: id, name: prod.name, qty: delta, reason },
            ...get().movements,
          ],
        });
      },
      addParty: (p) => set({ parties: [{ id: uid(), ...p }, ...get().parties] }),
      postDoc: ({ kind, partyId, date, note, lines, skipStock }) => {
        const products = get().products;
        const built: Line[] = lines
          .map((l) => {
            const prod = products.find((x) => x.id === l.productId);
            if (!prod || l.qty <= 0) return null;
            return {
              productId: prod.id,
              name: prod.name,
              qty: l.qty,
              unit: prod.unit,
              price: l.price ?? (kind === "sale" ? prod.price : prod.cost),
            };
          })
          .filter((x): x is Line => x !== null);
        if (built.length === 0) return "";
        const id = uid();
        const number = nextNo(kind === "sale" ? "S" : "P", get().docs.filter((d) => d.kind === kind));
        const sign = kind === "sale" ? -1 : 1;
        const reason = `${kind === "sale" ? "بيع" : "شراء"} ${number}`;
        const movements: Movement[] = skipStock
          ? []
          : built.map((l) => ({
              id: uid(),
              date,
              productId: l.productId,
              name: l.name,
              qty: sign * l.qty,
              reason,
            }));
        set({
          docs: [{ id, number, kind, partyId, date, note, lines: built, paid: 0 }, ...get().docs],
          products: skipStock
            ? products
            : products.map((x) => {
                const line = built.find((l) => l.productId === x.id);
                if (!line) return x;
                return { ...x, stock: Number((x.stock + sign * line.qty).toFixed(2)) };
              }),
          movements: [...movements, ...get().movements],
        });
        return id;
      },
      addPayment: (p) => {
        const docs = get().docs.map((d) =>
          p.docId && d.id === p.docId ? { ...d, paid: d.paid + p.amount } : d,
        );
        set({ payments: [{ id: uid(), ...p }, ...get().payments], docs });
      },
      addExpense: (e) => set({ expenses: [{ id: uid(), ...e }, ...get().expenses] }),
      addWorkOrder: (w) =>
        set({
          workOrders: [{ id: uid(), number: nextNo("W", get().workOrders), ...w }, ...get().workOrders],
        }),
      setOrderStatus: (id, status) => {
        const current = get().workOrders.find((w) => w.id === id);
        if (!current) return;
        let products = get().products;
        let movements = get().movements;
        let bars = get().bars;
        let tasks = get().tasks;
        let reserved = current.reserved ?? false;
        let stockTaken = current.stockTaken ?? false;
        let plan = current.plan;
        let qaStatus = current.qaStatus;
        const need = needOf(current);

        if (status === "approved" && !reserved) {
          products = applyNeed(products, need, "reserve");
          reserved = true;
          const exists = tasks.some((t) => t.orderId === id);
          if (!exists) {
            const pick = (team: Team) => get().employees.find((e) => e.team === team)?.id;
            tasks = [
              { id: uid(), orderId: id, team: "cut", employeeId: pick("cut"), status: "open" },
              { id: uid(), orderId: id, team: "assemble", employeeId: pick("assemble"), status: "open" },
              { id: uid(), orderId: id, team: "install", employeeId: pick("install"), status: "open" },
              ...tasks,
            ];
          }
        }

        if (status === "cutting" && !stockTaken) {
          plan = planFor(current, bars);
          bars = applyCutBars(bars, current, plan);
          products = applyNeed(products, need, "consume");
          stockTaken = true;
          reserved = false;
          for (const n of need) {
            const prod = products.find((x) => x.sku === n.sku);
            if (prod) {
              movements = [
                { id: uid(), date: todayIso(), productId: prod.id, name: prod.name, qty: -n.qty, reason: `قص ${current.number}` },
                ...movements,
              ];
            }
          }
        }

        if (status === "done" && !qaStatus) qaStatus = "pending";
        if (status === "delivered" && qaStatus !== "pass") return;

        set({
          products,
          movements,
          bars,
          tasks,
          workOrders: get().workOrders.map((w) =>
            w.id === id ? { ...w, status, reserved, stockTaken, plan, qaStatus } : w,
          ),
        });
      },
      invoiceFromOrder: (id) => {
        const order = get().workOrders.find((w) => w.id === id);
        if (!order || order.invoiceId) return order?.invoiceId ?? "";
        const priced = priceJob(openingsOf(order), get().products);
        const lines: LineInput[] = [];
        const push = (prod: Product | undefined, qty: number) => {
          if (prod && qty > 0) lines.push({ productId: prod.id, qty });
        };
        push(priced.alum, priced.alumM);
        push(priced.gl, priced.glassM2);
        push(priced.rol, priced.rollers);
        push(priced.hnd, priced.handles);
        push(priced.hng, priced.hinges);
        push(priced.sil, priced.silicone);
        const laborLine: Line = {
          productId: "labor",
          name: "أجرة قص وتركيب",
          qty: 1,
          unit: "pcs",
          price: priced.labor,
        };
        const skipStock = Boolean(order.stockTaken);
        const builtBase = lines
          .map((l) => {
            const prod = get().products.find((x) => x.id === l.productId);
            if (!prod || l.qty <= 0) return null;
            return { productId: prod.id, name: prod.name, qty: l.qty, unit: prod.unit, price: prod.price };
          })
          .filter((x): x is Line => x !== null);
        const built = [...builtBase, laborLine];
        const docId = uid();
        const number = nextNo("S", get().docs.filter((d) => d.kind === "sale"));
        const date = todayIso();
        set({
          docs: [
            {
              id: docId,
              number,
              kind: "sale",
              partyId: order.customerId,
              date,
              note: `أمر ورشة ${order.number}`,
              lines: built,
              paid: 0,
            },
            ...get().docs,
          ],
          products: skipStock
            ? get().products
            : get().products.map((x) => {
                const line = builtBase.find((l) => l.productId === x.id);
                if (!line) return x;
                return { ...x, stock: Number((x.stock - line.qty).toFixed(2)) };
              }),
          workOrders: get().workOrders.map((w) =>
            w.id === id
              ? {
                  ...w,
                  invoiceId: docId,
                  stockTaken: true,
                  status: w.status === "quote" ? "approved" : w.status,
                }
              : w,
          ),
        });
        return docId;
      },
      assignTask: (taskId, employeeId) =>
        set({
          tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, employeeId } : t)),
        }),
      startTask: (taskId) =>
        set({
          tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, status: "doing" } : t)),
        }),
      addDesignRequest: (input) => {
        const id = uid();
        const number = nextNo("D", get().designRequests.map((d) => ({ number: d.number })));
        set({ designRequests: [{ ...input, id, number, createdAt: new Date().toISOString(), status: "new" }, ...get().designRequests] });
        return id;
      },
      updateDesignRequestStatus: (id, status) => set({ designRequests: get().designRequests.map((d) => d.id === id ? { ...d, status } : d) }),
      checkIn: (employeeId, location) => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10);
        const existing = get().attendance.find((a) => a.employeeId === employeeId && a.date === date);
        if (existing?.checkIn) return;
        const employee = get().employees.find((e) => e.id === employeeId);
        const start = employee?.workStart ?? "10:00";
        const [h, m] = start.split(":").map(Number);
        const late = now.getHours() * 60 + now.getMinutes() > h * 60 + m + 10;
        const record: Attendance = { id: existing?.id ?? uid(), employeeId, date, checkIn: now.toISOString(), status: late ? "late" : "present", ...(location ? { checkInLat: location.lat, checkInLng: location.lng } : {}) };
        set({ attendance: existing ? get().attendance.map((a) => a.id === existing.id ? record : a) : [record, ...get().attendance] });
      },
      checkOut: (employeeId, location) => {
        const date = new Date().toISOString().slice(0, 10);
        const record = get().attendance.find((a) => a.employeeId === employeeId && a.date === date);
        if (!record?.checkIn || record.checkOut) return;
        set({ attendance: get().attendance.map((a) => a.id === record.id ? { ...a, checkOut: new Date().toISOString(), ...(location ? { checkOutLat: location.lat, checkOutLng: location.lng } : {}) } : a) });
      },
      addGpsPing: (employeeId, location, taskId) => set({ gpsPings: [{ id: uid(), employeeId, timestamp: new Date().toISOString(), ...location, taskId }, ...get().gpsPings].slice(0, 2000) }),
      clearGpsPings: () => set({ gpsPings: [] }),
      finishTask: (taskId, photo) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const order = get().workOrders.find((w) => w.id === task.orderId);
        const tasks = get().tasks.map((t) =>
          t.id === taskId ? { ...t, status: "done" as const, photo: photo ?? t.photo } : t,
        );
        const employees = get().employees.map((e) =>
          e.id === task.employeeId ? { ...e, meters: Number((e.meters + (order?.alumM ?? 0)).toFixed(1)) } : e,
        );
        let status = order?.status;
        if (task.team === "cut") status = "cutting";
        if (task.team === "assemble") status = "assembled";
        if (task.team === "install") status = "done";
        const qaStatus = task.team === "install" ? ("pending" as const) : order?.qaStatus;
        set({
          tasks,
          employees,
          workOrders: get().workOrders.map((w) =>
            w.id === task.orderId && status ? { ...w, status, qaStatus: qaStatus ?? w.qaStatus } : w,
          ),
        });
      },
      saveInspection: ({ orderId, stage, inspectorId, items, notes }) => {
        const result = resultOf(items);
        const qaStatus: QaStatus = result === "pass" && stage === "final" ? "pass" : result === "pass" ? "pending" : "rework";
        set({
          inspections: [
            {
              id: uid(),
              orderId,
              stage,
              date: todayIso(),
              inspectorId,
              items,
              notes,
              result,
            },
            ...get().inspections,
          ],
          workOrders: get().workOrders.map((w) => (w.id === orderId ? { ...w, qaStatus, reviewed: false } : w)),
        });
      },
      saveReview: ({ orderId, reviewerId, verdict, comment }) => {
        const order = get().workOrders.find((w) => w.id === orderId);
        if (!order) return;
        set({
          reviews: [
            { id: uid(), orderId, date: todayIso(), reviewerId, verdict, comment },
            ...get().reviews,
          ],
          workOrders: get().workOrders.map((w) =>
            w.id === orderId
              ? {
                  ...w,
                  reviewed: verdict === "approve",
                  qaStatus: verdict === "return" ? "rework" : w.qaStatus,
                  status: verdict === "approve" && w.qaStatus === "pass" ? "delivered" : w.status,
                }
              : w,
          ),
        });
      },
      hydrateCloud: (data) => {
        const keys = [
          "products",
          "parties",
          "docs",
          "payments",
          "expenses",
          "workOrders",
          "movements",
          "bars",
          "employees",
          "tasks",
          "designRequests",
          "inspections",
          "reviews",
          "attendance",
          "gpsPings",
          "workSites",
        ] as const;
        const patch: Partial<State> = {};
        for (const k of keys) {
          if (Array.isArray(data[k])) (patch as Record<string, unknown>)[k] = data[k];
        }
        set(patch);
      },
    }),
    {
      name: "itar-erp-v4",
      skipHydration: true,
      partialize: (s) => ({
        products: s.products,
        parties: s.parties,
        docs: s.docs,
        payments: s.payments,
        expenses: s.expenses,
        workOrders: s.workOrders,
        movements: s.movements,
        bars: s.bars,
        employees: s.employees,
        tasks: s.tasks,
        designRequests: s.designRequests,
        inspections: s.inspections,
        reviews: s.reviews,
        attendance: s.attendance,
        gpsPings: s.gpsPings,
        workSites: s.workSites,
      }),
    },
  ),
);

export function lineSum(lines: Line[]) {
  return lines.reduce((s, l) => s + l.qty * l.price, 0);
}

export function dueOf(doc: Doc) {
  return Math.max(0, lineSum(doc.lines) - doc.paid);
}

export function partyBalance(partyId: string, docs: Doc[], payments: Payment[]) {
  const partyDocs = docs.filter((d) => d.partyId === partyId);
  const sales = partyDocs.filter((d) => d.kind === "sale").reduce((s, d) => s + lineSum(d.lines), 0);
  const purchases = partyDocs.filter((d) => d.kind === "purchase").reduce((s, d) => s + lineSum(d.lines), 0);
  const paid = payments.filter((p) => p.partyId === partyId).reduce((s, p) => s + p.amount, 0);
  const party = useItar.getState().parties.find((x) => x.id === partyId);
  if (party?.kind === "supplier") return purchases - paid;
  return sales - paid;
}

export function booksOf(state: Pick<State, "products" | "docs" | "payments" | "expenses">) {
  const inventory = state.products.reduce((s, p) => s + p.stock * p.cost, 0);
  const sales = state.docs.filter((d) => d.kind === "sale").reduce((s, d) => s + lineSum(d.lines), 0);
  const cogs = state.docs
    .filter((d) => d.kind === "sale")
    .reduce((s, d) => {
      return (
        s +
        d.lines.reduce((acc, l) => {
          const p = state.products.find((x) => x.id === l.productId);
          return acc + l.qty * (p?.cost ?? l.price * 0.6);
        }, 0)
      );
    }, 0);
  const purchases = state.docs.filter((d) => d.kind === "purchase").reduce((s, d) => s + lineSum(d.lines), 0);
  const expenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const ar = state.docs.filter((d) => d.kind === "sale").reduce((s, d) => s + dueOf(d), 0);
  const ap = state.docs.filter((d) => d.kind === "purchase").reduce((s, d) => s + dueOf(d), 0);
  const inCash = state.payments.reduce((s, p) => {
    const doc = state.docs.find((d) => d.id === p.docId);
    const party = useItar.getState().parties.find((x) => x.id === p.partyId);
    if (doc?.kind === "purchase" || party?.kind === "supplier") return s;
    return s + p.amount;
  }, 0);
  const outCash =
    state.payments
      .filter((p) => {
        const doc = state.docs.find((d) => d.id === p.docId);
        const party = useItar.getState().parties.find((x) => x.id === p.partyId);
        return doc?.kind === "purchase" || party?.kind === "supplier";
      })
      .reduce((s, p) => s + p.amount, 0) + expenses;
  const cash = OPENING_CASH + inCash - outCash;
  const profit = sales - cogs - expenses;
  return { inventory, sales, cogs, purchases, expenses, ar, ap, cash, profit };
}
