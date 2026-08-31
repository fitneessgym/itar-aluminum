import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return crypto.randomUUID();
}

export function isMostlyArabic(text: string) {
  const ar = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const la = (text.match(/[A-Za-z]/g) ?? []).length;
  return ar > la;
}
