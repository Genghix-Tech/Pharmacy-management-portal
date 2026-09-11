import type { ExpiryStatus, StockStatus } from "@/lib/types/database";

export const STOCK_STATUS_META: Record<StockStatus, { label: string; className: string }> = {
  in_stock: {
    label: "In Stock",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  low_stock: {
    label: "Low Stock",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  },
};

export const EXPIRY_STATUS_META: Record<ExpiryStatus, { label: string; className: string } | null> = {
  none: null,
  ok: null,
  expiring_soon: {
    label: "Expiring Soon",
    className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  },
  expired: {
    label: "Expired",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export const SALE_STATUS_META: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  refunded: {
    label: "Refunded",
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  },
  partially_refunded: {
    label: "Partially Refunded",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
};

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Salaries",
  "Transportation",
  "Maintenance",
  "Marketing",
  "Other",
];

export const UNIT_TYPES = [
  "tablet",
  "capsule",
  "bottle",
  "box",
  "strip",
  "vial",
  "tube",
  "ml",
  "pack",
  "unit",
];
