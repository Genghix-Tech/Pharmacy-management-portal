import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/shared/access-denied";
import { PosClient } from "@/components/pos/pos-client";
import { getPharmacyContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/utils/permissions";

export const metadata: Metadata = { title: "POS" };

export default async function PosPage() {
  const context = await getPharmacyContext();
  if (!context) redirect("/login");
  if (!canAccess(context.role, "pos")) return <AccessDenied role={context.role} />;

  const supabase = await createClient();
  const [{ data: medicines }, { data: customers }] = await Promise.all([
    supabase
      .from("medicine_status")
      .select("id, name, generic_name, sku, barcode, selling_price, quantity, tax_rate, unit_type, stock_status")
      .eq("pharmacy_id", context.pharmacy.id)
      .eq("status", "active")
      .gt("quantity", 0)
      .order("name")
      .limit(24),
    supabase.from("customers").select("id, name, phone").eq("pharmacy_id", context.pharmacy.id).order("name"),
  ]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">New Sale</h1>
      <PosClient
        pharmacyId={context.pharmacy.id}
        currency={context.pharmacy.currency}
        initialMedicines={medicines ?? []}
        customers={customers ?? []}
      />
    </div>
  );
}
