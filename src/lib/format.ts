import { ar } from "date-fns/locale";
import { format } from "date-fns";

export function money(n: number) {
  const abs = Math.abs(Math.round(n));
  const formatted = new Intl.NumberFormat("en-US").format(abs);
  return n < 0 ? `−${formatted} ₪` : `${formatted} ₪`;
}

export function qty(n: number, digits = 2) {
  const rounded = Number(n.toFixed(digits));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(rounded);
}

export function dayLabel(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ar });
  } catch {
    return iso;
  }
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
