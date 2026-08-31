export type OptPiece = { label: string; lengthCm: number };
export type OptBar = { id: string; barcode: string; lengthCm: number; sku: string };

export type CutOnBar = {
  barId: string;
  barcode: string;
  sku: string;
  barLength: number;
  cuts: OptPiece[];
  leftoverCm: number;
  keep: boolean;
  virtual: boolean;
};

const KERF = 0.4;
export const MIN_KEEP = 28;
export const FULL_BAR = 600;

export function packCuts(pieces: OptPiece[], bars: OptBar[]): {
  plans: CutOnBar[];
  leftoverCm: number;
  wasteCm: number;
  usedCm: number;
  needBars: number;
  unplaced: OptPiece[];
} {
  const demand = [...pieces].sort((a, b) => b.lengthCm - a.lengthCm);
  const stock: { bar: OptBar; remain: number; cuts: OptPiece[]; virtual: boolean }[] = bars
    .filter((b) => b.lengthCm >= MIN_KEEP)
    .map((b) => ({ bar: b, remain: b.lengthCm, cuts: [] as OptPiece[], virtual: false }))
    .sort((a, b) => a.remain - b.remain);

  const unplaced: OptPiece[] = [];
  let virtualCount = 0;

  for (const piece of demand) {
    if (piece.lengthCm > FULL_BAR) {
      unplaced.push(piece);
      continue;
    }
    let best = -1;
    let bestRemain = Infinity;
    for (let i = 0; i < stock.length; i++) {
      const slot = stock[i];
      const need = piece.lengthCm + (slot.cuts.length ? KERF : 0);
      if (slot.remain + 1e-6 >= need && slot.remain - need < bestRemain) {
        bestRemain = slot.remain - need;
        best = i;
      }
    }
    if (best === -1) {
      virtualCount += 1;
      stock.push({
        bar: {
          id: `need-${virtualCount}`,
          barcode: "اطلب قطاع 6م",
          lengthCm: FULL_BAR,
          sku: bars[0]?.sku ?? "",
        },
        remain: FULL_BAR,
        cuts: [],
        virtual: true,
      });
      best = stock.length - 1;
    }
    const slot = stock[best];
    const need = piece.lengthCm + (slot.cuts.length ? KERF : 0);
    slot.remain = Number((slot.remain - need).toFixed(1));
    slot.cuts.push(piece);
  }

  const used = stock.filter((s) => s.cuts.length > 0);
  const plans: CutOnBar[] = used.map((s) => ({
    barId: s.bar.id,
    barcode: s.bar.barcode,
    sku: s.bar.sku,
    barLength: s.bar.lengthCm,
    cuts: s.cuts,
    leftoverCm: Math.max(0, s.remain),
    keep: s.remain >= MIN_KEEP,
    virtual: s.virtual,
  }));

  const leftoverCm = plans.filter((p) => p.keep && !p.virtual).reduce((s, p) => s + p.leftoverCm, 0);
  const wasteCm = plans.filter((p) => !p.keep).reduce((s, p) => s + p.leftoverCm, 0);
  const usedCm = demand.reduce((s, p) => s + p.lengthCm, 0);
  const needBars = plans.filter((p) => p.virtual).length;

  return { plans, leftoverCm, wasteCm, usedCm, needBars, unplaced };
}

export function wastePct(usedCm: number, wasteCm: number, leftoverCm: number) {
  const consumed = usedCm + wasteCm + leftoverCm;
  if (consumed <= 0) return 0;
  return Number(((wasteCm / consumed) * 100).toFixed(1));
}
