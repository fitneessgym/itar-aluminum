import type { Product, WindowKind } from "./itar-store";

export type Opening = {
  id: string;
  kind: WindowKind;
  width: number;
  height: number;
  qty: number;
  color: string;
  glass: string;
};

export type CutPiece = {
  label: string;
  lengthCm: number;
  count: number;
  kind: "alum" | "glass";
};

export const BAR_CM = 600;
export const MIN_REMNANT_CM = 40;

function leaves(kind: WindowKind) {
  return kind === "sliding" ? 2 : 1;
}

export function cutPieces(o: Opening): CutPiece[] {
  const W = o.width;
  const H = o.height;
  const q = o.qty;
  const gw = Math.max(W - 8, 1);
  const gh = Math.max(H - 8, 1);
  if (o.kind === "sliding") {
    return [
      { label: "قائم إطار", lengthCm: H, count: 2 * q, kind: "alum" },
      { label: "عارضة إطار", lengthCm: W, count: 2 * q, kind: "alum" },
      { label: "عامود منتصف", lengthCm: Math.max(H - 6, 1), count: q, kind: "alum" },
      { label: `زجاج ${gw}×${gh} سم`, lengthCm: 0, count: 2 * q, kind: "glass" },
    ];
  }
  if (o.kind === "door") {
    return [
      { label: "قائم باب", lengthCm: H, count: 2 * q, kind: "alum" },
      { label: "عارضة باب", lengthCm: W, count: 3 * q, kind: "alum" },
      { label: `زجاج ${gw}×${Math.max(H - 45, 1)} سم`, lengthCm: 0, count: q, kind: "glass" },
    ];
  }
  if (o.kind === "casement") {
    return [
      { label: "قائم", lengthCm: H, count: 2 * q, kind: "alum" },
      { label: "عارضة", lengthCm: W, count: 2 * q, kind: "alum" },
      { label: "ضلفة", lengthCm: Math.max(H - 4, 1), count: 2 * q, kind: "alum" },
      { label: `زجاج ${gw}×${gh} سم`, lengthCm: 0, count: q, kind: "glass" },
    ];
  }
  return [
    { label: "قائم ثابت", lengthCm: H, count: 2 * q, kind: "alum" },
    { label: "عارضة ثابت", lengthCm: W, count: 2 * q, kind: "alum" },
    { label: `زجاج ${gw}×${gh} سم`, lengthCm: 0, count: q, kind: "glass" },
  ];
}

export function openingQty(o: Opening) {
  const pieces = cutPieces(o);
  const alumCm = pieces.filter((p) => p.kind === "alum").reduce((s, p) => s + p.lengthCm * p.count, 0);
  const alumM = Number(((alumCm / 100) * 1.08).toFixed(2));
  const gw = Math.max(o.width - 8, 1) / 100;
  const gh = Math.max(o.height - (o.kind === "door" ? 45 : 8), 1) / 100;
  const glassM2 = Number((gw * gh * leaves(o.kind) * o.qty).toFixed(2));
  const labor = Math.round((o.kind === "door" ? 220 : 150) * o.qty + glassM2 * 38);
  const rollers = o.kind === "sliding" ? 2 * o.qty : 0;
  const hinges = o.kind === "casement" || o.kind === "door" ? 3 * o.qty : 0;
  const handles = o.qty;
  const silicone = Math.max(1, Math.ceil(o.qty / 2));
  return { alumM, glassM2, labor, rollers, handles, hinges, silicone, pieces };
}

export function jobTotals(openings: Opening[]) {
  return openings.reduce(
    (acc, o) => {
      const q = openingQty(o);
      acc.alumM += q.alumM;
      acc.glassM2 += q.glassM2;
      acc.labor += q.labor;
      acc.rollers += q.rollers;
      acc.handles += q.handles;
      acc.hinges += q.hinges;
      acc.silicone += q.silicone;
      acc.pieces.push(...q.pieces.map((p) => ({ ...p, from: o })));
      return acc;
    },
    {
      alumM: 0,
      glassM2: 0,
      labor: 0,
      rollers: 0,
      handles: 0,
      hinges: 0,
      silicone: 0,
      pieces: [] as (CutPiece & { from: Opening })[],
    },
  );
}

export function glassSku(glass: string) {
  if (glass.includes("دبل")) return "GL-DBL";
  if (glass.includes("برونز")) return "GL-BRZ";
  return "GL-6";
}

export function alumSku(kind: WindowKind, color: string) {
  if (kind === "door") return "AL-DR-W";
  return color.includes("بني") ? "AL-SL-B" : "AL-SL-W";
}

export function priceJob(openings: Opening[], products: Product[]) {
  const t = jobTotals(openings);
  const find = (sku: string) => products.find((p) => p.sku === sku);
  const color = openings[0]?.color ?? "أبيض";
  const kind = openings[0]?.kind ?? "sliding";
  const glass = openings[0]?.glass ?? "";
  const alum = find(alumSku(kind, color));
  const gl = find(glassSku(glass));
  const rol = find("AC-ROL");
  const hnd = find("AC-HND");
  const hng = find("AC-HNG");
  const sil = find("CN-SIL");
  const materials =
    t.alumM * (alum?.price ?? 68) +
    t.glassM2 * (gl?.price ?? 64) +
    t.rollers * (rol?.price ?? 9) +
    t.handles * (hnd?.price ?? 22) +
    t.hinges * (hng?.price ?? 6) +
    t.silicone * (sil?.price ?? 14);
  const total = Math.round(materials + t.labor);
  return { ...t, total, alum, gl, rol, hnd, hng, sil };
}

export function alumDemand(openings: Opening[]) {
  const out: { label: string; lengthCm: number }[] = [];
  for (const o of openings) {
    for (const p of cutPieces(o)) {
      if (p.kind !== "alum") continue;
      for (let i = 0; i < p.count; i++) {
        out.push({ label: `${p.label} ${o.width}×${o.height}`, lengthCm: p.lengthCm });
      }
    }
  }
  return out;
}

export function materialCost(openings: Opening[], products: Product[]) {
  const t = jobTotals(openings);
  const find = (sku: string) => products.find((p) => p.sku === sku);
  const color = openings[0]?.color ?? "أبيض";
  const kind = openings[0]?.kind ?? "sliding";
  const glass = openings[0]?.glass ?? "";
  const alum = find(alumSku(kind, color));
  const gl = find(glassSku(glass));
  const rol = find("AC-ROL");
  const hnd = find("AC-HND");
  const hng = find("AC-HNG");
  const sil = find("CN-SIL");
  return Math.round(
    t.alumM * (alum?.cost ?? 42) +
      t.glassM2 * (gl?.cost ?? 38) +
      t.rollers * (rol?.cost ?? 4.5) +
      t.handles * (hnd?.cost ?? 11) +
      t.hinges * (hng?.cost ?? 3) +
      t.silicone * (sil?.cost ?? 8),
  );
}

export type PackedBar = {
  source: "new" | "remnant";
  startCm: number;
  cuts: { label: string; lengthCm: number }[];
  leftoverCm: number;
};

export type PackPlan = {
  bars: PackedBar[];
  newBars: number;
  remnantsUsed: number;
  remnantsOut: number[];
  wasteCm: number;
  usedCm: number;
  wastePct: number;
};

export function packCuts(
  demand: { label: string; lengthCm: number }[],
  remnantsCm: number[],
): PackPlan {
  const cuts = [...demand].sort((a, b) => b.lengthCm - a.lengthCm);
  type Bin = PackedBar;
  const bins: Bin[] = remnantsCm
    .filter((cm) => cm >= MIN_REMNANT_CM)
    .sort((a, b) => a - b)
    .map((cm) => ({ source: "remnant" as const, startCm: cm, cuts: [], leftoverCm: cm }));

  for (const cut of cuts) {
    const fit = bins
      .filter((b) => b.leftoverCm >= cut.lengthCm)
      .sort((a, b) => a.leftoverCm - b.leftoverCm)[0];
    if (fit) {
      fit.cuts.push(cut);
      fit.leftoverCm -= cut.lengthCm;
    } else {
      bins.push({
        source: "new",
        startCm: BAR_CM,
        cuts: [cut],
        leftoverCm: BAR_CM - cut.lengthCm,
      });
    }
  }

  const used = bins.filter((b) => b.cuts.length > 0);
  const remnantsOut = used.filter((b) => b.leftoverCm >= MIN_REMNANT_CM).map((b) => b.leftoverCm);
  const wasteCm = used.filter((b) => b.leftoverCm > 0 && b.leftoverCm < MIN_REMNANT_CM).reduce((s, b) => s + b.leftoverCm, 0);
  const usedCm = cuts.reduce((s, c) => s + c.lengthCm, 0);
  const inputCm = used.reduce((s, b) => s + b.startCm, 0);
  const newBars = used.filter((b) => b.source === "new").length;
  return {
    bars: used,
    newBars,
    remnantsUsed: used.filter((b) => b.source === "remnant").length,
    remnantsOut,
    wasteCm,
    usedCm,
    wastePct: inputCm === 0 ? 0 : Number(((wasteCm / inputCm) * 100).toFixed(1)),
  };
}
