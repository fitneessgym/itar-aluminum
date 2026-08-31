import { useItar } from "@/lib/itar-store";

export function workspaceSnapshot() {
  const s = useItar.getState();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
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
  };
}
