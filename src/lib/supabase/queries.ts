import { createClient } from "@/lib/supabase/server";
import type { AppNotification, Pharmacy, PharmacyRole, Profile } from "@/lib/types/database";

export interface PharmacyContext {
  userId: string;
  email: string;
  profile: Profile;
  pharmacy: Pharmacy;
  role: PharmacyRole;
}

/**
 * The one call every dashboard page/layout starts with: who's signed in,
 * their profile, and the (single) pharmacy they belong to plus their role
 * there. Returns null if there's no session or no active membership yet —
 * callers redirect accordingly.
 */
export async function getPharmacyContext(): Promise<PharmacyContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("pharmacy_users")
      .select("role, pharmacies(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  const pharmacy = (membership as unknown as { role: PharmacyRole; pharmacies: Pharmacy } | null)?.pharmacies;
  const role = (membership as unknown as { role: PharmacyRole; pharmacies: Pharmacy } | null)?.role;

  if (!profile || !pharmacy || !role) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
    pharmacy,
    role,
  };
}

export interface AlertSummary {
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  expired: number;
}

/** Powers both the dashboard alert cards and the notification bell's live counts. */
export async function getAlertSummary(pharmacyId: string): Promise<AlertSummary> {
  const supabase = await createClient();
  const [lowStock, outOfStock, expiringSoon, expired] = await Promise.all([
    supabase
      .from("medicine_status")
      .select("id", { count: "exact", head: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("stock_status", "low_stock")
      .eq("status", "active"),
    supabase
      .from("medicine_status")
      .select("id", { count: "exact", head: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("stock_status", "out_of_stock")
      .eq("status", "active"),
    supabase
      .from("medicine_status")
      .select("id", { count: "exact", head: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("expiry_status", "expiring_soon"),
    supabase
      .from("medicine_status")
      .select("id", { count: "exact", head: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("expiry_status", "expired"),
  ]);

  return {
    lowStock: lowStock.count ?? 0,
    outOfStock: outOfStock.count ?? 0,
    expiringSoon: expiringSoon.count ?? 0,
    expired: expired.count ?? 0,
  };
}

export async function getRecentNotifications(pharmacyId: string, limit = 15): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
