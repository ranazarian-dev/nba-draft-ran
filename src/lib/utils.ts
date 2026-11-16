import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function pct(n: number | null | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function mean(vals: number[]): number | null {
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function median(vals: number[]): number | null {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}
