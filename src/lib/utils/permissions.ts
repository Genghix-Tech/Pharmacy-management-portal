import type { PharmacyRole } from "@/lib/types/database";

export const NAV_SECTIONS = [
  "dashboard",
  "pos",
  "inventory",
  "medicines",
  "categories",
  "suppliers",
  "customers",
  "sales",
  "invoices",
  "purchases",
  "expenses",
  "reports",
  "staff",
  "settings",
] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];

/**
 * Front-line permission map used to hide nav items the current role can't
 * use. This is a UX convenience only — every sensitive page and mutation
 * re-checks the role server-side (see `assertAccess` / `assertManager`
 * below and the RLS policies in supabase/migrations), so hiding a link here
 * is never the only thing standing between a role and data it shouldn't see.
 */
const ROLE_PERMISSIONS: Record<PharmacyRole, NavSection[] | "*"> = {
  owner: "*",
  manager: [
    "dashboard",
    "pos",
    "inventory",
    "medicines",
    "categories",
    "suppliers",
    "customers",
    "sales",
    "invoices",
    "purchases",
    "expenses",
    "reports",
    "settings",
  ],
  cashier: ["dashboard", "pos", "sales", "invoices", "customers"],
  inventory_manager: ["dashboard", "inventory", "medicines", "categories", "purchases", "suppliers"],
};

export function canAccess(role: PharmacyRole, section: NavSection): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed === "*" || allowed.includes(section);
}

export class AccessDeniedError extends Error {}

/** Server-side guard: throw (caught by the route's error boundary) if the role can't reach this section. */
export function assertAccess(role: PharmacyRole, section: NavSection) {
  if (!canAccess(role, section)) {
    throw new AccessDeniedError(
      `Your role (${roleLabel(role)}) does not have access to ${section.replace(/-/g, " ")}.`
    );
  }
}

/** For actions restricted to owner + manager (pharmacy settings, deleting records, etc.). */
export function assertManager(role: PharmacyRole) {
  if (role !== "owner" && role !== "manager") {
    throw new AccessDeniedError("Only an owner or manager can do this.");
  }
}

export function assertOwner(role: PharmacyRole) {
  if (role !== "owner") {
    throw new AccessDeniedError("Only the pharmacy owner can do this.");
  }
}

export function roleLabel(role: PharmacyRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "cashier":
      return "Cashier";
    case "inventory_manager":
      return "Inventory Manager";
  }
}
