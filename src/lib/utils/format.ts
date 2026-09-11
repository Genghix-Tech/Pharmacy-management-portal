import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function formatCurrency(amount: number | null | undefined, currency: string = "USD"): string {
  const value = amount ?? 0;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function toDate(date: string | Date): Date {
  return typeof date === "string" ? parseISO(date) : date;
}

export function formatDate(date: string | Date | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!date) return "—";
  const d = toDate(date);
  return isValid(d) ? format(d, pattern) : "—";
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = toDate(date);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const d = toDate(date);
  if (!isValid(d)) return null;
  const diff = d.getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
